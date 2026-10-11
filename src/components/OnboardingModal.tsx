import React, { useState } from 'react';
import {
  PowerOff,
  Activity,
  X,
  Sparkles,
  ArrowLeft,
  Wifi,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTesting: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onStartTesting,
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('vpngate_hide_onboarding', 'true');
    }
    onClose();
  };

  const handleStart = () => {
    handleClose();
    onStartTesting();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-xl rounded-2xl border border-emerald-500/40 bg-slate-900 p-6 sm:p-7 shadow-2xl text-right max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute left-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 border-b border-slate-800 pb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              راهنمای گام‌به‌گام اتصال و تست در اینترنت ایران
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              ۴ مرحله کوتاه برای تست واقعی و اتصال تضمینی روی اپراتور شما
            </p>
          </div>
        </div>

        {/* 4 Steps */}
        <div className="space-y-3 mb-6 text-xs text-slate-300">
          {/* Step 1 */}
          <div className="flex items-start gap-3 rounded-xl bg-slate-950/70 p-3.5 border border-slate-800">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-emerald-400 font-bold font-mono shrink-0 mt-0.5 border border-slate-700">
              ۱
            </div>
            <div>
              <h3 className="font-bold text-slate-200 text-sm mb-1 flex items-center gap-1.5">
                <Wifi className="h-4 w-4 text-emerald-400" />
                ورود اولیه به سایت و دریافت لیست سرورها
              </h3>
              <p className="text-slate-400 leading-relaxed">
                اگر برای بار اول با فیلترشکن وارد شدید، کاملاً درست است؛ برنامه اکنون در مرورگر شما لود شده و لیست ده‌ها سرور فعال جهانی در حافظه دستگاه ذخیره شده است.
              </p>
            </div>
          </div>

          {/* Step 2 - Critical Warning */}
          <div className="flex items-start gap-3 rounded-xl bg-amber-500/10 p-3.5 border border-amber-500/30">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 font-bold font-mono shrink-0 mt-0.5 border border-amber-500/40">
              ۲
            </div>
            <div>
              <h3 className="font-bold text-amber-300 text-sm mb-1 flex items-center gap-1.5">
                <PowerOff className="h-4 w-4" />
                فیلترشکن قبلی دستگاه را خاموش کنید (بسیار مهم!)
              </h3>
              <p className="text-amber-200/90 leading-relaxed">
                قبل از زدن دکمه تست، <strong>حتماً فیلترشکن قبلی گوشی یا لپ‌تاپ را قطع کنید</strong>. در غیر این صورت، پینگ سرورها با اینترنت فیلترشکن قبلی شما سنجیده می‌شود، نه با اینترنت مستقیم و واقعی همراه اول، ایرانسل یا مخابرات شما!
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3 rounded-xl bg-slate-950/70 p-3.5 border border-slate-800">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-emerald-400 font-bold font-mono shrink-0 mt-0.5 border border-slate-700">
              ۳
            </div>
            <div>
              <h3 className="font-bold text-emerald-300 text-sm mb-1 flex items-center gap-1.5">
                <Activity className="h-4 w-4" />
                اجرای تست پینگ و سلامت سرورها
              </h3>
              <p className="text-slate-400 leading-relaxed">
                روی دکمه <strong>«تست سریع سرورها»</strong> کلیک کنید. سیستم سرورهای منتخب (به ویژه پورت‌های ۴۴۳ و ۹۹۵ بر بستر TCP) را روی اینترنت مستقیم شما تست می‌کند و سرورهای سالم با رنگ <strong>سبز</strong> و پینگ زنده مشخص می‌شوند.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex items-start gap-3 rounded-xl bg-slate-950/70 p-3.5 border border-slate-800">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-emerald-400 font-bold font-mono shrink-0 mt-0.5 border border-slate-700">
              ۴
            </div>
            <div>
              <h3 className="font-bold text-white text-sm mb-1 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                اتصال با ۱ کلیک یا انتخاب از جدول
              </h3>
              <p className="text-slate-400 leading-relaxed">
                سرور پیشنهادی زیر <strong>دکمه پاور</strong> همیشه از میان سرورهای آنلاین تست‌شده انتخاب می‌شود. همچنین می‌توانید در جدول پایین، هر سروری را که خواستید مستقیماً برای دکمه پاور انتخاب یا کپی کنید!
              </p>
              <div className="mt-2 rounded-lg bg-slate-950 p-2 text-[11px] text-slate-300 leading-relaxed border border-slate-800">
                <strong className="text-emerald-400">کاربران آیفون:</strong> راحت‌ترین روش، اسکن بارکد در برنامه رایگان <strong>V2Box</strong> یا کپی اطلاعات سرور و وارد کردن دستی در تنظیمات VPN آیفون است (دانلود پروفایل نیز به صورت اختیاری موجود است).
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer self-start sm:self-center">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0"
            />
            <span>این راهنما را در ورودهای بعدی نمایش نده</span>
          </label>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleStart}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-colors cursor-pointer shadow-md shadow-emerald-500/20"
            >
              <span>متوجه شدم و آغاز تست</span>
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
