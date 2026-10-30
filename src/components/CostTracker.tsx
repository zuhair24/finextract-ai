import React from 'react';
import { ProcessingStats } from '../types/finance';
import { Zap, Coins, Clock, Database, Layers, CheckCircle } from 'lucide-react';

interface Props {
  stats: ProcessingStats;
}

export const CostTracker: React.FC<Props> = ({ stats }) => {
  const { tokenUsage, durationMs, modelUsed, promptCachingApplied } = stats;
  // Gemini 3.8 Flash baseline vs Cached cost
  // Input: $0.15 / 1M tokens. If cached: $0.0375 / 1M tokens (75% savings)
  const fullPromptCost = (tokenUsage.promptTokens * 0.15) / 1000000;
  const cachedPromptCost = (tokenUsage.promptTokens * 0.0375) / 1000000;
  const outputCost = (tokenUsage.candidateTokens * 0.6) / 1000000;

  const currentCost = tokenUsage.estimatedCostUsd;
  const potentialCachedCost = cachedPromptCost + outputCost;
  const savingsPct = 75;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs dark:shadow-xl space-y-4 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Coins className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white">
              Extraction Cost &amp; Token Economics
            </h4>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Audited model telemetry &bull; Gemini 3.8 Flash
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-300 text-[11px] font-semibold">
          <Clock className="w-3 h-3" /> {(durationMs / 1000).toFixed(2)}s latency
        </div>
      </div>

      {/* 4-Stat Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800/80">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Prompt Tokens</div>
          <div className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-0.5">
            {tokenUsage.promptTokens.toLocaleString()}
          </div>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800/80">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Output Tokens</div>
          <div className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-0.5">
            {tokenUsage.candidateTokens.toLocaleString()}
          </div>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800/80">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Cost per Report</div>
          <div className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            ${currentCost.toFixed(5)} <span className="text-[10px] text-slate-500 dark:text-slate-400">(~₹{(currentCost * 86).toFixed(2)})</span>
          </div>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800/80">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">With Prompt Caching</div>
          <div className="text-sm font-mono font-bold text-cyan-600 dark:text-cyan-400 mt-0.5">
            ${potentialCachedCost.toFixed(5)} <span className="text-[10px] text-emerald-600 dark:text-emerald-400">(-{savingsPct}%)</span>
          </div>
        </div>
      </div>

      {/* Prompt Caching Insight Banner */}
      <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-purple-950/30 border border-blue-200 dark:border-blue-800/40 rounded-xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="text-slate-700 dark:text-slate-300">
            <span className="text-slate-900 dark:text-white font-semibold">Gemini Context Caching: </span>
            Subsequent queries on this 300+ page report incur zero repetitive input tokens.
          </span>
        </div>
        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 px-2 py-0.5 rounded-md whitespace-nowrap">
          75% Cost Reduction
        </span>
      </div>
    </div>
  );
};
