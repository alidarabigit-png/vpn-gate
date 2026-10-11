import React from 'react';
import { ShieldCheck, Activity, HelpCircle } from 'lucide-react';

interface HeaderProps {
  activeTab: 'connect' | 'servers' | 'downloads' | 'guides';
  setActiveTab: (tab: 'connect' | 'servers' | 'downloads' | 'guides') => void;
  onQuickTest: () => void;
  isTesting: boolean;
  onOpenOnboarding?: () => void;
  testProgressText?: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onQuickTest,
  isTesting,
  onOpenOnboarding,
  testProgressText,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Zone (Single-line wordmark in display face) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-950">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
            VPN Gate Smart
          </span>
        </div>

        {/* Zone 2: 4 Clean single-line nav links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2 text-sm font-medium">
          <button
            onClick={() => setActiveTab('connect')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'connect'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            اتصال هوشمند
          </button>
          <button
            onClick={() => setActiveTab('servers')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'servers'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            سرورهای زنده
          </button>
          <button
            onClick={() => setActiveTab('downloads')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'downloads'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            دانلود نرم‌افزارها
          </button>
          <button
            onClick={() => setActiveTab('guides')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'guides'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            راهنمای جامع
          </button>
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {onOpenOnboarding && (
            <button
              onClick={onOpenOnboarding}
              className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 sm:px-3 py-2 text-xs font-medium text-amber-300 hover:bg-amber-500/20 transition-colors cursor-pointer"
              title="راهنمای ۴ مرحله‌ای تست اینترنت در ایران"
            >
              <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline">راهنمای تست ایران</span>
              <span className="sm:hidden">راهنما</span>
            </button>
          )}

          <button
            onClick={onQuickTest}
            disabled={isTesting}
            className="flex items-center gap-2 rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-slate-950 transition-all hover:bg-emerald-400 active:scale-95 disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer shadow-sm shadow-emerald-500/20"
          >
            <Activity className={`h-3.5 w-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            <span>
              {isTesting
                ? testProgressText || 'در حال تست پینگ...'
                : 'تست سریع سرورها'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile nav bar row */}
      <div className="flex md:hidden border-t border-slate-800/60 bg-slate-950/90 px-4 py-2 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('connect')}
          className={`px-3 py-1.5 text-xs rounded-md whitespace-nowrap ${
            activeTab === 'connect'
              ? 'bg-emerald-500/20 text-emerald-300 font-medium'
              : 'text-slate-400'
          }`}
        >
          اتصال هوشمند
        </button>
        <button
          onClick={() => setActiveTab('servers')}
          className={`px-3 py-1.5 text-xs rounded-md whitespace-nowrap ${
            activeTab === 'servers'
              ? 'bg-emerald-500/20 text-emerald-300 font-medium'
              : 'text-slate-400'
          }`}
        >
          سرورها
        </button>
        <button
          onClick={() => setActiveTab('downloads')}
          className={`px-3 py-1.5 text-xs rounded-md whitespace-nowrap ${
            activeTab === 'downloads'
              ? 'bg-emerald-500/20 text-emerald-300 font-medium'
              : 'text-slate-400'
          }`}
        >
          دانلود برنامه‌ها
        </button>
        <button
          onClick={() => setActiveTab('guides')}
          className={`px-3 py-1.5 text-xs rounded-md whitespace-nowrap ${
            activeTab === 'guides'
              ? 'bg-emerald-500/20 text-emerald-300 font-medium'
              : 'text-slate-400'
          }`}
        >
          راهنماها
        </button>
      </div>
    </header>
  );
};
