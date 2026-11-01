import { VpnServer } from '../types/vpn';

const GITHUB_SERVERS_URL = 'https://raw.githubusercontent.com/alidarabigit-png/vpn-gate/fix/github-server-feed/public/servers.json';
const LOCAL_STORAGE_KEY = 'vpngate_cached_servers_v3';

export interface FetchResult {
  servers: VpnServer[];
  source: 'cache' | 'backend' | 'github';
}

function isValidServerList(data: any): data is { servers: VpnServer[]; timestamp?: number } {
  return !!data && Array.isArray(data.servers) && data.servers.length >= 10 &&
    data.servers.every((server: any) => server && typeof server.ip === 'string' &&
      /^(\d{1,3}\.){3}\d{1,3}$/.test(server.ip) &&
      Number.isInteger(Number(server.openvpn_port)) &&
      Number(server.openvpn_port) >= 1 && Number(server.openvpn_port) <= 65535 &&
      (server.openvpn_protocol === 'TCP' || server.openvpn_protocol === 'UDP') &&
      typeof server.config_b64 === 'string' && server.config_b64.length > 0);
}

export function getLocalCachedServers(): VpnServer[] | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return isValidServerList(data) ? data.servers : null;
  } catch (error) {
    console.warn('Failed to read cached VPN servers:', error);
    return null;
  }
}

export function setLocalCachedServers(servers: VpnServer[]): void {
  if (!isValidServerList({ servers })) return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
      timestamp: Date.now(),
      count: servers.length,
      servers,
    }));
  } catch (error) {
    console.warn('Failed to save cached VPN servers:', error);
  }
}

export async function fetchServersSmart(force = false): Promise<FetchResult> {
  // GitHub Actions is the only upstream collector; the browser never contacts VPN Gate directly.
  try {
    const response = await fetch(GITHUB_SERVERS_URL + '?t=' + (force ? Date.now() : ''), {
      signal: AbortSignal.timeout(10000),
      cache: 'no-store',
    });
    if (!response.ok) throw new Error('GitHub HTTP ' + response.status);
    const data = await response.json();
    if (!isValidServerList(data)) throw new Error('GitHub server feed is empty or invalid');
    setLocalCachedServers(data.servers);
    return { servers: data.servers, source: 'github' };
  } catch (error) {
    console.warn('GitHub server feed unavailable; trying local backend:', error);
  }

  try {
    const response = await fetch('/api/servers?force=' + force, {
      signal: AbortSignal.timeout(12000),
      cache: 'no-store',
    });
    if (!response.ok) throw new Error('Backend HTTP ' + response.status);
    const data = await response.json();
    if (!isValidServerList(data)) throw new Error('Backend server list is empty or invalid');
    setLocalCachedServers(data.servers);
    return { servers: data.servers, source: 'backend' };
  } catch (error) {
    console.warn('Backend server feed unavailable:', error);
  }

  const cached = getLocalCachedServers();
  if (cached && cached.length >= 10) return { servers: cached, source: 'cache' };

  throw new Error('No valid server list is available from GitHub, backend, or local cache.');
}
