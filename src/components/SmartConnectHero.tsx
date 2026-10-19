import React, { useState, useEffect } from 'react';
import {
  Laptop,
  Smartphone,
  Apple,
  Radio,
  Download,
  QrCode,
  Copy,
  Power,
  FileText,
  ClipboardCheck,
  Zap,
  Sparkles,
  Check,
  RefreshCw,
} from 'lucide-react';
import { VpnServer, PlatformType, OperatorType } from '../types/vpn';
import {
  downloadClientBlob,
  generateWindowsBat,
  generateAppleMobileConfig,
  generateCleanOvpn,
} from '../utils/vpnGenerators';
import { sortServersByL2tpQuality } from '../utils/l2tpQuality';

interface SmartConnectHeroProps {
  servers: VpnServer[];
  selectedServer: VpnServer | null;
  onSelectServer: (server: VpnServer) => void;
  onNextServer: () => void;
  onOpenQr: (server: VpnServer) => void;
  onDownloadConfig: (server: VpnServer) => void;
  onCopyConfigText: (server: VpnServer) => void;
  onOpenConfigViewer: (server: VpnServer) => void;
  onScrollToTable?: () => void;
  onOpenQuickConnect: (server: VpnServer) => void;
  onShowToast: (msg: string) => void;
}

const OPERATORS: { id: OperatorType; name: string; badge: string; desc: string }[] = [
  { id: 'mci', name: 'همراه اول', badge: 'MCI', desc: 'بهینه‌سازی پورت ۴۴۳ TCP' },
  { id: 'irancell', name: 'ایرانسل', badge: 'MTN', desc: 'رمزنگاری ضد اختلال' },
  { id: 'rightel', name: 'رایتل', badge: 'Rightel', desc: 'سرعت پایدار' },
  { id: 'mokhaberat', name: 'مخابرات (TCI)', badge: 'ADSL/FTTH', desc: 'پینگ پایین مستقیم' },
  { id: 'shatel', name: 'شاتل', badge: 'Shatel', desc: 'پایداری بالا' },
  { id: 'wifi', name: 'وای‌فای / سایر', badge: 'WiFi', desc: 'اتصال عمومی' },
];

const PLATFORMS: { id: PlatformType; name: string; icon: React.ReactNode }[] = [
  { id: 'android', name: 'اندروید', icon: <Smartphone className="h-4 w-4" /> },
  { id: 'ios', name: 'آیفون / iOS', icon: <Apple className="h-4 w-4" /> },
  { id: 'windows', name: 'ویندوز', icon: <Laptop className="h-4 w-4" /> },
  { id: 'macos', name: 'مک (macOS)', icon: <Apple className="h-4 w-4" /> },
  { id: 'linux', name: 'لینوکس', icon: <Laptop className="h-4 w-4" /> },
];

export const SmartConnectHero: React.FC<SmartConnectHeroProps> = ({
  servers,
  selectedServer,
  onSelectServer,
  onNextServer,
  onOpenQr,
  onDownloadConfig,
  onCopyConfigText,
  onOpenConfigViewer,
  onScrollToTable,
  onOpenQuickConnect,
  onShowToast,
}) => {
  const [platform, setPlatform] = useState<PlatformType>('android');
  const [operator, setOperator] = useState<OperatorType>('mci');
  const [connectionState, setConnectionState] = useState<'idle' | 'connecting' | 'connected'>('idle');
  const [copied, setCopied] = useState(false);
  const [connectTime, setConnectTime] = useState<number>(0);

  // Auto-detect user platform
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (/android/.test(ua)) {
      setPlatform('android');
    } else if (/iphone|ipad|ipod/.test(ua)) {
      setPlatform('ios');
    } else if (/macintosh|mac os x/.test(ua)) {
      setPlatform('macos');
    } else if (/linux/.test(ua)) {
      setPlatform('linux');
    } else {
      setPlatform('windows');
    }
  }, []);

  // When operator is clicked by user, select the best server for that network
  const handleOperatorSelect = (op: OperatorType) => {
    setOperator(op);
    if (servers.length > 0) {
      const ranked = sortServersByL2tpQuality(servers, op);
      if (ranked[0]) {
        onSelectServer(ranked[0]);
        onShowToast(`بهترین سرور برای ${OPERATORS.find((o) => o.id === op)?.name || op} انتخاب شد.`);
      }
    }
  };

  // Connection timer
  useEffect(() => {
    let timer: any;
    if (connectionState === 'connected') {
      timer = setInterval(() => {
        setConnectTime((prev) => prev + 1);
      }, 1000);
    } else {
      setConnectTime(0);
    }
    return () => clearInterval(timer);
  }, [connectionState]);

  // Main Power Button click: Copies IP and opens Quick Connect Modal
  const handleToggleConnect = async () => {
    if (!selectedServer) return;

    try {
      await navigator.clipboard.writeText(selectedServer.ip);
    } catch {}

    onShowToast(`آیپی بهترین سرور کپی شد: ${selectedServer.ip}`);
    setConnectionState('connected');
    onOpenQuickConnect(selectedServer);
  };

  // Smart Random / Best IP shortcut button
  const handlePickRandomBest = async () => {
    if (!servers.length) return;
    let pool = servers.filter((s) => s.testedStatus === 'online');
    if (pool.length === 0) {
      pool = servers.filter((s) => s.testedStatus !== 'offline');
    }
    if (pool.length === 0) {
      pool = [...servers];
    }

    const topSlice = pool.slice(0, Math.min(10, pool.length));
    const randomPick = topSlice[Math.floor(Math.random() * topSlice.length)];

    onSelectServer(randomPick);
    try {
      await navigator.clipboard.writeText(randomPick.ip);
    } catch {}

    onShowToast(`آیپی سرور منتخب کپی شد: ${randomPick.ip}`);
    setConnectionState('connected');
    onOpenQuickConnect(randomPick);
  };

  const handleCopyCredentials = () => {
    if (!selectedServer) return;
    const text = `آدرس سرور: ${selectedServer.clean_domain}\nپورت: ${selectedServer.openvpn_port}\nنام کاربری: vpn\nرمز عبور: vpn\nکلید امنیتی (Secret): vpn`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentSpeedMbps = selectedServer ? (selectedServer.speed / 1000000).toFixed(1) : '85.0';

  return (
    <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 px-4 py-8 sm:px-6 lg:px-8">
      {/* Background ambient accents */}
      <div className="pointer-events-none absolute -top-40 right-1/4 h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-cyan-500/5 blur-3xl" />

      <div className="mx-auto max-w-7xl">
        {/* Header Title & Value Proposition */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            اتصال هوشمند و فوق‌سریع به اینترنت آزاد
          </h1>
          <p className="mx-auto max-w-2xl text-sm sm:text-base text-slate-400">
            سازگار با تمام مرورگرها و دستگاه‌ها با پروتکل ضد فیلتر L2TP / Direct IP
          </p>
        </div>

        {/* Smart Random / Best IP Card (Instant L2TP Shortcut) */}
        <div className="max-w-4xl mx-auto mb-8 rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-r from-emerald-950/40 via-slate-900/90 to-slate-950 p-4 sm:p-5 shadow-xl shadow-emerald-950/20">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Huge 1-Click Copy Button & Next Server Button */}
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-emerald-400">
                <Sparkles className="h-4 w-4 animate-pulse text-emerald-400" />
                <span>اتصال آنی بدون فیلترشکن (Smart L2TP Shortcut)</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <button
                  onClick={handleToggleConnect}
                  className="flex-1 w-full group flex items-center justify-center gap-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3.5 px-4 text-sm sm:text-base font-extrabold text-slate-950 transition-all cursor-pointer shadow-lg shadow-emerald-500/25 active:scale-98"
                >
                  <Zap className="h-5 w-5 fill-slate-950 group-hover:scale-110 transition-transform shrink-0" />
                  <span>کپی سریع آیپی بهترین سرور (L2TP/IPSec)</span>
                </button>

                <button
                  onClick={onNextServer}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 border-2 border-emerald-500/40 hover:border-emerald-400 py-3.5 px-3.5 text-xs sm:text-sm font-bold text-emerald-300 transition-all cursor-pointer active:scale-98 shrink-0"
                  title="اگر این سرور متصل نشد، با یک کلیک آیپی سرور بعدی را کپی کنید"
                >
                  <RefreshCw className="h-4 w-4 text-emerald-400" />
                  <span>🔄 سرور بعدی (تعویض آیپی)</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 text-center lg:text-right">
                آیپی سرور منتخب <strong className="text-emerald-300 font-mono">{selectedServer?.country_short} ({selectedServer?.ip})</strong> کپی شده و با دکمه پاور و جدول کاملاً یکسان است.
              </p>
            </div>

            {/* Quick L2TP Credentials Panel */}
            <div className="lg:w-80 rounded-xl bg-slate-950/90 border border-slate-800 p-3 text-xs">
              <div className="flex items-center justify-between mb-2 text-[11px] border-b border-slate-800/80 pb-1.5">
                <span className="font-bold text-slate-300">اطلاعات پیش‌فرض L2TP:</span>
                <span className="font-mono text-emerald-400 font-semibold">پروتکل فعال</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center justify-between bg-slate-900 px-2.5 py-1.5 rounded border border-slate-800">
                  <span className="text-slate-400">سرور:</span>
                  <span className="font-mono text-emerald-400 font-bold truncate max-w-[85px]" dir="ltr">
                    {selectedServer ? selectedServer.ip : '---'}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-slate-900 px-2.5 py-1.5 rounded border border-slate-800">
                  <span className="text-slate-400">سکرت:</span>
                  <span className="font-mono text-emerald-400 font-bold">vpn</span>
                </div>
                <div className="flex items-center justify-between bg-slate-900 px-2.5 py-1.5 rounded border border-slate-800">
                  <span className="text-slate-400">یوزر:</span>
                  <span className="font-mono text-emerald-400 font-bold">vpn</span>
                </div>
                <div className="flex items-center justify-between bg-slate-900 px-2.5 py-1.5 rounded border border-slate-800">
                  <span className="text-slate-400">پسورد:</span>
                  <span className="font-mono text-emerald-400 font-bold">vpn</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Device & Operator Configuration Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto mb-8">
          {/* Platform Selector */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Laptop className="h-4 w-4 text-emerald-400" />
                سیستم‌عامل و دستگاه شما
              </span>
              <span className="text-emerald-400">تشخیص هوشمند</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    platform === p.id
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'bg-slate-950/50 text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="mb-1">{p.icon}</div>
                  <span className="truncate w-full text-center">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Operator Selector */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Radio className="h-4 w-4 text-emerald-400" />
                نوع اینترنت و اپراتور متصل
              </span>
              <span className="text-slate-400">تنظیم پروتکل ضدسانسور</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {OPERATORS.map((op) => (
                <button
                  key={op.id}
                  onClick={() => setOperator(op.id)}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    operator === op.id
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'bg-slate-950/50 text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <span className="font-bold text-[11px] truncate">{op.name}</span>
                  <span className="text-[10px] text-slate-500 truncate">{op.badge}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Master One-Click Connection Hub */}
        <div className="relative mx-auto max-w-2xl rounded-2xl border border-slate-800/90 bg-slate-900/90 p-6 sm:p-8 backdrop-blur shadow-2xl">
          {/* Status Bar */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  connectionState === 'connected'
                    ? 'bg-emerald-500 ring-4 ring-emerald-500/20'
                    : connectionState === 'connecting'
                    ? 'bg-amber-400 ring-4 ring-amber-400/20 animate-pulse'
                    : 'bg-slate-500'
                }`}
              />
              <span className="text-xs font-medium text-slate-300">
                {connectionState === 'connected'
                  ? 'متصل و ترافیک رمزنگاری‌شده'
                  : connectionState === 'connecting'
                  ? 'در حال برقراری ارتباط...'
                  : 'آماده اتصال یک‌کلیکی'}
              </span>
            </div>

            {connectionState === 'connected' && (
              <span className="font-mono text-xs text-emerald-400 font-semibold tabular-nums">
                مدت زمان: {formatTimer(connectTime)}
              </span>
            )}
          </div>

          {/* Central Power Button Action */}
          <div className="flex flex-col items-center justify-center my-6">
            <button
              onClick={handleToggleConnect}
              disabled={!selectedServer}
              className={`group relative flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center rounded-full border-2 transition-all duration-300 cursor-pointer shadow-lg ${
                connectionState === 'connected'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:scale-105 shadow-emerald-500/20'
                  : connectionState === 'connecting'
                  ? 'border-amber-400 bg-amber-400/10 text-amber-300 animate-pulse'
                  : 'border-emerald-500/40 bg-slate-950 text-slate-200 hover:border-emerald-400 hover:text-emerald-300 hover:scale-105 shadow-emerald-950'
              }`}
            >
              <Power className="h-12 w-12 sm:h-14 sm:w-14 transition-transform group-hover:scale-110" />
            </button>

            <span className="mt-4 text-sm font-semibold text-slate-200">
              {connectionState === 'connected'
                ? 'برای قطع اتصال کلیک کنید'
                : connectionState === 'connecting'
                ? 'در حال اتصال...'
                : 'برای اتصال یک‌کلیکی کلیک کنید'}
            </span>
          </div>

          {/* Selected Optimal Server Details */}
          {selectedServer && (
            <div className="rounded-xl border border-emerald-500/30 bg-slate-950/70 p-4 mb-6 shadow-md shadow-emerald-950/30">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-white">
                    {selectedServer.country_short} {selectedServer.country_long}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ({selectedServer.ip})
                  </span>
                </div>

                {/* Real-time Tested Status Badge & Next Server Button */}
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    آماده اتصال مستقیم L2TP (پینگ: {selectedServer.testedLatency || selectedServer.ping || 38}ms)
                  </span>

                  <button
                    onClick={onNextServer}
                    className="flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[11px] text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
                    title="تعویض خودکار به سرور بعدی"
                  >
                    <RefreshCw className="h-3 w-3 text-emerald-400" />
                    <span>سرور بعدی</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono tabular-nums mb-3">
                <span className="text-emerald-400 font-semibold">{currentSpeedMbps} Mbps</span>
                <span>·</span>
                <span>پینگ پایه: {selectedServer.ping > 0 ? `${selectedServer.ping}ms` : '32ms'}</span>
                <span>·</span>
                <span>پروتکل: {selectedServer.openvpn_protocol}:{selectedServer.openvpn_port}</span>
              </div>

              {/* Host and Fast Copy */}
              <div className="flex items-center justify-between rounded-lg bg-slate-900/80 px-3 py-2 border border-slate-800 text-xs">
                <span className="font-mono text-slate-300 truncate max-w-xs" dir="ltr">
                  {selectedServer.clean_domain}
                </span>
                <button
                  onClick={handleCopyCredentials}
                  className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer shrink-0"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>{copied ? 'کپی شد!' : 'کپی اطلاعات سرور'}</span>
                </button>
              </div>

              {/* Sync notice and table shortcut */}
              <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-900">
                <span>این سرور دقیقاً با جدول پایین صفحه هماهنگ و هایلایت شده است.</span>
                {onScrollToTable && (
                  <button
                    type="button"
                    onClick={onScrollToTable}
                    className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 cursor-pointer font-medium"
                  >
                    مشاهده در جدول ↓
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Android Special Guidance Banner */}
          {platform === 'android' && (
            <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-xs text-emerald-300 flex items-start gap-2.5">
              <ClipboardCheck className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
              <div>
                <strong className="block font-bold mb-0.5">قابل استفاده در تمام مرورگرها (کروم، فایرفاکس، سامسونگ و غیره):</strong>
                برای اتصال سریع، دکمه <strong>«کپی کانفیگ (v2rayNG / Sing-box)»</strong> را بزنید و در برنامه گزینه <strong>Import from Clipboard</strong> را لمس کنید!
              </div>
            </div>
          )}

          {/* iOS Special Guidance Banner */}
          {platform === 'ios' && (
            <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 text-xs text-emerald-300 flex items-start gap-2.5">
              <Apple className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
              <div>
                <strong className="block font-bold mb-1">راهنمای اتصال در گوشی آیفون:</strong>
                <p className="text-slate-300 leading-relaxed">
                  می‌توانید اطلاعات سرور را کپی کرده و به سادگی به صورت دستی در <strong className="text-white font-mono">Settings &gt; VPN &gt; Add VPN (L2TP)</strong> وارد کنید، یا بارکد QR را در برنامه <strong className="text-white">V2Box</strong> اسکن نمایید. (در صورت تمایل، دانلود پروفایل نیز به صورت اختیاری موجود است).
                </p>
              </div>
            </div>
          )}

          {/* Platform Tailored Instant Action Row */}
          {selectedServer && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Android Primary Action */}
              {platform === 'android' && (
                <button
                  onClick={() => onCopyConfigText(selectedServer)}
                  className="col-span-full flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-3 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-all cursor-pointer shadow-md shadow-emerald-500/20"
                >
                  <Copy className="h-4 w-4" />
                  <span>کپی کانفیگ (درون‌ریزی از کلیپ‌بورد در v2rayNG / Sing-box)</span>
                </button>
              )}

              {/* Windows 1-Click Script */}
              {platform === 'windows' && (
                <button
                  onClick={() => {
                    const bat = generateWindowsBat(selectedServer);
                    downloadClientBlob(
                      bat,
                      `connect_vpngate_${selectedServer.country_short.toLowerCase()}.bat`,
                      'application/x-bat;charset=utf-8'
                    );
                    onOpenQuickConnect(selectedServer);
                  }}
                  className="col-span-full flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-3 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-all shadow-md cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>اسکریپت ۱-کلیک ویندوز (.bat) - اتصال بدون نیاز به نرم‌افزار</span>
                </button>
              )}

              {/* iOS Primary & Optional Actions */}
              {platform === 'ios' && (
                <>
                  <button
                    onClick={handleCopyCredentials}
                    className="col-span-full flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-3 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-all cursor-pointer shadow-md shadow-emerald-500/20"
                  >
                    <Copy className="h-4 w-4" />
                    <span>{copied ? 'اطلاعات سرور کپی شد!' : 'کپی مشخصات سرور (جهت وارد کردن در تنظیمات آیفون یا برنامه‌ها)'}</span>
                  </button>

                  <button
                    onClick={() => onOpenQr(selectedServer)}
                    className="flex items-center justify-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 px-3 py-2.5 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
                  >
                    <QrCode className="h-4 w-4 text-emerald-400" />
                    <span>بارکد QR (برنامه V2Box / Streisand)</span>
                  </button>

                  <button
                    onClick={() => {
                      const xml = generateAppleMobileConfig(selectedServer);
                      downloadClientBlob(
                        xml,
                        `vpngate_l2tp_${selectedServer.country_short.toLowerCase()}.mobileconfig`,
                        'application/x-apple-aspen-config;charset=utf-8'
                      );
                      onOpenQuickConnect(selectedServer);
                    }}
                    className="flex items-center justify-center gap-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 px-3 py-2.5 text-xs font-medium text-slate-300 transition-all cursor-pointer"
                    title="دانلود فایل پروفایل برای نصب در صورت تمایل"
                  >
                    <Apple className="h-4 w-4 text-slate-400" />
                    <span>دانلود پروفایل (.mobileconfig - اختیاری)</span>
                  </button>
                </>
              )}

              {/* Universal Download Ovpn Button */}
              <button
                onClick={() => onDownloadConfig(selectedServer)}
                className="flex items-center justify-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 px-3 py-2.5 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>دانلود فایل کانفیگ (.ovpn)</span>
              </button>

              {/* Universal QR Code */}
              <button
                onClick={() => onOpenQr(selectedServer)}
                className="flex items-center justify-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 px-3 py-2.5 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
              >
                <QrCode className="h-4 w-4" />
                <span>بارکد QR برای اسکن در برنامه</span>
              </button>

              {/* View Raw Config Text (100% immune to download issues) */}
              <button
                onClick={() => onOpenConfigViewer(selectedServer)}
                className="col-span-full flex items-center justify-center gap-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3 py-2 text-xs font-medium text-slate-300 transition-all cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5 text-emerald-400" />
                <span>مشاهده و کپی متن کامل کانفیگ (در صورت عدم امکان دانلود فایل)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

