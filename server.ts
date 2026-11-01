import express from 'express';
import fs from 'fs';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(express.json());

function getPort(): number {
  const index = process.argv.indexOf('--port');
  if (index !== -1 && process.argv[index + 1]) {
    const parsed = Number.parseInt(process.argv[index + 1], 10);
    if (Number.isInteger(parsed)) return parsed;
  }
  return Number(process.env.PORT) || 3000;
}
const PORT = getPort();

const GITHUB_SERVERS_URL = 'https://raw.githubusercontent.com/alidarabigit-png/vpn-gate/fix/github-server-feed/public/servers.json';
const SERVER_FILE = path.resolve(__dirname, 'public', 'servers.json');

interface VpnServer {
  id?: string;
  hostname: string;
  clean_domain: string;
  ip: string;
  score: number;
  ping: number;
  speed: number;
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

let serverCache: { servers: VpnServer[]; timestamp: number; source: string } = {
  servers: [],
  timestamp: 0,
  source: 'none',
};

function isValidList(data: any): data is { servers: VpnServer[]; timestamp?: number } {
  return !!data &&
    Array.isArray(data.servers) &&
    data.servers.length >= 10 &&
    data.servers.every((server: any) =>
      server &&
      typeof server.ip === 'string' &&
      /^(\d{1,3}\.){3}\d{1,3}$/.test(server.ip) &&
      Number.isInteger(Number(server.openvpn_port)) &&
      Number(server.openvpn_port) >= 1 &&
      Number(server.openvpn_port) <= 65535 &&
      (server.openvpn_protocol === 'TCP' || server.openvpn_protocol === 'UDP') &&
      typeof server.config_b64 === 'string' &&
      server.config_b64.length > 0
    );
}

function loadDiskCache(): boolean {
  try {
    if (!fs.existsSync(SERVER_FILE)) return false;
    const data = JSON.parse(fs.readFileSync(SERVER_FILE, 'utf8'));
    if (!isValidList(data)) return false;
    serverCache = {
      servers: data.servers,
      timestamp: Number(data.timestamp) || 0,
      source: 'disk-cache',
    };
    return true;
  } catch (error) {
    console.warn('[VPNGate] Could not load disk cache:', error);
    return false;
  }
}

async function refreshServers(force = false) {
  if (!force && serverCache.servers.length >= 10 && Date.now() - serverCache.timestamp < 5 * 60 * 1000) {
    return serverCache;
  }

  try {
    const response = await fetch(GITHUB_SERVERS_URL + '?t=' + Date.now(), {
      headers: { 'User-Agent': 'VPN-Gate-Smart-Connect/1.0' },
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) throw new Error('GitHub HTTP ' + response.status);
    const data = await response.json();
    if (!isValidList(data)) throw new Error('GitHub server list is empty or invalid');

    serverCache = {
      servers: data.servers,
      timestamp: Number(data.timestamp) || Date.now(),
      source: 'github-actions',
    };

    fs.mkdirSync(path.dirname(SERVER_FILE), { recursive: true });
    fs.writeFileSync(SERVER_FILE, JSON.stringify(data, null, 2) + '\n');
    return serverCache;
  } catch (error) {
    console.warn('[VPNGate] GitHub feed refresh failed:', error);
    if (serverCache.servers.length < 10) loadDiskCache();
    if (serverCache.servers.length >= 10) return serverCache;
    throw error;
  }
}

function findServer(ip: string): VpnServer | undefined {
  return serverCache.servers.find((server) => server.ip === ip);
}

app.get('/api/servers', async (req, res) => {
  try {
    const state = await refreshServers(req.query.force === 'true');
    res.json({
      success: true,
      count: state.servers.length,
      cached: state.source !== 'github-actions',
      source: state.source,
      timestamp: state.timestamp,
      stale: Date.now() - state.timestamp > 60 * 60 * 1000,
      servers: state.servers,
    });
  } catch {
    res.status(503).json({
      success: false,
      count: 0,
      source: 'unavailable',
      error: 'No valid GitHub server list or local cache is available.',
      servers: [],
    });
  }
});

// TCP reachability only: this does not prove a successful VPN handshake.
app.get('/api/test-server', (req, res) => {
  const ip = String(req.query.ip || '').trim();
  const port = Number.parseInt(String(req.query.port || ''), 10);
  if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(ip) || !Number.isInteger(port) || port < 1 || port > 65535) {
    return res.status(400).json({ reachable: false, latency: -1, error: 'Valid IP and port are required' });
  }

  const started = Date.now();
  const socket = new net.Socket();
  let finished = false;
  const finish = (reachable: boolean) => {
    if (finished) return;
    finished = true;
    socket.destroy();
    res.json({ reachable, latency: reachable ? Date.now() - started : -1, test: 'tcp-port-reachability' });
  };
  socket.setTimeout(3000);
  socket.once('connect', () => finish(true));
  socket.once('error', () => finish(false));
  socket.once('timeout', () => finish(false));
  socket.connect(port, ip);
});

app.post('/api/test-batch', async (req, res) => {
  const targets = Array.isArray(req.body?.targets) ? req.body.targets.slice(0, 35) : [];
  const results: Record<string, { reachable: boolean; latency: number; test: string }> = {};

  await Promise.all(targets.map((target: any) => new Promise<void>((resolve) => {
    const ip = String(target?.ip || '').trim();
    const port = Number.parseInt(String(target?.port || ''), 10);
    const key = ip + ':' + port;
    if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(ip) || !Number.isInteger(port) || port < 1 || port > 65535) {
      results[key] = { reachable: false, latency: -1, test: 'tcp-port-reachability' };
      return resolve();
    }
    const started = Date.now();
    const socket = new net.Socket();
    let finished = false;
    const finish = (reachable: boolean) => {
      if (finished) return;
      finished = true;
      socket.destroy();
      results[key] = {
        reachable,
        latency: reachable ? Date.now() - started : -1,
        test: 'tcp-port-reachability',
      };
      resolve();
    };
    socket.setTimeout(3000);
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
    socket.once('timeout', () => finish(false));
    socket.connect(port, ip);
  })));

  res.json({ results });
});

// Return the original VPN Gate OpenVPN profile without stripping required directives.
app.get('/api/config/:ip', (req, res) => {
  const server = findServer(req.params.ip);
  if (!server) return res.status(404).send('Server not found');
  let config = '';
  try {
    config = Buffer.from(server.config_b64, 'base64').toString('utf8');
  } catch {
    return res.status(422).send('Invalid OpenVPN profile');
  }
  if (!config.includes('client') || !/^\s*remote\s+/m.test(config)) {
    return res.status(422).send('Invalid OpenVPN profile');
  }
  const safeIp = server.ip.replace(/\./g, '_');
  res.setHeader('Content-Type', 'application/x-openvpn-profile; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="vpngate_' + safeIp + '.ovpn"');
  res.send(config);
});

// VPN Gate publishes OpenVPN profiles, not L2TP/SSTP profiles.
app.get('/api/mobileconfig/:ip', (_req, res) => {
  res.status(501).json({
    error: 'VPN Gate server profiles are OpenVPN. An iOS L2TP mobileconfig cannot be generated from this profile.',
    supported_format: '.ovpn',
  });
});

app.get('/api/windows-script/:ip', (_req, res) => {
  res.status(501).json({
    error: 'VPN Gate server profiles are OpenVPN. The Windows SSTP script is not compatible.',
    supported_format: '.ovpn',
  });
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
        server: { middlewareMode: true, hmr: false },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch {
      app.use(express.static(distDir));
      app.get('*', (_req, res) => res.sendFile(path.resolve(distDir, 'index.html')));
    }
  } else {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => res.sendFile(path.resolve(distDir, 'index.html')));
  }

  loadDiskCache();
  app.listen(PORT, '0.0.0.0', () => {
    console.log('VPN Gate Smart Connect server running on http://0.0.0.0:' + PORT);
    refreshServers(true)
      .then((state) => console.log('[VPNGate] Loaded ' + state.servers.length + ' servers from ' + state.source))
      .catch((error) => console.warn('[VPNGate] No valid server feed yet:', error));
    setInterval(() => refreshServers(true).catch(() => {}), 10 * 60 * 1000);
  });
}

startServer().catch((error) => console.error('Failed to start server:', error));
