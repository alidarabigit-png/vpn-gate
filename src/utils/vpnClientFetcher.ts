import { VpnServer } from '../types/vpn';
import { FALLBACK_SERVERS } from '../data/fallbackServers';

const LOCAL_STORAGE_KEY = 'vpngate_cached_servers_v2';
const CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000; // 6 hours

export interface FetchResult {
  servers: VpnServer[];
  source: 'cache' | 'backend' | 'cors_proxy' | 'fallback';
  proxyUrl?: string;
}

/**
 * Load cached servers from browser localStorage
 */
export function getLocalCachedServers(): VpnServer[] | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.servers) && parsed.servers.length > 0) {
      return parsed.servers;
    }
  } catch (err) {
    console.warn('Failed to read localStorage servers:', err);
  }
  return null;
}

/**
 * Save servers to browser localStorage
 */
export function setLocalCachedServers(servers: VpnServer[]): void {
  try {
    if (!servers || servers.length === 0) return;
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        count: servers.length,
        servers,
      })
    );
  } catch (err) {
    console.warn('Failed to write localStorage servers:', err);
  }
}

/**
 * Parse VPNGate CSV data on the client side
 */
export function parseClientVpnGateCsv(csvText: string): VpnServer[] {
  if (!csvText || typeof csvText !== 'string') return [];

  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const servers: VpnServer[] = [];
  const seenIps = new Set<string>();

  for (const line of lines) {
    if (line.startsWith('*') || line.startsWith('#')) {
      continue;
    }

    const cols = line.split(',');
    if (cols.length < 14) continue;

    const hostname = cols[0];
    const ip = cols[1];
    const score = parseInt(cols[2], 10) || 0;
    const ping = parseInt(cols[3], 10) || 0;
    const speed = parseInt(cols[4], 10) || 0;
    const country_long = cols[5] || 'Unknown';
    const country_short = cols[6] || 'UN';
    const num_vpn_sessions = parseInt(cols[7], 10) || 0;
    const uptime = parseInt(cols[8], 10) || 0;
    const total_users = parseInt(cols[9], 10) || 0;
    const total_traffic = cols[10] || '';
    const log_type = cols[11] || '';
    const operator = cols[12] || '';
    const message = cols[13] || '';
    const config_b64 = cols[14] || '';

    // Validate IP
    if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) continue;

    // Detect protocol and port
    let openvpn_protocol: 'TCP' | 'UDP' = 'TCP';
    let openvpn_port = 443;

    if (config_b64) {
      try {
        const decoded = atob(config_b64.slice(0, 800));
        const protoMatch = decoded.match(/proto\s+(tcp|udp)/i);
        if (protoMatch) {
          openvpn_protocol = protoMatch[1].toUpperCase() as 'TCP' | 'UDP';
        }
        const portMatch = decoded.match(/remote\s+[\w.-]+\s+(\d+)/i);
        if (portMatch) {
          openvpn_port = parseInt(portMatch[1], 10) || 443;
        }
      } catch {
        // use defaults
      }
    }

    const clean_domain = hostname.includes('.') ? hostname : `${ip}.opengw.net`;
    const sstp_endpoint = `${clean_domain}:${openvpn_port || 443}`;
    const key = `${ip}_${openvpn_port}_${openvpn_protocol.toLowerCase()}`;

    if (!seenIps.has(key)) {
      seenIps.add(key);
      servers.push({
        id: key,
        hostname,
        clean_domain,
        ip,
        score,
        ping,
        speed,
        country_long,
        country_short,
        num_vpn_sessions,
        uptime,
        log_type: log_type || 'None',
        no_log: !log_type || log_type.toLowerCase().includes('none'),
        openvpn_protocol,
        openvpn_port,
        sstp_endpoint,
        config_b64,
      });
    }
  }

  // Sort by score and speed
  servers.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.speed - a.speed;
  });

  return servers;
}

/**
 * Smart Multi-Fallback Fetcher:
 * 1. Tries primary backend API `/api/servers` (runs on Cloud Run with backend cache)
 * 2. If backend fails, falls back to direct client-side CORS proxies
 * 3. Caches successful results in localStorage
 * 4. Falls back to localStorage or rich static seed list
 */
export async function fetchServersSmart(force: boolean = false): Promise<FetchResult> {
  // 1. Primary: Backend API (on Cloud Run, unblocked outside Iran)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`/api/servers?force=${force}`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.servers) && data.servers.length >= 15) {
        setLocalCachedServers(data.servers);
        return { servers: data.servers, source: 'backend' };
      }
    }
  } catch (err) {
    console.warn('Backend /api/servers failed, attempting CORS proxies...', err);
  }

  // 2. Client-Side CORS Proxies
  const TARGET_URL = 'http://www.vpngate.net/api/iphone/';
  const CORS_PROXIES = [
    {
      name: 'allorigins_raw',
      url: `https://api.allorigins.win/raw?url=${encodeURIComponent(TARGET_URL)}`,
      extract: async (r: Response) => r.text(),
    },
    {
      name: 'codetabs',
      url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(TARGET_URL)}`,
      extract: async (r: Response) => r.text(),
    },
    {
      name: 'corsproxy_io',
      url: `https://corsproxy.io/?${encodeURIComponent(TARGET_URL)}`,
      extract: async (r: Response) => r.text(),
    },
    {
      name: 'allorigins_json',
      url: `https://api.allorigins.win/get?url=${encodeURIComponent(TARGET_URL)}`,
      extract: async (r: Response) => {
        const json = await r.json();
        return json.contents || '';
      },
    },
  ];

  for (const proxy of CORS_PROXIES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      const res = await fetch(proxy.url, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const text = await proxy.extract(res);
        if (text && text.includes('HostName') && text.includes('IP')) {
          const parsed = parseClientVpnGateCsv(text);
          if (parsed.length >= 10) {
            setLocalCachedServers(parsed);
            return {
              servers: parsed,
              source: 'cors_proxy',
              proxyUrl: proxy.name,
            };
          }
        }
      }
    } catch (err) {
      console.warn(`Proxy ${proxy.name} failed:`, err);
    }
  }

  // 3. Fallback to localStorage cached data
  const cached = getLocalCachedServers();
  if (cached && cached.length > 0) {
    return { servers: cached, source: 'cache' };
  }

  // 4. Ultimate fallback to rich preloaded servers
  return { servers: FALLBACK_SERVERS, source: 'fallback' };
}
