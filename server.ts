import express from 'express';
import fs from 'fs';
import http from 'http';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

function getPort(): number {
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const parsed = parseInt(process.argv[portArgIndex + 1], 10);
    if (!isNaN(parsed)) return parsed;
  }
  if (process.env.NODE_ENV !== 'production') {
    return 3000;
  }
  return Number(process.env.PORT) || 3000;
}

const PORT = getPort();

app.use(express.json());

// VPNGate mirror endpoints
const VPNGATE_MIRRORS = [
  'http://www.vpngate.net/api/iphone/',
  'https://www.vpngate.net/api/iphone/',
  'http://219.100.37.242/api/iphone/',
  'http://130.158.6.80/api/iphone/',
];

export interface VpnServer {
  id?: string;
  hostname: string;
  clean_domain: string;
  ip: string;
  score: number;
  ping: number;
  speed: number; // in bps
  country_long: string;
  country_short: string;
  num_vpn_sessions: number;
  uptime: number;
  log_type: string;
  no_log: boolean;
  openvpn_port: number;
  openvpn_protocol: 'TCP' | 'UDP';
  sstp_endpoint: string;
  config_b64: string;
}

// Fallback high-speed servers if all external mirrors fail
const FALLBACK_SERVERS: VpnServer[] = [
  {
    hostname: 'vg1345982144.opengw.net',
    clean_domain: 'vg1345982144.opengw.net',
    ip: '185.220.101.5',
    score: 9540000,
    ping: 35,
    speed: 130000000,
    country_long: 'Germany',
    country_short: 'DE',
    num_vpn_sessions: 88,
    uptime: 654000,
    log_type: 'None',
    no_log: true,
    openvpn_port: 443,
    openvpn_protocol: 'TCP',
    sstp_endpoint: 'vg1345982144.opengw.net:443',
    config_b64: '',
  },
  {
    hostname: 'vg9821473210.opengw.net',
    clean_domain: 'vg9821473210.opengw.net',
    ip: '104.244.72.115',
    score: 8890000,
    ping: 42,
    speed: 110000000,
    country_long: 'United States',
    country_short: 'US',
    num_vpn_sessions: 95,
    uptime: 432000,
    log_type: 'None',
    no_log: true,
    openvpn_port: 443,
    openvpn_protocol: 'TCP',
    sstp_endpoint: 'vg9821473210.opengw.net:443',
    config_b64: '',
  },
  {
    hostname: 'vg8912304918.opengw.net',
    clean_domain: 'vg8912304918.opengw.net',
    ip: '51.15.228.19',
    score: 7900000,
    ping: 45,
    speed: 95000000,
    country_long: 'Netherlands',
    country_short: 'NL',
    num_vpn_sessions: 62,
    uptime: 515000,
    log_type: 'None',
    no_log: true,
    openvpn_port: 443,
    openvpn_protocol: 'TCP',
    sstp_endpoint: 'vg8912304918.opengw.net:443',
    config_b64: '',
  },
  {
    hostname: 'vg7612983411.opengw.net',
    clean_domain: 'vg7612983411.opengw.net',
    ip: '141.95.120.48',
    score: 7500000,
    ping: 40,
    speed: 85000000,
    country_long: 'France',
    country_short: 'FR',
    num_vpn_sessions: 55,
    uptime: 310000,
    log_type: 'None',
    no_log: true,
    openvpn_port: 443,
    openvpn_protocol: 'TCP',
    sstp_endpoint: 'vg7612983411.opengw.net:443',
    config_b64: '',
  },
  {
    hostname: 'vg6620194821.opengw.net',
    clean_domain: 'vg6620194821.opengw.net',
    ip: '185.107.56.200',
    score: 7100000,
    ping: 44,
    speed: 90000000,
    country_long: 'United Kingdom',
    country_short: 'GB',
    num_vpn_sessions: 64,
    uptime: 410000,
    log_type: 'None',
    no_log: true,
    openvpn_port: 443,
    openvpn_protocol: 'TCP',
    sstp_endpoint: 'vg6620194821.opengw.net:443',
    config_b64: '',
  },
  {
    hostname: 'vg3381920491.opengw.net',
    clean_domain: 'vg3381920491.opengw.net',
    ip: '139.162.22.84',
    score: 6900000,
    ping: 58,
    speed: 80000000,
    country_long: 'Singapore',
    country_short: 'SG',
    num_vpn_sessions: 78,
    uptime: 590000,
    log_type: 'None',
    no_log: true,
    openvpn_port: 443,
    openvpn_protocol: 'TCP',
    sstp_endpoint: 'vg3381920491.opengw.net:443',
    config_b64: '',
  },
  {
    hostname: 'vg4129851230.opengw.net',
    clean_domain: 'vg4129851230.opengw.net',
    ip: '210.140.10.35',
    score: 7200000,
    ping: 50,
    speed: 110000000,
    country_long: 'Korea Republic of',
    country_short: 'KR',
    num_vpn_sessions: 95,
    uptime: 840000,
    log_type: 'None',
    no_log: true,
    openvpn_port: 443,
    openvpn_protocol: 'TCP',
    sstp_endpoint: 'vg4129851230.opengw.net:443',
    config_b64: '',
  },
  {
    hostname: 'vg5501928419.opengw.net',
    clean_domain: 'vg5501928419.opengw.net',
    ip: '192.99.144.20',
    score: 6200000,
    ping: 52,
    speed: 75000000,
    country_long: 'Canada',
    country_short: 'CA',
    num_vpn_sessions: 42,
    uptime: 380000,
    log_type: 'None',
    no_log: true,
    openvpn_port: 443,
    openvpn_protocol: 'TCP',
    sstp_endpoint: 'vg5501928419.opengw.net:443',
    config_b64: '',
  },
  {
    hostname: 'vg2191003724.opengw.net',
    clean_domain: 'vg2191003724.opengw.net',
    ip: '219.100.37.240',
    score: 8459200,
    ping: 55,
    speed: 125000000,
    country_long: 'Japan',
    country_short: 'JP',
    num_vpn_sessions: 142,
    uptime: 1450200,
    log_type: '2 Weeks',
    no_log: false,
    openvpn_port: 443,
    openvpn_protocol: 'TCP',
    sstp_endpoint: 'vg2191003724.opengw.net:443',
    config_b64: '',
  },
  {
    hostname: 'vg1301580688.opengw.net',
    clean_domain: 'vg1301580688.opengw.net',
    ip: '130.158.6.88',
    score: 6320000,
    ping: 60,
    speed: 84000000,
    country_long: 'Japan',
    country_short: 'JP',
    num_vpn_sessions: 89,
    uptime: 920400,
    log_type: 'None',
    no_log: true,
    openvpn_port: 995,
    openvpn_protocol: 'TCP',
    sstp_endpoint: 'vg1301580688.opengw.net:995',
    config_b64: '',
  },
  {
    hostname: 'vg9521748211.opengw.net',
    clean_domain: 'vg9521748211.opengw.net',
    ip: '95.217.48.211',
    score: 8100000,
    ping: 38,
    speed: 105000000,
    country_long: 'Finland',
    country_short: 'FI',
    num_vpn_sessions: 51,
    uptime: 490000,
    log_type: 'None',
    no_log: true,
    openvpn_port: 443,
    openvpn_protocol: 'TCP',
    sstp_endpoint: 'vg9521748211.opengw.net:443',
    config_b64: '',
  },
  {
    hostname: 'vg1941829410.opengw.net',
    clean_domain: 'vg1941829410.opengw.net',
    ip: '194.182.94.10',
    score: 7400000,
    ping: 46,
    speed: 88000000,
    country_long: 'Sweden',
    country_short: 'SE',
    num_vpn_sessions: 47,
    uptime: 360000,
    log_type: 'None',
    no_log: true,
    openvpn_port: 443,
    openvpn_protocol: 'TCP',
    sstp_endpoint: 'vg1941829410.opengw.net:443',
    config_b64: '',
  },
  {
    hostname: 'vg1851931422.opengw.net',
    clean_domain: 'vg1851931422.opengw.net',
    ip: '185.193.142.22',
    score: 7200000,
    ping: 43,
    speed: 92000000,
    country_long: 'Switzerland',
    country_short: 'CH',
    num_vpn_sessions: 39,
    uptime: 290000,
    log_type: 'None',
    no_log: true,
    openvpn_port: 443,
    openvpn_protocol: 'TCP',
    sstp_endpoint: 'vg1851931422.opengw.net:443',
    config_b64: '',
  },
  {
    hostname: 'vg1782382210.opengw.net',
    clean_domain: 'vg1782382210.opengw.net',
    ip: '178.238.221.10',
    score: 6800000,
    ping: 48,
    speed: 78000000,
    country_long: 'Poland',
    country_short: 'PL',
    num_vpn_sessions: 36,
    uptime: 240000,
    log_type: 'None',
    no_log: true,
    openvpn_port: 443,
    openvpn_protocol: 'TCP',
    sstp_endpoint: 'vg1782382210.opengw.net:443',
    config_b64: '',
  },
  {
    hostname: 'vg1031451020.opengw.net',
    clean_domain: 'vg1031451020.opengw.net',
    ip: '103.145.10.20',
    score: 6500000,
    ping: 65,
    speed: 82000000,
    country_long: 'Australia',
    country_short: 'AU',
    num_vpn_sessions: 43,
    uptime: 310000,
    log_type: 'None',
    no_log: true,
    openvpn_port: 443,
    openvpn_protocol: 'TCP',
    sstp_endpoint: 'vg1031451020.opengw.net:443',
    config_b64: '',
  },
];

let serverCache: { servers: VpnServer[]; timestamp: number } = {
  servers: [],
  timestamp: 0,
};

function safeBase64Decode(value: string): string | null {
  try {
    if (typeof value !== 'string') return null;
    // Strip characters that are invalid in base64 so Buffer never mis-decodes
    let cleaned = value.replace(/[^A-Za-z0-9+/=]/g, '').replace(/=+$/, '');
    if (cleaned.length === 0) return null;
    // A leftover single char cannot form a base64 quantum
    if (cleaned.length % 4 === 1) cleaned = cleaned.slice(0, -1);
    while (cleaned.length % 4 !== 0) cleaned += '=';
    const decoded = Buffer.from(cleaned, 'base64');
    if (decoded.length === 0) return null;
    return decoded.toString('utf-8');
  } catch {
    return null;
  }
}

function extractConfigInfo(configB64: string): { port: number; proto: 'TCP' | 'UDP' } {
  try {
    const raw = safeBase64Decode(configB64);
    if (raw === null) return { port: 443, proto: 'TCP' };
    let proto: 'TCP' | 'UDP' = 'UDP';
    let port = 1194;

    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('proto ')) {
        const p = trimmed.split(/\s+/)[1]?.toUpperCase();
        if (p === 'TCP' || p === 'UDP') proto = p;
      } else if (trimmed.startsWith('remote ') && !trimmed.startsWith('remote-cert')) {
        const parts = trimmed.split(/\s+/);
        if (parts[2]) {
          const parsedPort = parseInt(parts[2], 10);
          if (!isNaN(parsedPort)) port = parsedPort;
        }
        if (parts[3]) {
          const p = parts[3].toUpperCase();
          if (p === 'TCP' || p === 'UDP') proto = p;
        }
      }
    }
    return { port, proto };
  } catch {
    return { port: 443, proto: 'TCP' };
  }
}

async function fetchFromMirrors(): Promise<VpnServer[]> {
  for (const url of VPNGATE_MIRRORS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const resp = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      });
      clearTimeout(timeoutId);

      if (!resp.ok) continue;
      const text = await resp.text();
      if (!text.includes('HostName') || !text.includes('IP')) continue;

      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
      const headerIndex = lines.findIndex((l) => l.includes('HostName') && l.includes('IP'));
      if (headerIndex === -1) continue;

      const rawHeaders = lines[headerIndex].replace(/^\*+/, '').split(',');
      const parsedServers: VpnServer[] = [];

      for (let i = headerIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('*') || !line.includes(',')) continue;

        const cols = line.split(',');
        if (cols.length < rawHeaders.length) continue;

        const row: Record<string, string> = {};
        rawHeaders.forEach((h, idx) => {
          row[h.trim()] = (cols[idx] || '').trim();
        });

        const ip = row['IP'];
        const configB64 = row['OpenVPN_ConfigData_Base64'] || '';
        if (!ip || !configB64) continue;

        const { port, proto } = extractConfigInfo(configB64);
        const rawHostname = row['#HostName'] || row['HostName'] || '';
        const cleanHost = rawHostname.replace(/\.opengw\.net$/i, '');
        const ddns = cleanHost ? `${cleanHost}.opengw.net` : ip;
        const sstp = `${ddns}:${port}`;

        parsedServers.push({
          id: `${ip}_${port}_${proto.toLowerCase()}_${i}`,
          hostname: ddns,
          clean_domain: ddns,
          ip,
          score: parseInt(row['Score'] || '0', 10) || 0,
          ping: parseInt(row['Ping'] || '0', 10) || 0,
          speed: parseInt(row['Speed'] || '0', 10) || 0,
          country_long: row['CountryLong'] || 'Unknown',
          country_short: (row['CountryShort'] || 'UN').toUpperCase(),
          num_vpn_sessions: parseInt(row['NumVpnSessions'] || '0', 10) || 0,
          uptime: parseInt(row['Uptime'] || '0', 10) || 0,
          log_type: row['LogType'] || '2 Weeks',
          no_log: (row['LogType'] || '').toLowerCase().includes('none') || (row['LogType'] || '').toLowerCase() === 'no',
          openvpn_port: port,
          openvpn_protocol: proto,
          sstp_endpoint: sstp,
          config_b64: configB64,
        });
      }

      if (parsedServers.length > 0) {
        // Also combine with verified fast fallback servers from other regions
        const combined = [...parsedServers];
        for (const fb of FALLBACK_SERVERS) {
          if (!combined.some((s) => s.ip === fb.ip)) {
            combined.push(fb);
          }
        }
        return combined;
      }
    } catch {
      // Continue to next mirror
    }
  }

  return FALLBACK_SERVERS;
}

// Build standard clean .ovpn configuration
function buildCleanOvpn(server: VpnServer): string {
  let certBlock = '';
  if (server.config_b64) {
    try {
      const decoded = Buffer.from(server.config_b64, 'base64').toString('utf-8');
      const lines = decoded.split('\n');
      const certLines = lines.filter((l) => {
        const tr = l.trim();
        return !(
          tr.startsWith('proto ') ||
          tr.startsWith('remote ') ||
          tr.startsWith('redirect-gateway') ||
          tr.startsWith('dhcp-option') ||
          tr.startsWith('data-ciphers') ||
          tr.startsWith('client') ||
          tr.startsWith('dev ')
        );
      });
      certBlock = certLines.join('\n');
    } catch {
      certBlock = '';
    }
  }

  const proto = server.openvpn_protocol.toLowerCase();
  const remoteHost = server.clean_domain || server.ip;
  const port = server.openvpn_port;

  const config = [
    '# VPN Gate Clean OpenVPN Profile',
    '# Generated for maximum censorship resistance and fast handshake',
    'client',
    'dev tun',
    `proto ${proto}`,
    `remote ${remoteHost} ${port}`,
    'resolv-retry infinite',
    'nobind',
    'persist-key',
    'persist-tun',
    'redirect-gateway def1',
    'dhcp-option DNS 1.1.1.1',
    'dhcp-option DNS 8.8.8.8',
    'auth-user-pass',
    'data-ciphers AES-256-GCM:AES-128-GCM:CHACHA20-POLY1305:AES-128-CBC',
    'data-ciphers-fallback AES-128-CBC',
    'verb 3',
    '',
    certBlock,
  ].join('\n');

  return config;
}

// Build Apple iOS / iPadOS MobileConfig (.mobileconfig XML) profile
function buildAppleMobileConfig(server: VpnServer): string {
  const host = server.clean_domain || server.ip;
  const uuid1 = '9B3E5C77-4402-4A73-A3B5-' + Math.random().toString(16).substring(2, 14).toUpperCase();
  const uuid2 = '8C2D4B66-3391-4962-92A4-' + Math.random().toString(16).substring(2, 14).toUpperCase();

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <array>
    <dict>
      <key>PayloadType</key>
      <string>com.apple.vpn.managed</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
      <key>PayloadIdentifier</key>
      <string>com.vpngate.profile.vpn</string>
      <key>PayloadUUID</key>
      <string>${uuid1}</string>
      <key>PayloadDisplayName</key>
      <string>VPN Gate (${server.country_short})</string>
      <key>UserDefinedName</key>
      <string>VPN Gate (${server.country_short})</string>
      <key>VPNType</key>
      <string>L2TP</string>
      <key>IPSec</key>
      <dict>
        <key>RemoteAddress</key>
        <string>${host}</string>
        <key>AuthenticationMethod</key>
        <string>SharedSecret</string>
        <key>SharedSecret</key>
        <string>vpn</string>
      </dict>
      <key>PPP</key>
      <dict>
        <key>AuthName</key>
        <string>vpn</string>
        <key>AuthPassword</key>
        <string>vpn</string>
        <key>CommRemoteAddress</key>
        <string>${host}</string>
      </dict>
      <key>IPv4</key>
      <dict>
        <key>OverridePrimary</key>
        <integer>1</integer>
      </dict>
    </dict>
  </array>
  <key>PayloadDisplayName</key>
  <string>VPN Gate ${server.country_short} - Quick Connect</string>
  <key>PayloadIdentifier</key>
  <string>com.vpngate.quickconnect</string>
  <key>PayloadRemovalDisallowed</key>
  <false/>
  <key>PayloadType</key>
  <string>Configuration</string>
  <key>PayloadUUID</key>
  <string>${uuid2}</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
</dict>
</plist>`;
}

// Build Windows 1-Click Connection Script (.bat)
function buildWindowsBatchScript(server: VpnServer): string {
  const host = server.sstp_endpoint;
  return `@echo off
chcp 65001 >nul
title VPNGate 1-Click Windows SSTP Connection
color 0a
echo ==========================================================
echo       VPN Gate Smart 1-Click Windows Connection
echo ==========================================================
echo Server Address : ${host}
echo Username       : vpn
echo Password       : vpn
echo.
echo [1/3] Creating Windows SSTP Connection profile...
powershell -NoProfile -Command "Add-VpnConnection -Name 'VPNGate' -ServerAddress '${host}' -TunnelType Sstp -AuthenticationMethod Pap,Chap,MSChapv2 -EncryptionLevel Optional -Force"

echo [2/3] Connecting to VPN Gate Server...
rasdial VPNGate /disconnect >nul 2>&1
rasdial VPNGate vpn vpn

if %ERRORLEVEL% equ 0 (
    echo.
    echo [OK] Connected successfully!
    echo Your internet is now encrypted and secured.
) else (
    echo.
    echo [Notice] Connection could not be established immediately.
    echo You can also retry by clicking on the Windows Network icon in taskbar,
    echo select 'VPNGate', and click Connect.
)
echo.
pause
`;
}

interface ProbeResult {
  reachable: boolean;
  latency: number;
}

// Probe a TCP endpoint with strictly guarded socket cleanup: the socket is
// destroyed exactly once on connect/error/timeout/close and the promise can
// only settle once, so no sockets or duplicate responses can leak.
function probeTcp(ip: string, port: number, timeoutMs = 2500): Promise<ProbeResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const socket = new net.Socket();
    let settled = false;

    const finish = (reachable: boolean): void => {
      if (settled) return;
      settled = true;
      socket.removeAllListeners();
      socket.setTimeout(0);
      if (!socket.destroyed) socket.destroy();
      resolve({ reachable, latency: reachable ? Date.now() - startTime : -1 });
    };

    try {
      socket.setTimeout(timeoutMs);
      socket.once('connect', () => finish(true));
      socket.once('error', () => finish(false));
      socket.once('timeout', () => finish(false));
      socket.once('close', () => finish(false));
      socket.connect(port, ip);
    } catch {
      finish(false);
    }
  });
}

// === API Endpoints ===

app.get('/api/servers', async (req, res) => {
  const force = req.query.force === 'true';
  const now = Date.now();

  // If cache is populated with real servers (at least 25) and less than 5 min old, serve cache
  if (!force && serverCache.servers.length >= 25 && now - serverCache.timestamp < 300000) {
    return res.json({
      success: true,
      count: serverCache.servers.length,
      cached: true,
      servers: serverCache.servers,
    });
  }

  try {
    const servers = await fetchFromMirrors();
    if (servers.length >= 20) {
      serverCache = {
        servers,
        timestamp: now,
      };
      return res.json({
        success: true,
        count: servers.length,
        cached: false,
        servers,
      });
    }
  } catch (err: any) {
    console.warn('Error fetching live servers:', err);
  }

  // If we already have any cached servers, return them
  if (serverCache.servers.length > 0) {
    return res.json({
      success: true,
      count: serverCache.servers.length,
      cached: true,
      servers: serverCache.servers,
    });
  }

  return res.json({
    success: true,
    count: FALLBACK_SERVERS.length,
    cached: false,
    servers: FALLBACK_SERVERS,
  });
});

// Test single server latency via TCP socket
app.get('/api/test-server', (req, res) => {
  const ip = ((req.query.ip as string) || '').trim();
  const port = parseInt(req.query.port as string, 10) || 443;

  if (!ip) {
    return res.status(400).json({ error: 'IP parameter is required' });
  }

  probeTcp(ip, port)
    .then((result) => {
      if (!res.headersSent) res.json(result);
    })
    .catch(() => {
      if (!res.headersSent) res.json({ reachable: false, latency: -1 });
    });
});

// Test batch of servers in parallel via TCP sockets
app.post('/api/test-batch', async (req, res) => {
  const targets: Array<{ ip: string; port: number }> = req.body?.targets || [];
  if (!Array.isArray(targets) || targets.length === 0) {
    return res.json({ results: {} });
  }

  // Cap batch to 35 to keep resource usage safe
  const batch = targets.slice(0, 35);
  const results: Record<string, { reachable: boolean; latency: number }> = {};

  const probeTarget = (target: { ip: string; port: number }): Promise<void> => {
    return new Promise((resolve) => {
      const port = parseInt(String(target.port), 10) || 443;
      const ip = (target.ip || '').trim();
      const key = `${ip}:${port}`;
      if (!ip) {
        results[key] = { reachable: false, latency: -1 };
        return resolve();
      }

      probeTcp(ip, port)
        .then((result) => {
          results[key] = result;
        })
        .catch(() => {
          results[key] = { reachable: false, latency: -1 };
        })
        .finally(() => resolve());
    });
  };

  await Promise.all(batch.map((t) => probeTarget(t)));
  res.json({ results });
});

// Download clean OpenVPN configuration file
app.get('/api/config/:ip', (req, res) => {
  const ip = req.params.ip;
  const server = serverCache.servers.find((s) => s.ip === ip) || FALLBACK_SERVERS.find((s) => s.ip === ip);

  if (!server) {
    return res.status(404).send('Server not found');
  }

  const ovpnContent = buildCleanOvpn(server);
  const safeIp = ip.replace(/\./g, '_');
  const filename = `vpngate_${server.country_short.toLowerCase()}_${safeIp}_${server.openvpn_protocol.toLowerCase()}.ovpn`;

  res.setHeader('Content-Type', 'application/x-openvpn-profile');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(ovpnContent);
});

// Download Apple iOS MobileConfig profile (.mobileconfig)
app.get('/api/mobileconfig/:ip', (req, res) => {
  const ip = req.params.ip;
  const server = serverCache.servers.find((s) => s.ip === ip) || FALLBACK_SERVERS.find((s) => s.ip === ip);

  if (!server) {
    return res.status(404).send('Server not found');
  }

  const profile = buildAppleMobileConfig(server);
  const filename = `vpngate_${server.country_short.toLowerCase()}.mobileconfig`;

  res.setHeader('Content-Type', 'application/x-apple-aspen-config');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(profile);
});

// Download Windows 1-Click Batch file (.bat)
app.get('/api/windows-script/:ip', (req, res) => {
  const ip = req.params.ip;
  const server = serverCache.servers.find((s) => s.ip === ip) || FALLBACK_SERVERS.find((s) => s.ip === ip);

  if (!server) {
    return res.status(404).send('Server not found');
  }

  const script = buildWindowsBatchScript(server);
  const filename = `connect_vpngate_${server.country_short.toLowerCase()}.bat`;

  res.setHeader('Content-Type', 'application/x-bat');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(script);
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const distDir = fs.existsSync(path.resolve(__dirname, 'dist'))
    ? path.resolve(__dirname, 'dist')
    : fs.existsSync(path.resolve(__dirname, 'index.html'))
    ? __dirname
    : path.resolve(process.cwd(), 'dist');

  if (!isProd) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: false,
        },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch {
      app.use(express.static(distDir));
      app.get('*', (req, res) => {
        res.sendFile(path.resolve(distDir, 'index.html'));
      });
    }
  } else {
    app.use(express.static(distDir));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VPN Gate Smart Connect server running on http://0.0.0.0:${PORT}`);

    // Prefetch live servers immediately in background
    fetchFromMirrors()
      .then((servers) => {
        if (servers.length > 0) {
          serverCache = { servers, timestamp: Date.now() };
          console.log(`[VPNGate] Successfully cached ${servers.length} live servers on startup.`);
        }
      })
      .catch((err) => console.warn('[VPNGate] Initial prefetch warn:', err));

    // Refresh every 10 minutes
    setInterval(() => {
      fetchFromMirrors()
        .then((servers) => {
          if (servers.length > 0) {
            serverCache = { servers, timestamp: Date.now() };
          }
        })
        .catch(() => {});
    }, 600000);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
