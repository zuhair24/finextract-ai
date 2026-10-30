import React, { useState } from 'react';
import { CompanyReport } from '../types/finance';
import { exportComparablesToExcel } from '../utils/excelExport';
import { BarChart3, Download, Building2, TrendingUp, DollarSign, Wallet, ArrowUpRight } from 'lucide-react';

interface Props {
  reports: CompanyReport[];
  activeReportId: string;
  onSelectReport: (id: string) => void;
}

export const ComparablesMatrix: React.FC<Props> = ({ reports, activeReportId, onSelectReport }) => {
  const [selectedMetricKey, setSelectedMetricKey] = useState<string>('revenue');

  const coreMetrics = [
    { key: 'revenue', label: 'Revenue', icon: DollarSign },
    { key: 'ebitda', label: 'EBITDA (Operating Profit)', icon: TrendingUp },
    { key: 'pat', label: 'Net Profit (PAT)', icon: Wallet },
    { key: 'total_assets', label: 'Total Assets', icon: Building2 },
    { key: 'total_debt', label: 'Total Debt / Borrowings', icon: BarChart3 },
    { key: 'operating_cash_flow', label: 'Operating Cash Flow', icon: TrendingUp },
  ];

  // Helper to fetch value
  const getValue = (report: CompanyReport, key: string): number | null => {
    const metric = report.metrics.find(m => m.key === key);
    return metric ? metric.currentYearValue : null;
  };

  // Find max value for bar scaling
  const maxVal = Math.max(
    ...reports.map(r => Math.abs(getValue(r, selectedMetricKey) || 0)),
    1
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs dark:shadow-xl space-y-6 p-6 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Cross-Company Comparables Engine</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Compare key financial figures across all {reports.length} corporate reports side-by-side
          </p>
        </div>
        <button
          onClick={() => exportComparablesToExcel(reports)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition"
        >
          <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Export Comparables (Excel)</span>
        </button>
      </div>

      {/* Metric Selector for Visual Ranking */}
      <div>
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
          Select Metric to Benchmark Visually:
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {coreMetrics.map(m => {
            const Icon = m.icon;
            const isSelected = selectedMetricKey === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setSelectedMetricKey(m.key)}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-50 border-blue-500 text-blue-900 dark:bg-blue-600/15 dark:border-blue-500 dark:text-white'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />}
                </div>
                <div className="text-xs font-semibold mt-2">{m.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual Benchmarking Bars */}
      <div className="p-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 rounded-2xl space-y-3">
        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span>Ranking by {coreMetrics.find(m => m.key === selectedMetricKey)?.label}</span>
          <span className="text-[11px] text-slate-500 font-normal">Amounts in ₹ Crore</span>
        </div>
        <div className="space-y-2.5">
          {reports
            .map(report => ({
              report,
              val: getValue(report, selectedMetricKey),
            }))
            .sort((a, b) => (b.val || 0) - (a.val || 0))
            .map(({ report, val }) => {
              const pct = val ? Math.max(5, Math.min(100, (Math.abs(val) / maxVal) * 100)) : 0;
              const isActive = report.id === activeReportId;
              return (
                <div
                  key={report.id}
                  onClick={() => onSelectReport(report.id)}
                  className={`p-2.5 rounded-xl border transition cursor-pointer flex flex-col gap-1.5 ${
                    isActive
                      ? 'bg-blue-50/80 border-blue-400 dark:bg-blue-950/30 dark:border-blue-500/40'
                      : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{report.companyName}</span>
                      <span className="text-[10px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-transparent">
                        {report.sector}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono font-bold text-slate-900 dark:text-white">
                      <span>{val !== null ? `₹${val.toLocaleString()} Cr` : 'N/A'}</span>
                      {isActive && (
                        <span className="text-[10px] text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/10 px-1.5 py-0.5 rounded">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-800/80 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        val && val < 0 ? 'bg-amber-500' : 'bg-gradient-to-r from-blue-500 to-emerald-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Side-by-Side Detailed Matrix Table */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-950/90 text-slate-600 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              <th className="py-3 px-4 sticky left-0 bg-slate-100 dark:bg-slate-950 z-10">Standard Financial Metric</th>
              {reports.map(report => (
                <th
                  key={report.id}
                  className={`py-3 px-4 min-w-[160px] text-right cursor-pointer hover:text-slate-900 dark:hover:text-white transition ${
                    report.id === activeReportId ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20' : ''
                  }`}
                  onClick={() => onSelectReport(report.id)}
                >
                  <div className="font-bold">{report.companyName}</div>
                  <div className="text-[10px] font-normal text-slate-400 dark:text-slate-500">{report.fiscalYear}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
            {coreMetrics.map(m => (
              <tr key={m.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white sticky left-0 bg-white dark:bg-slate-900/90 border-r border-slate-200 dark:border-slate-800/60">
                  {m.label}
                </td>
                {reports.map(report => {
                  const val = getValue(report, m.key);
                  return (
                    <td
                      key={report.id}
                      className={`py-3 px-4 text-right font-mono font-medium ${
                        report.id === activeReportId ? 'bg-blue-50/50 dark:bg-blue-950/10' : ''
                      }`}
                    >
                      {val !== null ? (
                        <span className={val < 0 ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}>
                          ₹{val.toLocaleString()} Cr
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
