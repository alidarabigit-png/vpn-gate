import React, { useState } from 'react';
import {
  Search,
  Download,
  QrCode,
  Laptop,
  Apple,
  RefreshCw,
  Copy,
  Check,
  Zap,
  Globe,
  SlidersHorizontal,
  FileText,
  Power,
  Activity,
} from 'lucide-react';
import { VpnServer } from '../types/vpn';
import {
  downloadClientBlob,
  generateWindowsBat,
  generateAppleMobileConfig,
} from '../utils/vpnGenerators';

interface ServerListTableProps {
  servers: VpnServer[];
  selectedServerId?: string;
  onSelectForPower?: (server: VpnServer) => void;
  onOpenQr: (server: VpnServer) => void;
  onDownloadConfig: (server: VpnServer) => void;
  onTestSingle: (server: VpnServer) => void;
  isTestingBulk: boolean;
  onRefreshServers: () => void;
  onBulkTest?: () => void;
  onCopyConfigText?: (server: VpnServer) => void;
  onOpenConfigViewer?: (server: VpnServer) => void;
  onOpenQuickConnect?: (server: VpnServer) => void;
}

export const ServerListTable: React.FC<ServerListTableProps> = ({
  servers,
  selectedServerId,
  onSelectForPower,
  onOpenQr,
  onDownloadConfig,
  onTestSingle,
  isTestingBulk,
  onRefreshServers,
  onBulkTest,
  onCopyConfigText,
  onOpenConfigViewer,
  onOpenQuickConnect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [protocolFilter, setProtocolFilter] = useState<'all' | 'TCP' | 'UDP'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'high_speed'>('all');
  const [copiedHost, setCopiedHost] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHost(id);
    setTimeout(() => setCopiedHost(null), 1500);
  };

  const filteredServers = servers.filter((s) => {
    if (protocolFilter !== 'all' && s.openvpn_protocol !== protocolFilter) {
      return false;
    }
    if (statusFilter === 'online' && s.testedStatus !== 'online' && !s.ping) {
      return false;
    }
    if (statusFilter === 'high_speed' && s.speed < 50000000) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchCountry =
        s.country_long.toLowerCase().includes(q) || s.country_short.toLowerCase().includes(q);
      const matchHost = s.clean_domain.toLowerCase().includes(q);
      const matchIp = s.ip.includes(q);
      if (!matchCountry && !matchHost && !matchIp) return false;
    }

    return true;
  });

  const onlineCount = servers.filter((s) => s.testedStatus === 'online').length;

  return (
    <section id="servers-section" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Globe className="h-5 w-5 text-emerald-400" />
              داشبورد سرورهای زنده و پایدار
            </h2>
            <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-mono text-slate-300">
              {servers.length} سرور فعال
            </span>
            {onlineCount > 0 && (
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-mono text-emerald-300">
                {onlineCount} آنلاین
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            مشاهده، پایش پینگ زنده و انتخاب مستقیم هر سرور برای دکمه پاور با ۱ کلیک
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onBulkTest && (
            <button
              onClick={onBulkTest}
              disabled={isTestingBulk}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Activity className={`h-3.5 w-3.5 ${isTestingBulk ? 'animate-spin' : ''}`} />
              <span>{isTestingBulk ? 'در حال تست...' : 'تست پینگ سرورها'}</span>
            </button>
          )}

          <button
            onClick={onRefreshServers}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isTestingBulk ? 'animate-spin' : ''}`} />
            <span>بروزرسانی لیست</span>
          </button>
        </div>
      </div>

      {/* Search and Segmented Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-6 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در کشورها، دامنه‌ها یا IP سرور..."
            className="w-full rounded-lg border border-slate-800 bg-slate-950 pr-10 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
          />
        </div>

        {/* Filter Controls (buttons with click handlers) */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center rounded-lg bg-slate-950 p-1 border border-slate-800">
            <button
              onClick={() => setProtocolFilter('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                protocolFilter === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              همه پروتکل‌ها
            </button>
            <button
              onClick={() => setProtocolFilter('TCP')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                protocolFilter === 'TCP'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              فقط TCP (ضد فیلتر)
            </button>
            <button
              onClick={() => setProtocolFilter('UDP')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                protocolFilter === 'UDP'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              UDP
            </button>
          </div>

          <div className="flex items-center rounded-lg bg-slate-950 p-1 border border-slate-800">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              همه سرورها
            </button>
            <button
              onClick={() => setStatusFilter('online')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                statusFilter === 'online'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              آماده اتصال (L2TP)
            </button>
            <button
              onClick={() => setStatusFilter('high_speed')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                statusFilter === 'high_speed'
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              سرعت بالا (+۵۰ Mbps)
            </button>
          </div>
        </div>
      </div>

      {/* Main Server Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/70 shadow-lg">
        <table className="w-full text-right text-xs">
          <thead className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold">
            <tr>
              <th className="py-3.5 px-4">کشور و هاست سرور</th>
              <th className="py-3.5 px-4 text-left">سرعت</th>
              <th className="py-3.5 px-4 text-left">پینگ</th>
              <th className="py-3.5 px-4">نشست‌ها</th>
              <th className="py-3.5 px-4">پروتکل / پورت</th>
              <th className="py-3.5 px-4 text-center">وضعیت تست</th>
              <th className="py-3.5 px-4 text-center">اقدامات اتصال</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredServers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  سروری با مشخصات جستجو شده یافت نشد. فیلترها را تغییر دهید.
                </td>
              </tr>
            ) : (
              filteredServers.map((server, idx) => {
                const rowKey =
                  server.id || `${server.ip}-${server.openvpn_port}-${server.openvpn_protocol}-${idx}`;
                const speedMbps = (server.speed / 1000000).toFixed(1);
                const isOnline = server.testedStatus === 'online';
                const isOffline = server.testedStatus === 'offline';
                const isTesting = server.testedStatus === 'testing';
                const isSelected =
                  !!selectedServerId &&
                  (server.id === selectedServerId || server.ip === selectedServerId);

                return (
                  <tr
                    key={rowKey}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-emerald-950/40 border-r-4 border-r-emerald-400 ring-1 ring-emerald-500/30'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Country & Host Column */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          {server.country_short}
                        </span>
                        <span className="text-slate-300 font-medium">
                          {server.country_long}
                        </span>
                        {isSelected && (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                            <Zap className="h-2.5 w-2.5" />
                            پیشنهاد دکمه پاور
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 font-mono text-[11px] text-slate-400">
                        <span
                          dir="ltr"
                          className="truncate max-w-[200px] hover:text-emerald-300 transition-colors cursor-pointer"
                          onClick={() => handleCopy(server.sstp_endpoint, rowKey)}
                          title="کلیک برای کپی آدرس ویندوز"
                        >
                          {server.clean_domain}
                        </span>
                        <button
                          onClick={() => handleCopy(server.clean_domain, rowKey)}
                          className="text-slate-400 hover:text-white"
                          title="کپی"
                        >
                          {copiedHost === rowKey ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Speed Column */}
                    <td className="py-3 px-4 text-left font-mono tabular-nums">
                      <span className="font-bold text-emerald-400">{speedMbps}</span>
                      <span className="text-slate-500 text-[10px] mr-1">Mbps</span>
                    </td>

                    {/* Ping Column */}
                    <td className="py-3 px-4 text-left font-mono tabular-nums text-slate-300">
                      {server.ping > 0 ? `${server.ping} ms` : '-'}
                    </td>

                    {/* Sessions Column */}
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-400">
                      {server.num_vpn_sessions}
                    </td>

                    {/* Protocol & Port */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-mono font-medium ${
                          server.openvpn_protocol === 'TCP'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {server.openvpn_protocol}:{server.openvpn_port}
                      </span>
                    </td>

                    {/* Latency / Prober Status */}
                    <td className="py-3 px-4 text-center">
                      {isTesting ? (
                        <span className="text-amber-400 animate-pulse text-[11px]">
                          در حال ارزیابی...
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-mono tabular-nums text-emerald-400 text-[11px] font-semibold">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {server.testedLatency ? `${server.testedLatency} ms` : (server.ping > 0 ? `${server.ping} ms` : 'آماده L2TP')}
                        </span>
                      )}
                    </td>

                    {/* Actions Column */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Select for Power Button / Quick Connect */}
                        {onSelectForPower && (
                          <button
                            onClick={() => {
                              onSelectForPower(server);
                              if (onOpenQuickConnect) {
                                onOpenQuickConnect(server);
                              }
                            }}
                            title={
                              isSelected
                                ? 'سرور فعال دکمه پاور (کلیک برای باز کردن پنجره اتصال سریع L2TP)'
                                : 'انتخاب این سرور، کپی آیپی و اتصال سریع L2TP'
                            }
                            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                                : 'bg-slate-800 text-slate-300 hover:bg-emerald-500 hover:text-slate-950'
                            }`}
                          >
                            <Power className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {/* Copy for v2rayNG / Sing-box */}
                        {onCopyConfigText && (
                          <button
                            onClick={() => onCopyConfigText(server)}
                            title="کپی مستقیم کانفیگ (درون‌ریزی از کلیپ‌بورد در v2rayNG / Sing-box)"
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition-colors cursor-pointer"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {/* Windows 1-Click Script */}
                        <button
                          onClick={() => {
                            const bat = generateWindowsBat(server);
                            downloadClientBlob(
                              bat,
                              `connect_vpngate_${server.country_short.toLowerCase()}.bat`,
                              'application/x-bat;charset=utf-8'
                            );
                          }}
                          title="دانلود اسکریپت اتصال ویندوز (.bat)"
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:bg-emerald-500 hover:text-slate-950 transition-colors cursor-pointer"
                        >
                          <Laptop className="h-3.5 w-3.5" />
                        </button>

                        {/* Apple MobileConfig */}
                        <button
                          onClick={() => {
                            const cfg = generateAppleMobileConfig(server);
                            downloadClientBlob(
                              cfg,
                              `vpngate_${server.country_short.toLowerCase()}.mobileconfig`,
                              'application/x-apple-aspen-config;charset=utf-8'
                            );
                          }}
                          title="پروفایل خودکار آیفون (.mobileconfig)"
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:bg-emerald-500 hover:text-slate-950 transition-colors cursor-pointer"
                        >
                          <Apple className="h-3.5 w-3.5" />
                        </button>

                        {/* Download .ovpn */}
                        <button
                          onClick={() => onDownloadConfig(server)}
                          title="دانلود کانفیگ OpenVPN (.ovpn)"
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:bg-emerald-500 hover:text-slate-950 transition-colors cursor-pointer"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>

                        {/* Show QR Modal */}
                        <button
                          onClick={() => onOpenQr(server)}
                          title="بارکد QR و راهنمای موبایل"
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:bg-emerald-500 hover:text-slate-950 transition-colors cursor-pointer"
                        >
                          <QrCode className="h-3.5 w-3.5" />
                        </button>

                        {/* View Raw Config Text Modal */}
                        {onOpenConfigViewer && (
                          <button
                            onClick={() => onOpenConfigViewer(server)}
                            title="مشاهده متن کامل کانفیگ"
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:bg-emerald-500 hover:text-slate-950 transition-colors cursor-pointer"
                          >
                            <FileText className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
