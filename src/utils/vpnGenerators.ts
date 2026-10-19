import { VpnServer } from '../types/vpn';

/**
 * Trigger immediate client-side file download using In-Memory Blobs.
 * Completely immune to external auth intercepts, cookie blocks, and iframe sandboxes!
 */
export function downloadClientBlob(content: string, filename: string, mimeType: string = 'text/plain;charset=utf-8') {
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  } catch (err) {
    console.error('Blob download failed:', err);
    return false;
  }
}

/**
 * Generate 1-Click Windows Batch Script (.bat)
 */
export function generateWindowsBat(server: VpnServer): string {
  const host = server.sstp_endpoint || `${server.clean_domain || server.ip}:${server.openvpn_port || 443}`;
  
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
    echo ==========================================================
    echo [OK] Connected successfully!
    echo Your internet is now encrypted and secured.
    echo ==========================================================
) else (
    echo.
    echo [Notice] Connection could not be established immediately.
    echo You can retry by clicking on the Windows Network icon in taskbar,
    echo select 'VPNGate', and click Connect.
)
echo.
pause
`;
}

/**
 * Generate Apple iOS / iPadOS MobileConfig Profile (.mobileconfig)
 */
export function generateAppleMobileConfig(server: VpnServer): string {
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

/**
 * Generate Clean OpenVPN (.ovpn) Configuration
 */
export function generateCleanOvpn(server: VpnServer): string {
  let certBlock = '';
  if (server.config_b64) {
    try {
      const decoded = atob(server.config_b64);
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

  const proto = (server.openvpn_protocol || 'TCP').toLowerCase();
  const remoteHost = server.clean_domain || server.ip;
  const port = server.openvpn_port || 443;

  return `# VPN Gate Clean OpenVPN Profile
# Generated for maximum censorship resistance
client
dev tun
proto ${proto}
remote ${remoteHost} ${port}
resolv-retry infinite
nobind
persist-key
persist-tun
redirect-gateway def1
dhcp-option DNS 1.1.1.1
dhcp-option DNS 8.8.8.8
auth-user-pass
data-ciphers AES-256-GCM:AES-128-GCM:CHACHA20-POLY1305:AES-128-CBC
data-ciphers-fallback AES-128-CBC
verb 3

${certBlock}
`;
}
