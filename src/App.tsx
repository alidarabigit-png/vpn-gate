import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SmartConnectHero } from './components/SmartConnectHero';
import { ServerListTable } from './components/ServerListTable';
import { DownloadCenter } from './components/DownloadCenter';
import { GuideCenter } from './components/GuideCenter';
import { QrModal } from './components/QrModal';
import { ConfigViewerModal } from './components/ConfigViewerModal';
import { OnboardingModal } from './components/OnboardingModal';
import { QuickConnectModal } from './components/QuickConnectModal';
import { VpnServer } from './types/vpn';
import {
  downloadClientBlob,
} from './utils/vpnGenerators';
import {
  fetchServersSmart,
  getLocalCachedServers,
} from './utils/vpnClientFetcher';
import {
  sortServersByL2tpQuality,
} from './utils/l2tpQuality';
import { Shield } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'connect' | 'servers' | 'downloads' | 'guides'>('connect');
  const [servers, setServers] = useState<VpnServer[]>([]);
  // Unified single source of truth for Top Shortcut Card, Main Power Button, Table Row, and Modal
  const [selectedBestServer, setSelectedBestServer] = useState<VpnServer | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTestingBulk, setIsTestingBulk] = useState<boolean>(false);
  const [testProgressText, setTestProgressText] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [quickConnectServer, setQuickConnectServer] = useState<VpnServer | null>(null);
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

  // Check cached servers on initial mount for instant offline / no-VPN access
  useEffect(() => {
    const cached = getLocalCachedServers();
    if (cached && cached.length > 0) {
      const ranked = sortServersByL2tpQuality(cached, 'mci');
      setServers(ranked);
      setSelectedBestServer(ranked[0]);
      setIsLoading(false);
    }
  }, []);

  // Fetch servers from backend or client CORS proxies
  const fetchServers = async (force: boolean = false) => {
    if (servers.length === 0) {
      setIsLoading(true);
    }
    try {
      const result = await fetchServersSmart(force);
      if (result.servers && result.servers.length > 0) {
        const ranked = sortServersByL2tpQuality(result.servers, 'mci');
        setServers(ranked);
        // Sync selectedBestServer if not set or not in current list
        setSelectedBestServer((prev) => {
          if (!prev || !ranked.some((s) => s.ip === prev.ip)) {
            return ranked[0];
          }
          return prev;
        });
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

  // Next Server Handler: seamlessly cycles to the next best server and keeps everything in 100% sync
  const handleNextServer = () => {
    if (servers.length === 0) return;
    const currentIndex = servers.findIndex(
      (s) => s.ip === selectedBestServer?.ip
    );
    const nextIndex = (currentIndex + 1) % servers.length;
    const nextServer = servers[nextIndex];
    setSelectedBestServer(nextServer);
    if (quickConnectServer) {
      setQuickConnectServer(nextServer);
    }
    navigator.clipboard.writeText(nextServer.ip).catch(() => {});
    showToast(`🔄 آیپی سرور بعدی کپی شد: ${nextServer.country_short} (${nextServer.ip})`);
  };

  // A TCP port check is only a reachability check, not proof of a successful VPN connection.
  const handleTestSingle = async (server: VpnServer) => {
    setServers((prev) => prev.map((s) =>
      isSameServer(s, server) ? { ...s, testedStatus: 'testing' } : s
    ));
    try {
      const response = await fetch('/api/test-server?ip=' + encodeURIComponent(server.ip) + '&port=' + server.openvpn_port);
      if (!response.ok) throw new Error('Real TCP test requires the local backend.');
      const result = await response.json();
      setServers((prev) => prev.map((s) => isSameServer(s, server) ? {
        ...s,
        testedStatus: result.reachable ? 'online' : 'offline',
        testedLatency: result.reachable ? result.latency : undefined,
      } : s));
      showToast(result.reachable
        ? 'پورت TCP سرور قابل دسترس است؛ اتصال VPN هنوز تأیید نشده است.'
        : 'پورت سرور از این مسیر قابل دسترس نیست.');
    } catch {
      setServers((prev) => prev.map((s) => isSameServer(s, server)
        ? { ...s, testedStatus: 'untested', testedLatency: undefined } : s));
      showToast('تست واقعی TCP در نسخهٔ میزبانی‌شده در دسترس نیست؛ Backend محلی لازم است.');
    }
  };

  const handleBulkTest = async () => {
    if (isTestingBulk || servers.length === 0) return;
    setIsTestingBulk(true);
    setTestProgressText('در حال بررسی دسترسی TCP سرورها...');
    try {
      const response = await fetch('/api/test-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targets: servers.map((server) => ({ ip: server.ip, port: server.openvpn_port })),
        }),
      });
      if (!response.ok) throw new Error('Backend TCP test unavailable');
      const data = await response.json();
      const evaluated = servers.map((server) => {
        const result = data.results?.[server.ip + ':' + server.openvpn_port];
        return {
          ...server,
          testedStatus: result ? (result.reachable ? 'online' : 'offline') : 'untested',
          testedLatency: result?.reachable ? result.latency : undefined,
        } as VpnServer;
      });
      setServers(evaluated);
      const reachable = evaluated.filter((server) => server.testedStatus === 'online').length;
      showToast('بررسی TCP تمام شد: ' + reachable + ' پورت قابل دسترس؛ این نتیجه تضمین اتصال VPN نیست.');
    } catch {
      showToast('تست گروهی واقعی به Backend محلی نیاز دارد؛ در سایت ایستا قابل اجرا نیست.');
    } finally {
      setIsTestingBulk(false);
      setTestProgressText(null);
    }
  };

  const handleCopyConfigText = async (server: VpnServer) => {
    try {
      const res = await fetch(`/api/config/${server.ip}`);
      if (!res.ok) throw new Error('Fetch failed');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      showToast('✅ کانفیگ کپی شد! در v2rayNG دکمه Import from Clipboard را بزنید.');
    } catch {
      if (!server.config_b64) throw new Error('OpenVPN profile unavailable');
      const originalProfile = atob(server.config_b64);
      await navigator.clipboard.writeText(originalProfile);
      showToast('متن پروفایل اصلی OpenVPN کپی شد.');
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
        if (!server.config_b64) throw new Error('OpenVPN profile unavailable');
        text = atob(server.config_b64);
      }

      const filename = `vpngate_${server.country_short.toLowerCase()}_${server.ip.replace(/\./g, '_')}.ovpn`;
      downloadClientBlob(text, filename, 'application/x-openvpn-profile;charset=utf-8');
      showToast(`فایل کانفیگ ${server.country_short} با موفقیت دانلود شد.`);
    } catch {
      showToast('خطا در دانلود کانفیگ');
    }
  };

  // Open Quick Connect Modal and sync selectedBestServer across all components
  const handleOpenQuickConnect = async (server: VpnServer) => {
    try {
      await navigator.clipboard.writeText(server.ip);
    } catch {}
    showToast(`آیپی بهترین سرور کپی شد: ${server.ip}`);
    setSelectedBestServer(server);
    setQuickConnectServer(server);
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
              selectedServer={selectedBestServer}
              onSelectServer={(s) => setSelectedBestServer(s)}
              onNextServer={handleNextServer}
              onOpenQr={(server) => setQrModalServer(server)}
              onDownloadConfig={handleDownloadConfig}
              onCopyConfigText={handleCopyConfigText}
              onOpenConfigViewer={(server) => setConfigViewerServer(server)}
              onScrollToTable={scrollToTable}
              onOpenQuickConnect={handleOpenQuickConnect}
              onShowToast={showToast}
            />

            {/* Live Server Preview Section below Hero */}
            <div className="border-t border-slate-900 bg-slate-950/60">
              <ServerListTable
                servers={servers}
                selectedServerId={selectedBestServer?.id || selectedBestServer?.ip}
                onSelectForPower={(s) => {
                  setSelectedBestServer(s);
                  showToast(`سرور ${s.country_short} (${s.ip}) انتخاب شد.`);
                }}
                onOpenQr={(server) => setQrModalServer(server)}
                onDownloadConfig={handleDownloadConfig}
                onTestSingle={handleTestSingle}
                isTestingBulk={isTestingBulk}
                onRefreshServers={() => fetchServers(true)}
                onBulkTest={handleBulkTest}
                onCopyConfigText={handleCopyConfigText}
                onOpenConfigViewer={(server) => setConfigViewerServer(server)}
                onOpenQuickConnect={handleOpenQuickConnect}
              />
            </div>
          </>
        )}

        {activeTab === 'servers' && (
          <div className="py-4">
            <ServerListTable
              servers={servers}
              selectedServerId={selectedBestServer?.id || selectedBestServer?.ip}
              onSelectForPower={(s) => {
                setSelectedBestServer(s);
                showToast(`سرور ${s.country_short} (${s.ip}) انتخاب شد.`);
              }}
              onOpenQr={(server) => setQrModalServer(server)}
              onDownloadConfig={handleDownloadConfig}
              onTestSingle={handleTestSingle}
              isTestingBulk={isTestingBulk}
              onRefreshServers={() => fetchServers(true)}
              onBulkTest={handleBulkTest}
              onCopyConfigText={handleCopyConfigText}
              onOpenConfigViewer={(server) => setConfigViewerServer(server)}
              onOpenQuickConnect={handleOpenQuickConnect}
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

      {/* Quick Connect Modal (L2TP Direct IP & Multi-Device Action) */}
      {quickConnectServer && (
        <QuickConnectModal
          server={quickConnectServer}
          onClose={() => setQuickConnectServer(null)}
          onShowToast={showToast}
          onOpenConfigViewer={(server) => {
            setQuickConnectServer(null);
            setConfigViewerServer(server);
          }}
          onNextServer={handleNextServer}
        />
      )}

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
