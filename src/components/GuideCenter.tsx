import React, { useState } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Apple,
  Laptop,
  Smartphone,
  AlertTriangle,
  Lightbulb,
  Copy,
  Check,
} from 'lucide-react';
import { SETUP_GUIDES } from '../data/guides';
import { SetupGuide } from '../types/vpn';

export const GuideCenter: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'fast_connect' | 'apps' | 'troubleshooting'>('all');
  const [expandedId, setExpandedId] = useState<string>('ios-profile');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const filteredGuides = SETUP_GUIDES.filter((g) => {
    if (selectedCategory === 'all') return true;
    return g.category === selectedCategory;
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? '' : id);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
          راهنمای جامع اتصال، تنظیمات و رفع اشکال
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          آموزش گام‌به‌گام اتصال برای انواع گوشی‌ها و سیستم‌ها + ترفندهای ویژه دور زدن فیلترینگ در ایران
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-xl bg-slate-900/90 p-1 border border-slate-800 shadow-sm overflow-x-auto max-w-full">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            همه آموزش‌ها
          </button>
          <button
            onClick={() => setSelectedCategory('fast_connect')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'fast_connect'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            اتصال سریع بدون نرم‌افزار
          </button>
          <button
            onClick={() => setSelectedCategory('apps')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'apps'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            نرم‌افزارهای کلاینت
          </button>
          <button
            onClick={() => setSelectedCategory('troubleshooting')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'troubleshooting'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            رفع اشکال اپراتورها (همراه اول/ایرانسل)
          </button>
        </div>
      </div>

      {/* Accordion Guide Cards */}
      <div className="space-y-4">
        {filteredGuides.map((guide) => {
          const isExpanded = expandedId === guide.id;

          return (
            <div
              key={guide.id}
              className={`rounded-xl border transition-all overflow-hidden ${
                isExpanded
                  ? 'border-emerald-500/40 bg-slate-900/90 shadow-lg'
                  : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
              }`}
            >
              {/* Accordion Title Header */}
              <button
                onClick={() => toggleExpand(guide.id)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-right cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-emerald-400 shrink-0">
                    {guide.platform === 'ios' && <Apple className="h-5 w-5" />}
                    {guide.platform === 'windows' && <Laptop className="h-5 w-5" />}
                    {guide.platform === 'android' && <Smartphone className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      {guide.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                      {guide.summary}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-400 shrink-0 mr-2">
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </button>

              {/* Accordion Content Body */}
              {isExpanded && (
                <div className="border-t border-slate-800/80 p-4 sm:p-6 bg-slate-950/40 space-y-6">
                  {/* Steps List */}
                  <div className="space-y-4">
                    {guide.steps.map((step) => (
                      <div
                        key={step.stepNumber}
                        className="flex items-start gap-3.5"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold font-mono shrink-0 mt-0.5 border border-emerald-500/30">
                          {step.stepNumber}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xs sm:text-sm font-semibold text-slate-200">
                            {step.title}
                          </h4>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            {step.description}
                          </p>

                          {step.codeSnippet && (
                            <div className="relative mt-2 rounded-lg bg-slate-900 border border-slate-800 p-2.5 font-mono text-xs text-emerald-300">
                              <pre className="overflow-x-auto" dir="ltr">
                                {step.codeSnippet}
                              </pre>
                              <button
                                onClick={() => handleCopy(step.codeSnippet!)}
                                className="absolute left-2 top-2 text-slate-400 hover:text-white"
                                title="کپی"
                              >
                                {copiedCode === step.codeSnippet ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Golden Tips Box */}
                  {guide.tips.length > 0 && (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-2">
                        <Lightbulb className="h-4 w-4" />
                        <span>نکات مهم برای موفقیت در اتصال:</span>
                      </div>
                      <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                        {guide.tips.map((tip, idx) => (
                          <li key={idx} className="leading-relaxed">
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
