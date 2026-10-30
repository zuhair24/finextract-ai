import React from 'react';
import { FinancialMetric } from '../types/finance';
import { X, CheckCircle2, FileText, Bookmark, ExternalLink, Copy, Check } from 'lucide-react';

interface Props {
  metric: FinancialMetric | null;
  companyName: string;
  fiscalYear: string;
  onClose: () => void;
}

export const CitationViewerModal: React.FC<Props> = ({ metric, companyName, fiscalYear, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!metric) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(
      `[${companyName} ${fiscalYear}] ${metric.label}: ${metric.currentYearValue} ${metric.unit} (Page ${metric.sourcePage}, ${metric.sourceSection})\nSnippet: "${metric.verbatimSnippet}"`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Audited Source Citation
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{metric.label}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Key Figures Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Reported Value ({fiscalYear})</div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {metric.currentYearValue !== null
                  ? `${metric.currentYearValue.toLocaleString()} ${metric.unit}`
                  : 'Not Reported'}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Comparative Value</div>
              <div className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                {metric.previousYearValue !== null
                  ? `${metric.previousYearValue.toLocaleString()} ${metric.unit}`
                  : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Extraction Confidence</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{metric.confidence}% AI Match</span>
              </div>
            </div>
          </div>

          {/* Page Location */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <span>Document Location</span>
              <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <Bookmark className="w-3.5 h-3.5" /> Official BSE/NSE Filing
              </span>
            </div>
            <div className="p-3.5 bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-900 dark:text-white">{metric.sourceSection}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Reported Line Item: &ldquo;{metric.reportedLabel}&rdquo;</div>
              </div>
              <div className="px-3 py-1 bg-blue-100 dark:bg-blue-500/15 border border-blue-300 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 font-mono text-sm font-bold rounded-lg whitespace-nowrap">
                Page {metric.sourcePage}
              </div>
            </div>
          </div>

          {/* Verbatim Excerpt */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Verbatim Text / Financial Table Snippet
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-700 dark:text-slate-300 leading-relaxed relative group">
              <p className="border-l-2 border-emerald-500 pl-3 italic text-emerald-900 dark:text-emerald-100/90">
                &ldquo;{metric.verbatimSnippet}&rdquo;
              </p>
              {metric.notes && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 not-italic">
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">Auditor Note: </span>
                  {metric.notes}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {companyName} &bull; {fiscalYear}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Citation'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-500 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
