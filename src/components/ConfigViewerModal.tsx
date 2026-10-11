import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Download, FileText, CheckCircle2 } from 'lucide-react';
import { VpnServer } from '../types/vpn';

interface ConfigViewerModalProps {
  server: VpnServer | null;
  onClose: () => void;
  onDownloadConfig: (server: VpnServer) => void;
}

export const ConfigViewerModal: React.FC<ConfigViewerModalProps> = ({
  server,
  onClose,
  onDownloadConfig,
}) => {
  const [configText, setConfigText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!server) return;
    setIsLoading(true);

    fetch(`/api/config/${server.ip}`)
      .then((res) => res.text())
      .then((text) => {
        setConfigText(text);
        setIsLoading(false);
      })
      .catch(() => {
        setConfigText('خطا در دریافت متن کانفیگ');
        setIsLoading(false);
      });
  }, [server]);

  if (!server) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(configText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6 shadow-2xl text-right max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                متن کامل کانفیگ سرور ({server.country_short} {server.country_long})
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {server.clean_domain} · {server.openvpn_protocol}:{server.openvpn_port}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tip banner for Android and all browsers */}
        <div className="mt-3 rounded-lg bg-emerald-950/30 border border-emerald-500/20 p-2.5 text-xs text-emerald-300">
          <strong>راهنمای سریع:</strong> با زدن دکمه «کپی کل کانفیگ»، متن را کپی کنید. سپس در برنامه <strong>v2rayNG</strong> یا <strong>OpenVPN</strong> یا <strong>Sing-box</strong> گزینه <strong>«Import from clipboard» (درون‌ریزی از کلیپ‌بورد)</strong> را بزنید. هیچ نیازی به دانلود فایل نیست!
        </div>

        {/* Code Content Area */}
        <div className="my-3 flex-1 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-3">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center text-xs text-slate-400">
              در حال دریافت متن کانفیگ...
            </div>
          ) : (
            <textarea
              readOnly
              dir="ltr"
              value={configText}
              className="h-60 w-full resize-none bg-transparent font-mono text-[11px] text-slate-300 focus:outline-none select-all"
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={handleCopy}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-all cursor-pointer shadow-sm shadow-emerald-500/20 disabled:opacity-50"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? 'با موفقیت کپی شد!' : 'کپی کل کانفیگ (برای درون‌ریزی در نرم‌افزار)'}</span>
          </button>

          <button
            onClick={() => onDownloadConfig(server)}
            disabled={isLoading}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>دانلود فایل</span>
          </button>
        </div>
      </div>
    </div>
  );
};
