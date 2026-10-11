import React, { useState } from 'react';
import {
  Download,
  ExternalLink,
  Smartphone,
  Laptop,
  Apple,
  Star,
  CheckCircle2,
  Cpu,
  Layers,
} from 'lucide-react';
import { CLIENT_APPS } from '../data/clients';
import { PlatformType, ClientApp } from '../types/vpn';

export const DownloadCenter: React.FC = () => {
  const [activePlatform, setActivePlatform] = useState<PlatformType | 'all'>('all');

  const filteredApps = CLIENT_APPS.filter((app) => {
    if (activePlatform === 'all') return true;
    return app.platforms.includes(activePlatform);
  });

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
          مرکز دانلود نرم‌افزارهای کلاینت و اتصال
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          جدیدترین و امن‌ترین برنامه‌های رسمی برای اجرای انواع کانفیگ‌های VPN، V2Ray، OpenVPN و WireGuard
        </p>
      </div>

      {/* Platform Segmented Tabs */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-xl bg-slate-900/90 p-1 border border-slate-800 shadow-sm overflow-x-auto max-w-full">
          <button
            onClick={() => setActivePlatform('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activePlatform === 'all'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            همه سیستم‌ها
          </button>
          <button
            onClick={() => setActivePlatform('android')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activePlatform === 'android'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>اندروید</span>
          </button>
          <button
            onClick={() => setActivePlatform('ios')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activePlatform === 'ios'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Apple className="h-3.5 w-3.5" />
            <span>آیفون و iOS</span>
          </button>
          <button
            onClick={() => setActivePlatform('windows')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activePlatform === 'windows'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Laptop className="h-3.5 w-3.5" />
            <span>ویندوز</span>
          </button>
          <button
            onClick={() => setActivePlatform('macos')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activePlatform === 'macos'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Apple className="h-3.5 w-3.5" />
            <span>مک (macOS)</span>
          </button>
          <button
            onClick={() => setActivePlatform('linux')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activePlatform === 'linux'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Laptop className="h-3.5 w-3.5" />
            <span>لینوکس</span>
          </button>
        </div>
      </div>

      {/* Grid of Applications */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredApps.map((app) => (
          <div
            key={app.id}
            className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-5 hover:border-slate-700/80 transition-all shadow-md group"
          >
            <div>
              {/* Card Top Row */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {app.name}
                  </h3>
                  <span className="text-xs text-slate-400">{app.nameFa}</span>
                </div>
                <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-300 px-2 py-0.5 rounded text-[11px] font-mono font-medium shrink-0">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span>{app.rating}</span>
                </div>
              </div>

              {/* Supported Platforms & Version */}
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                <span className="font-mono text-emerald-400">{app.version}</span>
                <span>·</span>
                <span className="text-slate-400">
                  {app.platforms.map((p) => (p === 'ios' ? 'iOS' : p)).join(', ')}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                {app.description}
              </p>

              {/* Supported Protocols */}
              <div className="mb-5">
                <span className="text-[11px] font-medium text-slate-400 mb-1.5 block">
                  پروتکل‌های پشتیبانی‌شده:
                </span>
                <div className="flex flex-wrap gap-1">
                  {app.protocols.map((proto) => (
                    <span
                      key={proto}
                      className="rounded bg-slate-950 px-2 py-0.5 text-[10px] font-mono text-slate-300 border border-slate-800"
                    >
                      {proto}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Download Buttons Row */}
            <div className="pt-4 border-t border-slate-800/80 flex flex-wrap gap-2">
              {app.links.direct && (
                <a
                  href={app.links.direct}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition-colors shadow-sm"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>دانلود مستقیم</span>
                </a>
              )}

              {app.links.github && (
                <a
                  href={app.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors border border-slate-700"
                  title="مخزن رسمی گیت‌هاب"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>GitHub</span>
                </a>
              )}

              {app.links.appStore && (
                <a
                  href={app.links.appStore}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors border border-slate-700"
                >
                  <Apple className="h-3.5 w-3.5" />
                  <span>App Store</span>
                </a>
              )}

              {app.links.googlePlay && (
                <a
                  href={app.links.googlePlay}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors border border-slate-700"
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>Google Play</span>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
