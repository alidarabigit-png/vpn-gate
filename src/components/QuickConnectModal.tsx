import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  Smartphone,
  Apple,
  Laptop,
  ShieldCheck,
  Key,
  ExternalLink,
  FileCode,
  Sparkles,
  Info,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { VpnServer, PlatformType } from '../types/vpn';
import {
  downloadClientBlob,
  generateCleanOvpn,
} from '../utils/vpnGenerators';

interface QuickConnectModalProps {
  server: VpnServer;
  initialPlatform?: PlatformType;
  onClose: () => void;
  onShowToast: (msg: string) => void;
  onOpenConfigViewer?: (server: VpnServer) => void;
  onNextServer?: () => void;
}

export const QuickConnectModal: React.FC<QuickConnectModalProps> = ({
  server,
  onClose,
  onShowToast,
  onOpenConfigViewer,
  onNextServer,
}) => {
  const [activeTab, setActiveTab] = useState<'l2tp' | 'windows' | 'ovpn'>(
    'ovpn'
  );
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, fieldId: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      onShowToast(`✅ ${label} کپی شد: ${text}`);
      setTimeout(() => setCopiedField(null), 2500);
    } catch {
      onShowToast(`خطا در کپی ${label}`);
    }
  };

  const handleDownloadAppleProfile = () => {
    onShowToast('برای آیفون از Settings بخش VPN، نوع L2TP را انتخاب و آدرس هاست، Account، Password و Secret را وارد کنید. نصب خودکار پروفایل در این نسخه ارائه نمی‌شود.');
  };

  const handleDownloadWindowsBat = () => {
    onShowToast('برای ویندوز از VPN داخلی Windows و نوع SSTP استفاده کنید. آدرس سرور را به صورت hostname وارد کنید؛ برای نمونه public-vpn-255.opengw.net:443. نام کاربری و رمز عبور vpn است.');
  };

  const handleDownloadOvpn = () => {
    const ovpn = generateCleanOvpn(server);
    const filename = `vpngate_${server.country_short.toLowerCase()}_${server.ip.replace(/\./g, '_')}.ovpn`;
    const ok = downloadClientBlob(ovpn, filename, 'application/x-openvpn-profile;charset=utf-8');
    if (ok) {
      onShowToast('✅ فایل کانفیگ OpenVPN با موفقیت دانلود شد.');
    }
  };

  const handleOpenAndroidVpnSettings = () => {
    try {
      window.location.href = 'intent:#Intent;action=android.net.vpn.SETTINGS;end';
    } catch {
      onShowToast('تنظیمات گوشی خود را باز کرده و به بخش VPN بروید.');
    }
  };

  const windowsPowerShellCmd = `Server: ${server.clean_domain}:443\nVPN type: SSTP\nUsername: vpn\nPassword: vpn`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-emerald-500/40 bg-slate-900 p-5 sm:p-7 shadow-2xl text-right max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute left-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  روش‌های اتصال به سرور VPN Gate
                </h2>
                <span className="inline-flex items-center rounded-md bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
                  {server.country_short} {server.country_long}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                روش اتصال را متناسب با دستگاه انتخاب کنید. پشتیبانی هر پروتکل باید روی همان سرور بررسی شود.
              </p>
            </div>
          </div>

          {/* Next Server Button */}
          {onNextServer && (
            <button
              onClick={onNextServer}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 px-3.5 py-2 text-xs font-extrabold transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
              title="اگر این سرور متصل نشد، برای تعویض خودکار به سرور عالی بعدی کلیک کنید"
            >
              <RefreshCw className="h-4 w-4" />
              <span>🔄 سرور بعدی (تعویض آیپی)</span>
            </button>
          )}
        </div>

        {/* Auto-Copied Banner */}
        <div className="mb-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-300 font-medium">
            <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse shrink-0" />
            <span>آدرس سرور در حافظه کلیپ‌بورد کپی شد:</span>
            <code className="font-mono bg-slate-950 px-2 py-0.5 rounded text-emerald-300 font-bold" dir="ltr">
              {server.ip}
            </code>
          </div>
          <button
            onClick={() => copyToClipboard(server.ip, 'banner_ip', 'آیپی سرور')}
            className="flex items-center gap-1 rounded bg-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/30 transition-colors cursor-pointer"
          >
            {copiedField === 'banner_ip' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            <span>کپی مجدد</span>
          </button>
        </div>

        {/* 3 Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 mb-5 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('l2tp')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'l2tp'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="h-4 w-4" />
            <span className="truncate">راهنمای iOS</span>
          </button>

          <button
            onClick={() => setActiveTab('windows')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'windows'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Laptop className="h-4 w-4" />
            <span className="truncate">راهنمای ویندوز</span>
          </button>

          <button
            onClick={() => setActiveTab('ovpn')}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'ovpn'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCode className="h-4 w-4" />
            <span className="truncate">فایل OpenVPN (.ovpn)</span>
          </button>
        </div>

        {/* Tab 1: L2TP / Direct IP */}
        {activeTab === 'l2tp' && (
          <div className="space-y-4">
            {/* Server Direct IP & Hostname Box */}
            <div className="rounded-xl bg-slate-950 p-4 border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold mb-2 block">
                مشخصات اصلی سرور (برای افزودن به تنظیمات VPN گوشی):
              </span>

              <div className="space-y-2">
                {/* IP Field */}
                <div className="flex items-center justify-between rounded-lg bg-slate-900 px-3 py-2.5 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">آدرس سرور (Hostname):</span>
                    <strong className="font-mono text-emerald-400 text-sm" dir="ltr">
                      {server.ip}
                    </strong>
                  </div>
                  <button
                    onClick={() => copyToClipboard(server.clean_domain, 'ip', 'آدرس سرور')}
                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer font-bold"
                  >
                    {copiedField === 'ip' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedField === 'ip' ? 'کپی شد' : 'کپی آیپی'}</span>
                  </button>
                </div>

                {/* Hostname Field */}
                <div className="flex items-center justify-between rounded-lg bg-slate-900 px-3 py-2 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-slate-400 shrink-0">نام هاست (Hostname):</span>
                    <span className="font-mono text-slate-300 truncate" dir="ltr">
                      {server.clean_domain}
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(server.clean_domain, 'host', 'هاست سرور')}
                    className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer shrink-0 mr-2"
                  >
                    {copiedField === 'host' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>کپی</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Standard Credentials Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">نام کاربری (Username)</span>
                  <span className="font-mono text-emerald-400 font-bold text-sm">vpn</span>
                </div>
                <button
                  onClick={() => copyToClipboard('vpn', 'user', 'نام کاربری')}
                  className="p-1.5 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                  title="کپی"
                >
                  {copiedField === 'user' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>

              <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">رمز عبور (Password)</span>
                  <span className="font-mono text-emerald-400 font-bold text-sm">vpn</span>
                </div>
                <button
                  onClick={() => copyToClipboard('vpn', 'pass', 'رمز عبور')}
                  className="p-1.5 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                  title="کپی"
                >
                  {copiedField === 'pass' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>

              <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">کلید سکرت (IPSec PSK)</span>
                  <span className="font-mono text-emerald-400 font-bold text-sm">vpn</span>
                </div>
                <button
                  onClick={() => copyToClipboard('vpn', 'psk', 'کلید امنیتی')}
                  className="p-1.5 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                  title="کپی"
                >
                  {copiedField === 'psk' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Apple iOS 1-Click Profile Section */}
            <div className="rounded-xl bg-slate-950/80 p-4 border border-emerald-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-emerald-300 text-xs sm:text-sm flex items-center gap-1.5">
                  <Apple className="h-4 w-4" />
                  تنظیم دستی L2TP/IPsec در آیفون
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  سریع‌ترین روش iOS
                </span>
              </div>
              <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                در تنظیمات آیفون به Settings &gt; VPN بروید، نوع L2TP را انتخاب کنید و مشخصات سرور را وارد نمایید. فایل نصب خودکار در این نسخه تولید نمی‌شود.
              </p>
              <button
                onClick={() => copyToClipboard(server.clean_domain, 'ios_host', 'آدرس سرور')}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 px-4 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-colors cursor-pointer shadow-md shadow-emerald-500/20"
              >
                <Download className="h-4 w-4" />
                <span>کپی آدرس سرور برای آیفون</span>
              </button>
            </div>

            {/* Android 3-Step Guide Section */}
            <div className="rounded-xl bg-slate-950/80 p-4 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-emerald-400" />
                  راهنمای ۳ مرحله‌ای اندروید (سامسونگ، شیائومی و ...):
                </span>
                <button
                  onClick={handleOpenAndroidVpnSettings}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>باز کردن تنظیمات VPN گوشی</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>

              <ol className="space-y-2 text-xs text-slate-300 pr-1 list-decimal list-inside leading-relaxed">
                <li>
                  به <strong className="text-white">Settings &gt; Connections &gt; More connection settings &gt; VPN</strong> بروید (یا در تنظیمات کلمه VPN را جستجو کنید).
                </li>
                <li>
                  دکمه <strong className="text-emerald-400">Add VPN (+)</strong> را بزنید، نام را <code className="font-mono bg-slate-900 px-1 text-emerald-300">VPNGate</code> و در برنامه L2TP VPN Client گزینه <strong className="text-white">L2TP/IPsec</strong> را انتخاب کنید.
                </li>
                <li>
                  در فیلد <strong className="text-white">Server address</strong>، هاست سرور (<code className="font-mono text-emerald-400" dir="ltr">{server.clean_domain}</code>) را پیست کنید و در فیلدهای Secret، Username و Password کلمه <code className="font-mono text-emerald-400">vpn</code> را بنویسید و ذخیره را بزنید!
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* Tab 2: Windows 1-Click L2TP/SSTP */}
        {activeTab === 'windows' && (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-950 p-4 border border-slate-800">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5 text-sm mb-2">
                <Laptop className="h-4 w-4" />
                اتصال با VPN داخلی ویندوز (SSTP):
              </span>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                در Windows 11 از Settings &gt; Network & Internet &gt; VPN گزینه Add VPN را بزنید و VPN type را روی SSTP قرار دهید. سرور را به صورت hostname وارد کنید:
              </p>

              <button
                onClick={() => copyToClipboard(server.clean_domain + ':443', 'win_host', 'آدرس SSTP')
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 px-4 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-colors cursor-pointer shadow-md shadow-emerald-500/20 mb-3"
              >
                <Download className="h-4 w-4" />
                <span>کپی آدرس سرور ویندوز</span>
              </button>

              <div className="rounded-lg bg-slate-900/90 p-3 border border-slate-800 text-[11px] text-slate-300 space-y-1.5">
                <p>۱. نام سرور: <span dir="ltr" className="font-mono text-emerald-400">{server.clean_domain}:443</span></p>
                <p>۲. نوع VPN: <strong className="text-emerald-300">SSTP</strong></p>
                <p>۳. نام کاربری و رمز عبور: <strong className="text-emerald-300">vpn</strong></p>
              </div>
            </div>

            {/* Direct PowerShell Command */}
            <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-emerald-400" />
                  اجرای مستقیم در PowerShell (بدون دانلود فایل):
                </span>
                <button
                  onClick={() => copyToClipboard(windowsPowerShellCmd, 'ps_cmd', 'دستور PowerShell')}
                  className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-xs font-bold cursor-pointer"
                >
                  {copiedField === 'ps_cmd' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedField === 'ps_cmd' ? 'کپی شد' : 'کپی دستور'}</span>
                </button>
              </div>
              <pre className="rounded bg-slate-900 p-2.5 text-[11px] font-mono text-slate-300 overflow-x-auto text-left" dir="ltr">
                {windowsPowerShellCmd}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 3: OpenVPN (.ovpn) */}
        {activeTab === 'ovpn' && (
          <div className="space-y-4">
            {/* DPI Blocking Warning */}
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs text-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <strong className="block font-bold text-amber-300 mb-1">هشدار مسدود بودن OpenVPN در اینترنت ایران:</strong>
                موفقیت اتصال به سرور، شبکه و پروتکل بستگی دارد. TCP قابل دسترس بودن پورت را نشان می‌دهد و تضمین‌کننده اتصال VPN نیست.
              </div>
            </div>

            <div className="rounded-xl bg-slate-950 p-4 border border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <FileCode className="h-4 w-4 text-emerald-400" />
                <span className="font-bold text-white text-sm">دانلود و استفاده از کانفیگ OpenVPN</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                فایل اصلی OpenVPN ارائه‌شده توسط VPN Gate دانلود می‌شود؛ محتوای آن بدون دستکاری حفظ می‌شود.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <button
                  onClick={handleDownloadOvpn}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 px-4 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-colors cursor-pointer shadow-md shadow-emerald-500/20"
                >
                  <Download className="h-4 w-4" />
                  <span>دانلود فایل .ovpn</span>
                </button>

                <button
                  onClick={() => {
                    const ovpn = generateCleanOvpn(server);
                    copyToClipboard(ovpn, 'ovpn_text', 'متن کانفیگ OpenVPN');
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 py-2.5 px-4 text-xs font-bold text-white hover:bg-slate-700 transition-colors cursor-pointer border border-slate-700"
                >
                  <Copy className="h-4 w-4" />
                  <span>کپی متن کانفیگ</span>
                </button>
              </div>

              {onOpenConfigViewer && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenConfigViewer(server);
                  }}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>مشاهده و ویرایش پیشرفته کدهای کانفیگ</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Info className="h-3.5 w-3.5 text-emerald-400" />
            <span>پروتکل: {server.openvpn_protocol || 'TCP'}:{server.openvpn_port || 443}</span>
            <span>·</span>
            <span>سرعت: {(server.speed / 1000000).toFixed(1)} Mbps</span>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            بستن پنجره
          </button>
        </div>
      </div>
    </div>
  );
};
