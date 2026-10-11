import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Copy,
  Check,
  Apple,
  Download,
  Smartphone,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { VpnServer } from '../types/vpn';
import {
  downloadClientBlob,
  generateAppleMobileConfig,
} from '../utils/vpnGenerators';

interface QrModalProps {
  server: VpnServer | null;
  onClose: () => void;
  onDownloadConfig: (server: VpnServer) => void;
  onCopyConfigText?: (server: VpnServer) => void;
  onOpenConfigViewer?: (server: VpnServer) => void;
}

export const QrModal: React.FC<QrModalProps> = ({
  server,
  onClose,
  onDownloadConfig,
  onCopyConfigText,
  onOpenConfigViewer,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  useEffect(() => {
    if (!server) return;

    // Generate QR code for clean domain or full deep link
    const textToEncode = server.clean_domain;
    QRCode.toDataURL(textToEncode, {
      width: 220,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error(err));
  }, [server]);

  if (!server) return null;

  const handleCopyDomain = () => {
    navigator.clipboard.writeText(server.clean_domain);
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 2000);
  };

  const handleCopyAll = () => {
    const text = `نوع کانکشن: L2TP / SSTP\nآدرس سرور: ${server.clean_domain}\nپورت: ${server.openvpn_port}\nنام کاربری: vpn\nرمز عبور: vpn\nکد امنیتی (Secret): vpn`;
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-right max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute left-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <Smartphone className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              تنظیم در گوشی و بارکد هوشمند
            </h3>
            <p className="text-xs text-slate-400">
              {server.country_short} {server.country_long} ({server.openvpn_protocol}:{server.openvpn_port})
            </p>
          </div>
        </div>

        {/* QR Code Canvas */}
        <div className="flex flex-col items-center justify-center my-4">
          <div className="rounded-xl bg-white p-3 shadow-md">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="VPN Gate Server QR"
                className="h-44 w-44 object-contain"
              />
            ) : (
              <div className="h-44 w-44 flex items-center justify-center text-xs text-slate-400">
                در حال ساخت بارکد...
              </div>
            )}
          </div>
          <span className="font-mono text-xs text-slate-300 mt-2 truncate max-w-full" dir="ltr">
            {server.clean_domain}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5">
            با دوربین گوشی یا برنامه v2rayNG اسکن کنید
          </span>
        </div>

        {/* iOS Settings Mockup */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 mb-4 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-2.5">
            <Apple className="h-3.5 w-3.5" />
            <span>تنظیمات پیش‌فرض آیفون (Settings &gt; VPN)</span>
          </div>

          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between border-b border-slate-900 pb-1">
              <span className="text-slate-500">Type</span>
              <span className="text-white">L2TP</span>
            </div>
            <div className="flex justify-between border-b border-slate-900 pb-1">
              <span className="text-slate-500">Server</span>
              <span className="text-emerald-400 truncate max-w-[200px]" dir="ltr">
                {server.clean_domain}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-900 pb-1">
              <span className="text-slate-500">Account</span>
              <span className="text-white">vpn</span>
            </div>
            <div className="flex justify-between border-b border-slate-900 pb-1">
              <span className="text-slate-500">Password</span>
              <span className="text-white">vpn</span>
            </div>
            <div className="flex justify-between border-b border-slate-900 pb-1">
              <span className="text-slate-500">Secret</span>
              <span className="text-white">vpn</span>
            </div>
            <div className="flex justify-between pt-0.5">
              <span className="text-slate-500">Send All Traffic</span>
              <span className="text-emerald-400">ON (سبز)</span>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="space-y-2">
          {onCopyConfigText && (
            <button
              onClick={() => onCopyConfigText(server)}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-3 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-all cursor-pointer shadow-sm shadow-emerald-500/20"
            >
              <Copy className="h-4 w-4" />
              <span>کپی متن کانفیگ (درون‌ریزی از کلیپ‌بورد در v2rayNG / Sing-box)</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCopyDomain}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {copiedDomain ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedDomain ? 'کپی شد!' : 'کپی آدرس دامنه'}</span>
            </button>

            <button
              onClick={handleCopyAll}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {copiedAll ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedAll ? 'کپی شد!' : 'کپی مشخصات L2TP'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onDownloadConfig(server)}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>دانلود فایل .ovpn</span>
            </button>

            {onOpenConfigViewer ? (
              <button
                onClick={() => onOpenConfigViewer(server)}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>مشاهده متن کامل</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  const cfg = generateAppleMobileConfig(server);
                  downloadClientBlob(
                    cfg,
                    `vpngate_${server.country_short.toLowerCase()}.mobileconfig`,
                    'application/x-apple-aspen-config;charset=utf-8'
                  );
                }}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 transition-colors cursor-pointer"
              >
                <Apple className="h-3.5 w-3.5" />
                <span>پروفایل آیفون</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
