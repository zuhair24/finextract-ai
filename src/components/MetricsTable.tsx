import React, { useState } from 'react';
import { FinancialMetric } from '../types/finance';
import { Search, Filter, Bookmark, CheckCircle2, ChevronRight, Eye, Edit2, Check, RotateCcw } from 'lucide-react';

interface Props {
  metrics: FinancialMetric[];
  fiscalYear: string;
  previousFiscalYear: string;
  onSelectCitation: (metric: FinancialMetric) => void;
  onUpdateMetricValue?: (metricKey: string, newValue: number | null) => void;
}

export const MetricsTable: React.FC<Props> = ({
  metrics,
  fiscalYear,
  previousFiscalYear,
  onSelectCitation,
  onUpdateMetricValue,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const categories = ['All', 'Income Statement', 'Balance Sheet', 'Cash Flow', 'Per Share & Ratios'];

  const filteredMetrics = metrics.filter(m => {
    const matchesCategory = selectedCategory === 'All' || m.category === selectedCategory;
    const matchesSearch =
      m.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.reportedLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.sourceSection.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(m.sourcePage).includes(searchTerm);
    return matchesCategory && matchesSearch;
  });

  const handleStartEdit = (metric: FinancialMetric) => {
    setEditingKey(metric.key);
    setEditValue(metric.currentYearValue !== null ? String(metric.currentYearValue) : '');
  };

  const handleSaveEdit = (key: string) => {
    if (onUpdateMetricValue) {
      const num = editValue.trim() === '' ? null : Number(editValue);
      onUpdateMetricValue(key, isNaN(num as any) ? null : num);
    }
    setEditingKey(null);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs dark:shadow-xl transition-colors">
      {/* Controls Bar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search metric name, line item, or page #..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/70 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4">Standard Metric</th>
              <th className="py-3 px-4">Filing Reported Label</th>
              <th className="py-3 px-4 text-right">{fiscalYear}</th>
              <th className="py-3 px-4 text-right text-slate-400 dark:text-slate-500">{previousFiscalYear}</th>
              <th className="py-3 px-4 text-center">Source Page</th>
              <th className="py-3 px-4 text-center">Confidence</th>
              <th className="py-3 px-4 text-right">Audit Proof</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs font-normal text-slate-700 dark:text-slate-200">
            {filteredMetrics.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                  No financial metrics match your search criteria.
                </td>
              </tr>
            ) : (
              filteredMetrics.map(metric => (
                <tr
                  key={metric.key}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer"
                  onClick={() => onSelectCitation(metric)}
                >
                  {/* Standard Metric */}
                  <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <span>{metric.label}</span>
                      <span className="text-[10px] font-normal text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-transparent">
                        {metric.category}
                      </span>
                    </div>
                  </td>

                  {/* Reported Label */}
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate" title={metric.reportedLabel}>
                    <span className="italic text-slate-500 dark:text-slate-400">&ldquo;{metric.reportedLabel}&rdquo;</span>
                  </td>

                  {/* Current Year Value */}
                  <td
                    className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400"
                    onClick={e => e.stopPropagation()}
                  >
                    {editingKey === metric.key ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <input
                          type="number"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          className="w-28 px-2 py-0.5 bg-white dark:bg-slate-950 border border-blue-500 rounded text-xs text-right font-mono text-slate-900 dark:text-white focus:outline-none"
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveEdit(metric.key);
                            if (e.key === 'Escape') setEditingKey(null);
                          }}
                        />
                        <button
                          onClick={() => handleSaveEdit(metric.key)}
                          className="p-1 rounded bg-blue-600 text-white hover:bg-blue-500"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2 group/val">
                        <span>
                          {metric.currentYearValue !== null
                            ? `${metric.currentYearValue.toLocaleString()} ${metric.unit}`
                            : '—'}
                        </span>
                        {onUpdateMetricValue && (
                          <button
                            onClick={() => handleStartEdit(metric)}
                            className="opacity-0 group-hover/val:opacity-100 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
                            title="Edit or override number"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Previous Year Value */}
                  <td className="py-3.5 px-4 text-right font-mono text-slate-500 dark:text-slate-400">
                    {metric.previousYearValue !== null
                      ? `${metric.previousYearValue.toLocaleString()} ${metric.unit}`
                      : '—'}
                  </td>

                  {/* Source Page */}
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/25 text-blue-700 dark:text-blue-300 group-hover:border-blue-400 transition">
                      <Bookmark className="w-3 h-3" />
                      Page {metric.sourcePage}
                    </span>
                  </td>

                  {/* Confidence */}
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {metric.confidence}%
                    </span>
                  </td>

                  {/* Audit Proof Button */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onSelectCitation(metric);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:text-white transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Citation</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>
          Showing {filteredMetrics.length} of {metrics.length} extracted figures
        </span>
        <span className="text-slate-400 dark:text-slate-500 hidden sm:inline">
          Click any row to inspect verbatim audit snippet and official page location
        </span>
      </div>
    </div>
  );
};
