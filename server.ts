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

const GITHUB_SERVERS_URL = 'https://raw.githubusercontent.com/alidarabigit-png/vpn-gate/fix/github-server-feed/public/servers.json';
const SERVER_FILE = path.resolve(__dirname, 'public', 'servers.json');

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

let serverCache: { servers: VpnServer[]; timestamp: number; source: string } = { servers: [], timestamp: 0, source: 'none' };

let serverCache: { servers: VpnServer[]; timestamp: number } = {
  servers: [],
  timestamp: 0,
};

function extractConfigInfo(configB64: string): { port: number; proto: 'TCP' | 'UDP' } {
  try {
    const raw = Buffer.from(configB64, 'base64').toString('utf-8');
    let proto: 'TCP' | 'UDP' = 'UDP';
    let port = 1194;

    for (const line of raw.split('serverCache.servers.find((s) => s.ip === ip)n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('proto ')) {
        const p = trimmed.split(/serverCache.servers.find((s) => s.ip === ip)s+/)[1]?.toUpperCase();
        if (p === 'TCP' || p === 'UDP') proto = p;
      } else if (trimmed.startsWith('remote ') && !trimmed.startsWith('remote-cert')) {
        const parts = trimmed.split(/serverCache.servers.find((s) => s.ip === ip)s+/);
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

function validList(data: any): data is { servers: VpnServer[]; timestamp?: number } {
  return !!data && Array.isArray(data.servers) && data.servers.length >= 10 &&
    data.servers.every((v: any) => v && typeof v.ip === 'string' &&
      /^(serverCache.servers.find((s) => s.ip === ip)serverCache.servers.find((s) => s.ip === ip)d{1,3}serverCache.servers.find((s) => s.ip === ip)serverCache.servers.find((s) => s.ip === ip).){3}serverCache.servers.find((s) => s.ip === ip)serverCache.servers.find((s) => s.ip === ip)d{1,3}$/.test(v.ip) &&
      Number.isInteger(Number(v.openvpn_port)) && Number(v.openvpn_port) > 0 &&
      Number(v.openvpn_port) <= 65535 &&
      (v.openvpn_protocol === 'TCP' || v.openvpn_protocol === 'UDP') &&
      typeof v.config_b64 === 'string' && v.config_b64.length > 0);
}
function loadDiskCache(): boolean {
  try {
    if (!fs.existsSync(SERVER_FILE)) return false;
    const data = JSON.parse(fs.readFileSync(SERVER_FILE, 'utf8'));
    if (!validList(data)) return false;
    serverCache = { servers: data.servers, timestamp: Number(data.timestamp) || 0, source: 'disk-cache' };
    return true;
  } catch { return false; }
}
async function refreshServers(force = false): Promise<typeof serverCache> {
  if (!force && serverCache.servers.length >= 10 && Date.now() - serverCache.timestamp < 300000) return serverCache;
  try {
    const response = await fetch(GITHUB_SERVERS_URL + '?t=' + Date.now(), {
      headers: { 'User-Agent': 'VPN-Gate-Smart-Connect/1.0' },
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) throw new Error('GitHub HTTP ' + response.status);
    const data = await response.json();
    if (!validList(data)) throw new Error('Invalid or empty GitHub server feed');
    serverCache = { servers: data.servers, timestamp: Number(data.timestamp) || Date.now(), source: 'github-actions' };
    fs.mkdirSync(path.dirname(SERVER_FILE), { recursive: true });
    fs.writeFileSync(SERVER_FILE, JSON.stringify(data, null, 2) + 'serverCache.servers.find((s) => s.ip === ip)serverCache.servers.find((s) => s.ip === ip)n');
    return serverCache;
  } catch (error) {
    console.warn('[VPNGate] GitHub feed unavailable:', error);
    if (serverCache.servers.length >= 10) return serverCache;
    loadDiskCache();
    if (serverCache.servers.length >= 10) return serverCache;
    throw error;
  }
}

// Build standard clean .ovpn configuration
function buildCleanOvpn(server: VpnServer): string {
  let certBlock = '';
  if (server.config_b64) {
    try {
      const decoded = Buffer.from(server.config_b64, 'base64').toString('utf-8');
      const lines = decoded.split('serverCache.servers.find((s) => s.ip === ip)n');
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
      certBlock = certLines.join('serverCache.servers.find((s) => s.ip === ip)n');
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
  ].join('serverCache.servers.find((s) => s.ip === ip)n');

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

// === API Endpoints ===

app.get('/api/servers', async (req, res) => {
  try {
    const state = await refreshServers(req.query.force === 'true');
    return res.json({ success: true, count: state.servers.length, cached: state.source !== 'github-actions',
      source: state.source, timestamp: state.timestamp, stale: Date.now() - state.timestamp > 3600000, servers: state.servers });
  } catch {
    return res.status(503).json({ success: false, count: 0, source: 'unavailable',
      error: 'No valid GitHub server list or local cache is available.', servers: [] });
  }
});

// Test single server latency via TCP socket
app.get('/api/test-server', (req, res) => {
  const ip = ((req.query.ip as string) || '').trim();
  const port = parseInt(req.query.port as string, 10) || 443;

  if (!ip) {
    return res.status(400).json({ error: 'IP parameter is required' });
  }

  const startTime = Date.now();
  const socket = new net.Socket();
  socket.setTimeout(2500);

  socket.connect(port, ip, () => {
    const latency = Date.now() - startTime;
    socket.destroy();
    res.json({ reachable: true, latency });
  });

  socket.on('error', () => {
    socket.destroy();
    res.json({ reachable: false, latency: -1 });
  });

  socket.on('timeout', () => {
    socket.destroy();
    res.json({ reachable: false, latency: -1 });
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

      const startTime = Date.now();
      const socket = new net.Socket();
      socket.setTimeout(2500);

      socket.connect(port, ip, () => {
        const latency = Date.now() - startTime;
        socket.destroy();
        results[key] = { reachable: true, latency };
        resolve();
      });

      socket.on('error', () => {
        socket.destroy();
        results[key] = { reachable: false, latency: -1 };
        resolve();
      });

      socket.on('timeout', () => {
        socket.destroy();
        results[key] = { reachable: false, latency: -1 };
        resolve();
      });
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
  const safeIp = ip.replace(/serverCache.servers.find((s) => s.ip === ip)./g, '_');
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

  loadDiskCache();\n\n  app.listen(PORT, '0.0.0.0', () => {
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
