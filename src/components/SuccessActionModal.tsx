import React from 'react';
import {
  CheckCircle2,
  X,
  Laptop,
  Smartphone,
  Apple,
  Copy,
  Check,
  Download,
  Terminal,
} from 'lucide-react';
import { VpnServer, PlatformType } from '../types/vpn';
import {
  downloadClientBlob,
  generateWindowsBat,
  generateCleanOvpn,
} from '../utils/vpnGenerators';

interface SuccessActionModalProps {
  platform: PlatformType;
  server: VpnServer;
  onClose: () => void;
  onOpenQr: (server: VpnServer) => void;
}

export const SuccessActionModal: React.FC<SuccessActionModalProps> = ({
  platform,
  server,
  onClose,
  onOpenQr,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyCommand = () => {
    let text = '';
    if (platform === 'windows') {
      text = `powershell -Command "Add-VpnConnection -Name 'VPNGate' -ServerAddress '${server.sstp_endpoint}' -TunnelType Sstp -Force; rasdial VPNGate vpn vpn"`;
    } else if (platform === 'android') {
      text = generateCleanOvpn(server);
    } else {
      text = `Server: ${server.clean_domain}\nAccount: vpn\nPassword: vpn\nSecret: vpn`;
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReDownload = () => {
    if (platform === 'windows') {
      const bat = generateWindowsBat(server);
      downloadClientBlob(bat, `connect_vpngate_${server.country_short.toLowerCase()}.bat`, 'application/x-bat;charset=utf-8');
    } else if (platform === 'ios') {
      window.location.href = `/api/mobileconfig/${server.ip}`;
    } else {
      const ovpn = generateCleanOvpn(server);
      downloadClientBlob(ovpn, `vpngate_${server.country_short.toLowerCase()}_${server.ip.replace(/\./g, '_')}.ovpn`, 'application/x-openvpn-profile;charset=utf-8');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-emerald-500/40 bg-slate-900 p-6 shadow-2xl text-right max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute left-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Success Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              دستور اتصال با موفقیت صادر شد!
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              سرور انتخاب‌شده: {server.country_short} {server.country_long} ({server.clean_domain})
            </p>
          </div>
        </div>

        {/* Windows specific instructions */}
        {platform === 'windows' && (
          <div className="space-y-4 text-xs text-slate-300">
            <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 space-y-2">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5 text-sm">
                <Laptop className="h-4 w-4" />
                فایل اسکریپت اتصال دانلود شد:
              </span>
              <p className="text-slate-300 leading-relaxed">
                ۱. فایل <strong className="text-white font-mono">connect_vpngate.bat</strong> هم‌اکنون در رایانه شما دانلود شد.
              </p>
              <p className="text-slate-300 leading-relaxed">
                ۲. روی فایل دانلود شده راست‌کلیک کرده و گزینه <strong className="text-emerald-300">Run as administrator</strong> را بزنید.
              </p>
              <p className="text-slate-300 leading-relaxed">
                ۳. کانکشن بدون نیاز به هیچ برنامه‌ای مستقیماً در ویندوز ساخته شده و متصل می‌شود!
              </p>
            </div>

            <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 flex items-center gap-1 font-mono text-[11px]">
                  <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                  دستور مستقیم PowerShell (کپی‌شده در حافظه):
                </span>
                <button
                  onClick={handleCopyCommand}
                  className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'کپی شد' : 'کپی مجدد'}</span>
                </button>
              </div>
              <pre className="overflow-x-auto rounded bg-slate-900 p-2 font-mono text-[11px] text-slate-300" dir="ltr">
                {`rasdial VPNGate vpn vpn`}
              </pre>
            </div>
          </div>
        )}

        {/* Android specific instructions */}
        {platform === 'android' && (
          <div className="space-y-4 text-xs text-slate-300">
            <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 space-y-2">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5 text-sm">
                <Smartphone className="h-4 w-4" />
                کانفیگ در حافظه کپی شد و فایل ذخیره گردید:
              </span>
              <p className="text-slate-300 leading-relaxed">
                ۱. نرم‌افزار <strong className="text-white">v2rayNG</strong> یا <strong className="text-white">Sing-box</strong> را در گوشی باز کنید.
              </p>
              <p className="text-slate-300 leading-relaxed">
                ۲. علامت <strong>+</strong> یا منوی سه نقطه را بزنید و گزینه <strong className="text-emerald-300">Import config from clipboard (درون‌ریزی از کلیپ‌بورد)</strong> را انتخاب کنید.
              </p>
              <p className="text-slate-300 leading-relaxed">
                ۳. دکمه اتصال را در برنامه لمس کنید تا فیلترشکن متصل شود!
              </p>
            </div>
          </div>
        )}

        {/* iOS specific instructions */}
        {platform === 'ios' && (
          <div className="space-y-3.5 text-xs text-slate-300">
            {/* Manual Setup Card (Primary) */}
            <div className="rounded-xl bg-slate-950 p-4 border border-emerald-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5 text-sm">
                  <Apple className="h-4 w-4" />
                  مشخصات اتصال در آیفون (L2TP - بدون نیاز به فیلترشکن):
                </span>
                <button
                  onClick={handleCopyCommand}
                  className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-xs font-semibold cursor-pointer"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'کپی شد!' : 'کپی مشخصات'}</span>
                </button>
              </div>

              <p className="text-slate-300 leading-relaxed text-[11px]">
                در آیفون وارد مسیر <strong className="text-white">Settings &gt; VPN &gt; Add VPN Configuration</strong> شوید و اطلاعات زیر را وارد نمایید:
              </p>

              <div className="font-mono text-[11px] bg-slate-900/90 p-3 rounded-lg border border-slate-800 space-y-1.5" dir="ltr">
                <div className="flex justify-between">
                  <span className="text-slate-400">Type:</span>
                  <span className="text-emerald-300 font-bold">L2TP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Server:</span>
                  <span className="text-white font-bold">{server.clean_domain}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Account:</span>
                  <span className="text-emerald-400 font-bold">vpn</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Password:</span>
                  <span className="text-emerald-400 font-bold">vpn</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Secret:</span>
                  <span className="text-emerald-400 font-bold">vpn</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Send All Traffic:</span>
                  <span className="text-white font-bold">ON</span>
                </div>
              </div>
            </div>

            {/* Optional Profile Method */}
            <div className="rounded-xl bg-slate-950/80 p-3 border border-slate-800 text-[11px] space-y-1.5 text-slate-400">
              <span className="font-semibold text-slate-300 block">
                روش‌های دیگر اتصال (اختیاری):
              </span>
              <p className="leading-relaxed">
                • <strong>اسکن بارکد QR:</strong> در برنامه‌های <span className="text-white">V2Box</span> یا <span className="text-white">Streisand</span> روی دکمه نمایش بارکد QR در پایین کلیک کنید.
              </p>
              <p className="leading-relaxed">
                • <strong>نصب خودکار پروفایل (اختیاری):</strong> اگر مایل بودید می‌توانید دکمه «دانلود پروفایل خودکار» را بزنید و در Settings &gt; Profile Downloaded تایید کنید.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons Row */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex flex-wrap gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-colors cursor-pointer"
          >
            متوجه شدم، بستن پنجره
          </button>

          {platform === 'ios' ? (
            <button
              onClick={handleReDownload}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Apple className="h-3.5 w-3.5 text-slate-400" />
              <span>دانلود پروفایل (.mobileconfig - اختیاری)</span>
            </button>
          ) : (
            <button
              onClick={handleReDownload}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>دانلود مجدد فایل</span>
            </button>
          )}

          <button
            onClick={() => {
              onClose();
              onOpenQr(server);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <span>نمایش بارکد QR</span>
          </button>
        </div>
      </div>
    </div>
  );
};
