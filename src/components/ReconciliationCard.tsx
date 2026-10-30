import React from 'react';
import { ReconciliationStatus } from '../types/finance';
import { CheckCircle2, AlertTriangle, ShieldCheck, Calculator, ArrowRight, Info, AlertOctagon } from 'lucide-react';

interface Props {
  reconciliation: ReconciliationStatus;
  reportingScale: string;
  reportingCurrency: string;
}

export const ReconciliationCard: React.FC<Props> = ({ reconciliation, reportingScale, reportingCurrency }) => {
  const { balanceSheetIdentity, netDebtIdentity, profitabilityMargins, restatementDetection } = reconciliation;

  return (
    <div className="space-y-4">
      {/* Title Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Automated Forensic Reconciliation Engine
          </h3>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Double-Entry Sanity Checks &bull; Pre-Reliance Verification
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Balance Sheet Equation Check */}
        <div
          className={`p-4 rounded-2xl border transition ${
            balanceSheetIdentity.passed
              ? 'bg-white dark:bg-slate-900/90 border-emerald-500/30 shadow-xs dark:shadow-lg dark:shadow-emerald-500/5'
              : 'bg-white dark:bg-slate-900/90 border-amber-500/40 shadow-xs dark:shadow-lg dark:shadow-amber-500/5'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              Balance Sheet Identity
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                balanceSheetIdentity.passed
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
              }`}
            >
              {balanceSheetIdentity.passed ? (
                <>
                  <CheckCircle2 className="w-3 h-3" /> PASSED
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3 h-3" /> DISCREPANCY
                </>
              )}
            </span>
          </div>

          <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/80 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
            Total Assets = Total Liabilities + Equity
          </div>

          <div className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
              <span className="text-slate-500 dark:text-slate-400">Total Assets:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {balanceSheetIdentity.totalAssets?.toLocaleString() ?? 'N/A'} {reportingScale}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
              <span className="text-slate-500 dark:text-slate-400">Liabilities + Equity:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {balanceSheetIdentity.calculatedSum?.toLocaleString() ?? 'N/A'} {reportingScale}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="font-medium text-slate-500 dark:text-slate-400">Difference / Variance:</span>
              <span
                className={`font-mono font-bold ${
                  balanceSheetIdentity.discrepancy === 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {balanceSheetIdentity.discrepancy === 0
                  ? '₹0.00 (Zero Variance)'
                  : `${balanceSheetIdentity.discrepancy.toLocaleString()} ${reportingScale}`}
              </span>
            </div>
          </div>

          <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 leading-normal border-t border-slate-200 dark:border-slate-800/80 pt-2">
            {balanceSheetIdentity.explanation}
          </p>
        </div>

        {/* 2. Net Debt Equation Check */}
        <div
          className={`p-4 rounded-2xl border transition ${
            netDebtIdentity.passed
              ? 'bg-white dark:bg-slate-900/90 border-emerald-500/30 shadow-xs dark:shadow-lg dark:shadow-emerald-500/5'
              : 'bg-white dark:bg-slate-900/90 border-amber-500/40 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-purple-500 dark:text-purple-400" />
              Net Debt Check
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                netDebtIdentity.passed
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
              }`}
            >
              {netDebtIdentity.passed ? (
                <>
                  <CheckCircle2 className="w-3 h-3" /> VERIFIED
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3 h-3" /> CHECK
                </>
              )}
            </span>
          </div>

          <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/80 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
            Net Debt = Gross Debt - Cash &amp; Liquid Inv.
          </div>

          <div className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
              <span className="text-slate-500 dark:text-slate-400">Total Borrowings (Debt):</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {netDebtIdentity.totalDebt?.toLocaleString() ?? 'N/A'} {reportingScale}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
              <span className="text-slate-500 dark:text-slate-400">Cash &amp; Liquid Assets:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                ({netDebtIdentity.cashEquivalents?.toLocaleString() ?? 'N/A'} {reportingScale})
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="font-medium text-slate-500 dark:text-slate-400">Net Debt Position:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {netDebtIdentity.calculatedNetDebt !== null
                  ? `${netDebtIdentity.calculatedNetDebt.toLocaleString()} ${reportingScale}`
                  : 'N/A'}
              </span>
            </div>
          </div>

          <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 leading-normal border-t border-slate-200 dark:border-slate-800/80 pt-2">
            {netDebtIdentity.explanation}
          </p>
        </div>

        {/* 3. Margins & Quality of Earnings */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/90 shadow-xs dark:shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
              <Info className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              Margin Sanity Check
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
              NORMALIZED
            </span>
          </div>

          <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/80 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
            EBITDA % &bull; PAT % &bull; Quality of Revenue
          </div>

          <div className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
              <span className="text-slate-500 dark:text-slate-400">EBITDA Margin:</span>
              <span className="font-mono font-bold text-cyan-600 dark:text-cyan-300">
                {profitabilityMargins.ebitdaMarginPct !== null
                  ? `${profitabilityMargins.ebitdaMarginPct.toFixed(2)}% of Revenue`
                  : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
              <span className="text-slate-500 dark:text-slate-400">Net Profit (PAT) Margin:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {profitabilityMargins.patMarginPct !== null
                  ? `${profitabilityMargins.patMarginPct.toFixed(2)}% of Revenue`
                  : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="font-medium text-slate-500 dark:text-slate-400">Restatements Detected:</span>
              <span
                className={`font-semibold ${
                  restatementDetection.detected ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {restatementDetection.detected
                  ? `${restatementDetection.items.length} Flagged Item(s)`
                  : 'None Detected'}
              </span>
            </div>
          </div>

          <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 leading-normal border-t border-slate-200 dark:border-slate-800/80 pt-2">
            {profitabilityMargins.explanation}
          </p>
        </div>
      </div>

      {/* Restatement Flag Alert if any */}
      {restatementDetection.detected && restatementDetection.items.length > 0 && (
        <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 rounded-2xl flex items-start gap-3">
          <AlertOctagon className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
              Prior Year Restatement / Reclassification Notice
            </h4>
            {restatementDetection.items.map((item, idx) => (
              <p key={idx} className="text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed">
                <span className="font-semibold text-slate-900 dark:text-white">{item.metric}: </span>
                {item.reasonOrNote}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
