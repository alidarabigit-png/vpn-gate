import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SmartConnectHero } from './components/SmartConnectHero';
import { ServerListTable } from './components/ServerListTable';
import { DownloadCenter } from './components/DownloadCenter';
import { GuideCenter } from './components/GuideCenter';
import { QrModal } from './components/QrModal';
import { ConfigViewerModal } from './components/ConfigViewerModal';
import { OnboardingModal } from './components/OnboardingModal';
import { VpnServer } from './types/vpn';
import {
  downloadClientBlob,
  generateCleanOvpn,
} from './utils/vpnGenerators';
import { Shield, Lock, Zap, ExternalLink } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'connect' | 'servers' | 'downloads' | 'guides'>('connect');
  const [servers, setServers] = useState<VpnServer[]>([]);
  const [selectedServer, setSelectedServer] = useState<VpnServer | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTestingBulk, setIsTestingBulk] = useState<boolean>(false);
  const [testProgressText, setTestProgressText] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [qrModalServer, setQrModalServer] = useState<VpnServer | null>(null);
  const [configViewerServer, setConfigViewerServer] = useState<VpnServer | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Check if onboarding modal should be shown
  useEffect(() => {
    const hide = localStorage.getItem('vpngate_hide_onboarding');
    if (hide !== 'true') {
      setShowOnboarding(true);
    }
  }, []);

  // Fetch servers from backend
  const fetchServers = async (force: boolean = false) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/servers?force=${force}`);
      const data = await res.json();
      if (data.servers && data.servers.length > 0) {
        setServers(data.servers);
        if (!selectedServer) {
          setSelectedServer(data.servers[0]);
        }
        // If server returned small fallback list, auto-fetch full live VPNGate list
        if (data.servers.length < 25 && !force) {
          setTimeout(() => fetchServers(true), 800);
        }
      }
    } catch (err) {
      console.error('Failed to load VPN servers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper to match server instance accurately
  const isSameServer = (a: VpnServer, b: VpnServer) => {
    if (a.id && b.id) return a.id === b.id;
    return a.ip === b.ip && a.openvpn_port === b.openvpn_port && a.openvpn_protocol === b.openvpn_protocol;
  };

  // Run test on a single server
  const handleTestSingle = async (server: VpnServer) => {
    setServers((prev) =>
      prev.map((s) => (isSameServer(s, server) ? { ...s, testedStatus: 'testing' } : s))
    );

    try {
      const res = await fetch(
        `/api/test-server?ip=${encodeURIComponent(server.ip)}&port=${server.openvpn_port || 443}`
      );
      const data = await res.json();

      setServers((prev) =>
        prev.map((s) => {
          if (isSameServer(s, server)) {
            const isReachable = !!data.reachable;
            const updated = {
              ...s,
              testedStatus: isReachable ? ('online' as const) : ('offline' as const),
              testedLatency: isReachable && data.latency > 0 ? data.latency : undefined,
            };
            if (isReachable && (!selectedServer || selectedServer.testedStatus !== 'online')) {
              setSelectedServer(updated);
            }
            return updated;
          }
          return s;
        })
      );
    } catch {
      setServers((prev) =>
        prev.map((s) => (isSameServer(s, server) ? { ...s, testedStatus: 'offline' } : s))
      );
    }
  };

  // Run high-speed batch test across up to 35 real servers
  const handleBulkTest = async () => {
    if (isTestingBulk || servers.length === 0) return;
    setIsTestingBulk(true);
    setTestProgressText('آماده‌سازی تست...');
    showToast('آغاز تست پینگ سرورها در بستر شبکه...');

    // Prioritize TCP port 443/995 and high speed servers
    const candidates = [...servers]
      .sort((a, b) => {
        const portA = a.openvpn_port === 443 || a.openvpn_port === 995 ? 1 : 0;
        const portB = b.openvpn_port === 443 || b.openvpn_port === 995 ? 1 : 0;
        if (portA !== portB) return portB - portA;
        if (a.openvpn_protocol === 'TCP' && b.openvpn_protocol !== 'TCP') return -1;
        if (a.openvpn_protocol !== 'TCP' && b.openvpn_protocol === 'TCP') return 1;
        return b.speed - a.speed;
      })
      .slice(0, 35);

    // Mark candidates as testing
    setServers((prev) =>
      prev.map((s) =>
        candidates.some((c) => isSameServer(c, s)) ? { ...s, testedStatus: 'testing' } : s
      )
    );

    const chunkSize = 8;
    for (let i = 0; i < candidates.length; i += chunkSize) {
      const chunk = candidates.slice(i, i + chunkSize);
      setTestProgressText(`تست ${Math.min(i + chunkSize, candidates.length)} از ${candidates.length}...`);

      try {
        const res = await fetch('/api/test-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targets: chunk.map((c) => ({ ip: c.ip, port: c.openvpn_port || 443 })),
          }),
        });
        const data = await res.json();
        const results = data.results || {};

        setServers((prev) =>
          prev.map((s) => {
            const key = `${s.ip}:${s.openvpn_port || 443}`;
            if (results[key]) {
              const r = results[key];
              return {
                ...s,
                testedStatus: r.reachable ? 'online' : 'offline',
                testedLatency: r.reachable && r.latency > 0 ? r.latency : undefined,
              };
            }
            return s;
          })
        );
      } catch {
        // Fallback test
        for (const c of chunk) {
          await handleTestSingle(c);
        }
      }
    }

    setIsTestingBulk(false);
    setTestProgressText(null);
    showToast('تست پینگ به پایان رسید. سرورهای سبز با موفقیت شناسایی شدند.');

    // Automatically sync power button with the fastest online server
    setServers((prev) => {
      const onlineOnes = prev.filter((s) => s.testedStatus === 'online');
      if (onlineOnes.length > 0) {
        onlineOnes.sort((a, b) => {
          const latA = a.testedLatency || 999;
          const latB = b.testedLatency || 999;
          if (latA !== latB) return latA - latB;
          return b.speed - a.speed;
        });
        setSelectedServer(onlineOnes[0]);
      }
      return prev;
    });
  };

  const handleCopyConfigText = async (server: VpnServer) => {
    try {
      const res = await fetch(`/api/config/${server.ip}`);
      if (!res.ok) throw new Error('Fetch failed');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      showToast('✅ کانفیگ کپی شد! در v2rayNG دکمه Import from Clipboard را بزنید.');
    } catch {
      showToast('خطا در دریافت متن کانفیگ');
    }
  };

  const handleDownloadConfig = async (server: VpnServer) => {
    try {
      let text = '';
      try {
        const res = await fetch(`/api/config/${server.ip}`);
        if (res.ok) text = await res.text();
      } catch {}

      if (!text) {
        text = generateCleanOvpn(server);
      }

      const filename = `vpngate_${server.country_short.toLowerCase()}_${server.ip.replace(/\./g, '_')}.ovpn`;
      downloadClientBlob(text, filename, 'application/x-openvpn-profile;charset=utf-8');
      showToast(`فایل کانفیگ ${server.country_short} با موفقیت دانلود شد.`);
    } catch {
      showToast('خطا در دانلود کانفیگ');
    }
  };

  const scrollToTable = () => {
    const el = document.getElementById('servers-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onQuickTest={handleBulkTest}
        isTesting={isTestingBulk}
        onOpenOnboarding={() => setShowOnboarding(true)}
        testProgressText={testProgressText}
      />

      {/* Main Viewport Content */}
      <main className="flex-1">
        {activeTab === 'connect' && (
          <>
            <SmartConnectHero
              servers={servers}
              selectedServer={selectedServer}
              onSelectServer={(s) => setSelectedServer(s)}
              onOpenQr={(server) => setQrModalServer(server)}
              onDownloadConfig={handleDownloadConfig}
              onCopyConfigText={handleCopyConfigText}
              onOpenConfigViewer={(server) => setConfigViewerServer(server)}
              onScrollToTable={scrollToTable}
            />

            {/* Live Server Preview Section below Hero */}
            <div className="border-t border-slate-900 bg-slate-950/60">
              <ServerListTable
                servers={servers}
                selectedServerId={selectedServer?.id || selectedServer?.ip}
                onSelectForPower={(s) => {
                  setSelectedServer(s);
                  showToast(`سرور ${s.country_short} برای دکمه پاور انتخاب شد.`);
                }}
                onOpenQr={(server) => setQrModalServer(server)}
                onDownloadConfig={handleDownloadConfig}
                onTestSingle={handleTestSingle}
                isTestingBulk={isTestingBulk}
                onRefreshServers={() => fetchServers(true)}
                onBulkTest={handleBulkTest}
                onCopyConfigText={handleCopyConfigText}
                onOpenConfigViewer={(server) => setConfigViewerServer(server)}
              />
            </div>
          </>
        )}

        {activeTab === 'servers' && (
          <div className="py-4">
            <ServerListTable
              servers={servers}
              selectedServerId={selectedServer?.id || selectedServer?.ip}
              onSelectForPower={(s) => {
                setSelectedServer(s);
                showToast(`سرور ${s.country_short} برای دکمه پاور انتخاب شد.`);
              }}
              onOpenQr={(server) => setQrModalServer(server)}
              onDownloadConfig={handleDownloadConfig}
              onTestSingle={handleTestSingle}
              isTestingBulk={isTestingBulk}
              onRefreshServers={() => fetchServers(true)}
              onBulkTest={handleBulkTest}
              onCopyConfigText={handleCopyConfigText}
              onOpenConfigViewer={(server) => setConfigViewerServer(server)}
            />
          </div>
        )}

        {activeTab === 'downloads' && (
          <div className="py-4">
            <DownloadCenter />
          </div>
        )}

        {activeTab === 'guides' && (
          <div className="py-4">
            <GuideCenter />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/90 py-8 px-4 text-center text-xs text-slate-400">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-400" />
            <span className="font-semibold text-slate-300">
              VPN Gate Smart Connect
            </span>
            <span>·</span>
            <span>طراحی شده برای دسترسی آزاد و رمزنگاری ترافیک</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>نام کاربری و رمز تمام سرورها: <strong className="font-mono text-emerald-400">vpn</strong></span>
            <span>·</span>
            <button
              onClick={() => setShowOnboarding(true)}
              className="text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
            >
              راهنمای ۴ مرحله‌ای تست اینترنت ایران
            </button>
          </div>
        </div>
      </footer>

      {/* Onboarding Guide Modal for Iranian Internet Users */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onStartTesting={handleBulkTest}
      />

      {/* QR Code and Mobile Setup Modal */}
      {qrModalServer && (
        <QrModal
          server={qrModalServer}
          onClose={() => setQrModalServer(null)}
          onDownloadConfig={handleDownloadConfig}
          onCopyConfigText={handleCopyConfigText}
          onOpenConfigViewer={(server) => {
            setQrModalServer(null);
            setConfigViewerServer(server);
          }}
        />
      )}

      {/* Raw Config Viewer & Copy Modal */}
      {configViewerServer && (
        <ConfigViewerModal
          server={configViewerServer}
          onClose={() => setConfigViewerServer(null)}
          onDownloadConfig={handleDownloadConfig}
        />
      )}

      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 rounded-lg bg-emerald-500 text-slate-950 px-4 py-2 text-xs font-bold shadow-lg shadow-emerald-500/20 animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
