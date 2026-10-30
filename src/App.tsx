import React, { useState } from 'react';
import { SAMPLE_COMPANIES } from './data/sampleReports';
import { CompanyReport, FinancialMetric } from './types/finance';
import { MetricsTable } from './components/MetricsTable';
import { ReconciliationCard } from './components/ReconciliationCard';
import { ComparablesMatrix } from './components/ComparablesMatrix';
import { AssistantDrawer } from './components/AssistantDrawer';
import { CostTracker } from './components/CostTracker';
import { UploadModal } from './components/UploadModal';
import { CitationViewerModal } from './components/CitationViewerModal';
import { exportReportToExcel } from './utils/excelExport';
import { useTheme } from './context/ThemeContext';
import {
  FileText,
  Upload,
  Download,
  ShieldCheck,
  BarChart3,
  Bot,
  Coins,
  Building2,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Wallet,
  DollarSign,
  Scale,
  Sun,
  Moon,
} from 'lucide-react';

export default function App() {
  const { isDark, toggleTheme } = useTheme();
  const [reports, setReports] = useState<CompanyReport[]>(SAMPLE_COMPANIES);
  const [activeReportId, setActiveReportId] = useState<string>(SAMPLE_COMPANIES[0].id);
  const [activeTab, setActiveTab] = useState<'metrics' | 'reconciliation' | 'comparables' | 'chat' | 'cost'>('metrics');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedCitationMetric, setSelectedCitationMetric] = useState<FinancialMetric | null>(null);

  const activeReport = reports.find(r => r.id === activeReportId) || reports[0];

  const handleExtractionComplete = (newReport: CompanyReport) => {
    setReports(prev => [newReport, ...prev]);
    setActiveReportId(newReport.id);
    setActiveTab('metrics');
  };

  const handleUpdateMetricValue = (metricKey: string, newValue: number | null) => {
    setReports(prev =>
      prev.map(r => {
        if (r.id !== activeReport.id) return r;
        const updatedMetrics = r.metrics.map(m => (m.key === metricKey ? { ...m, currentYearValue: newValue } : m));

        const getV = (k: string) => updatedMetrics.find(m => m.key === k)?.currentYearValue ?? null;
        const assets = getV('total_assets');
        const liabilities = getV('total_liabilities');
        const equity = getV('total_equity');
        const totalDebt = getV('total_debt');
        const cash = getV('cash_and_equivalents');

        let bsDiscrepancy = 0;
        let bsPassed = true;
        let calculatedSum = null;
        if (assets !== null && liabilities !== null && equity !== null) {
          calculatedSum = liabilities + equity;
          bsDiscrepancy = Math.abs(assets - calculatedSum);
          bsPassed = bsDiscrepancy === 0;
        }

        let netDebtCalc = null;
        if (totalDebt !== null && cash !== null) {
          netDebtCalc = totalDebt - cash;
        }

        return {
          ...r,
          metrics: updatedMetrics,
          reconciliationChecks: {
            ...r.reconciliationChecks,
            balanceSheetIdentity: {
              ...r.reconciliationChecks.balanceSheetIdentity,
              totalAssets: assets,
              totalLiabilities: liabilities,
              totalEquity: equity,
              calculatedSum,
              discrepancy: bsDiscrepancy,
              passed: bsPassed,
            },
            netDebtIdentity: {
              ...r.reconciliationChecks.netDebtIdentity,
              totalDebt,
              cashEquivalents: cash,
              calculatedNetDebt: netDebtCalc,
            },
          },
        };
      })
    );
  };

  const getMetricValue = (key: string) => {
    const m = activeReport.metrics.find(metric => metric.key === key);
    return m ? m.currentYearValue : null;
  };

  const revenue = getMetricValue('revenue');
  const ebitda = getMetricValue('ebitda');
  const pat = getMetricValue('pat');
  const totalAssets = getMetricValue('total_assets');
  const totalDebt = getMetricValue('total_debt');

  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-200 selection:bg-blue-600 selection:text-white ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* Top Navbar */}
      <header
        className={`border-b sticky top-0 z-40 backdrop-blur-md transition-colors ${
          isDark
            ? 'border-slate-800 bg-slate-900/90 text-white'
            : 'border-slate-200 bg-white/95 text-slate-900 shadow-xs'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Project Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-tight">FinExtract</h1>
                <span className="text-[10px] font-semibold bg-blue-500/15 text-blue-500 dark:text-blue-400 border border-blue-500/25 px-2 py-0.5 rounded-full">
                  Annual Report Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Extraction &bull; Exact Page Citations &bull; Forensic Balance Sheet Reconciliation
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            {/* Theme Toggle Button (Light / Dark mode) */}
            <button
              onClick={toggleTheme}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
              <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            <button
              onClick={() => exportReportToExcel(activeReport)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                isDark
                  ? 'bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 border-emerald-500/30'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300'
              }`}
            >
              <Download className="w-4 h-4 text-emerald-500" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition"
            >
              <Upload className="w-4 h-4" />
              <span>Upload PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Company Selector & Scope Bar */}
        <div
          className={`border rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
            isDark
              ? 'bg-slate-900/80 border-slate-800'
              : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Active Annual Report Analysis
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* Dropdown Selector */}
              <div className="relative">
                <select
                  value={activeReportId}
                  onChange={e => setActiveReportId(e.target.value)}
                  className={`appearance-none border font-bold text-sm sm:text-base py-1.5 pl-3 pr-8 rounded-xl focus:outline-none focus:border-blue-500 cursor-pointer transition ${
                    isDark
                      ? 'bg-slate-950 border-slate-700/80 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  {reports.map(r => (
                    <option key={r.id} value={r.id} className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                      {r.companyName} ({r.fiscalYear})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              <span className={`text-xs px-2.5 py-1 rounded-lg ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                Sector: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{activeReport.sector}</strong>
              </span>

              <span className={`text-xs px-2.5 py-1 rounded-lg ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                Reporting: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{activeReport.reportingCurrency} in {activeReport.reportingScale}</strong>
              </span>

              <span className={`text-xs px-2.5 py-1 rounded-lg ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                Type: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{activeReport.statementType}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right hidden lg:block">
              <div className="text-xs font-semibold">
                {activeReport.reconciliationChecks.balanceSheetIdentity.passed ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 justify-end">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Reconciled &bull; 0 Discrepancy
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 justify-end">
                    <AlertTriangle className="w-3.5 h-3.5" /> Discrepancy Flagged
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Source: {activeReport.sourceFileName || 'BSE/NSE Annual Filing'}
              </div>
            </div>
          </div>
        </div>

        {/* 5-Metric Quick Executive KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* Revenue */}
          <div
            className={`p-4 border rounded-2xl transition hover:shadow-md ${
              isDark
                ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
              <span className="font-semibold">Revenue</span>
              <DollarSign className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            </div>
            <div className={`text-lg font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {revenue !== null ? `₹${revenue.toLocaleString()} Cr` : 'N/A'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Total Topline ({activeReport.reportingScale})
            </div>
          </div>

          {/* Operating Profit */}
          <div
            className={`p-4 border rounded-2xl transition hover:shadow-md ${
              isDark
                ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
              <span className="font-semibold">EBITDA</span>
              <TrendingUp className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="text-lg font-bold font-mono text-cyan-600 dark:text-cyan-300">
              {ebitda !== null ? `₹${ebitda.toLocaleString()} Cr` : 'N/A'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {activeReport.reconciliationChecks.profitabilityMargins.ebitdaMarginPct !== null
                ? `${activeReport.reconciliationChecks.profitabilityMargins.ebitdaMarginPct.toFixed(1)}% of Revenue`
                : '—'}
            </div>
          </div>

          {/* PAT */}
          <div
            className={`p-4 border rounded-2xl transition hover:shadow-md ${
              isDark
                ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
              <span className="font-semibold">Net Profit (PAT)</span>
              <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {pat !== null ? `₹${pat.toLocaleString()} Cr` : 'N/A'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {activeReport.reconciliationChecks.profitabilityMargins.patMarginPct !== null
                ? `${activeReport.reconciliationChecks.profitabilityMargins.patMarginPct.toFixed(1)}% of Revenue`
                : '—'}
            </div>
          </div>

          {/* Total Assets */}
          <div
            className={`p-4 border rounded-2xl transition hover:shadow-md ${
              isDark
                ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
              <span className="font-semibold">Total Assets</span>
              <Building2 className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            </div>
            <div className={`text-lg font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {totalAssets !== null ? `₹${totalAssets.toLocaleString()} Cr` : 'N/A'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Identity: {activeReport.reconciliationChecks.balanceSheetIdentity.passed ? 'Balanced' : 'Flag'}
            </div>
          </div>

          {/* Total Debt / Net Debt */}
          <div
            className={`p-4 border rounded-2xl transition hover:shadow-md ${
              isDark
                ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
              <span className="font-semibold">Net Debt</span>
              <BarChart3 className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            </div>
            <div className="text-lg font-bold font-mono text-amber-600 dark:text-amber-300">
              {activeReport.reconciliationChecks.netDebtIdentity.calculatedNetDebt !== null
                ? `₹${activeReport.reconciliationChecks.netDebtIdentity.calculatedNetDebt.toLocaleString()} Cr`
                : 'N/A'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Gross Debt: ₹{totalDebt?.toLocaleString() ?? 0} Cr
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`border-b flex items-center gap-2 overflow-x-auto ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'metrics'
                ? 'border-blue-600 text-blue-600 dark:text-white dark:border-blue-500'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Financial Statements &amp; Citations</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>
              {activeReport.metrics.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('reconciliation')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'reconciliation'
                ? 'border-blue-600 text-blue-600 dark:text-white dark:border-blue-500'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Forensic Reconciliation Checks</span>
            <span className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-full font-mono">
              Identity Verified
            </span>
          </button>

          <button
            onClick={() => setActiveTab('comparables')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'comparables'
                ? 'border-blue-600 text-blue-600 dark:text-white dark:border-blue-500'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-blue-500" />
            <span>10-Company Comparables</span>
            <span className="text-[10px] bg-blue-500/15 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full font-mono">
              Side-by-Side
            </span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'chat'
                ? 'border-purple-600 text-purple-600 dark:text-white dark:border-purple-500'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Bot className="w-4 h-4 text-purple-500" />
            <span>MCP Cited Assistant</span>
          </button>

          <button
            onClick={() => setActiveTab('cost')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'cost'
                ? 'border-blue-600 text-blue-600 dark:text-white dark:border-blue-500'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Coins className="w-4 h-4 text-emerald-500" />
            <span>Cost &amp; Token Tracking</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'metrics' && (
            <div className="space-y-6">
              <MetricsTable
                metrics={activeReport.metrics}
                fiscalYear={activeReport.fiscalYear}
                previousFiscalYear={activeReport.previousFiscalYear}
                onSelectCitation={metric => setSelectedCitationMetric(metric)}
                onUpdateMetricValue={handleUpdateMetricValue}
              />
            </div>
          )}

          {activeTab === 'reconciliation' && (
            <div className="space-y-6">
              <ReconciliationCard
                reconciliation={activeReport.reconciliationChecks}
                reportingScale={activeReport.reportingScale}
                reportingCurrency={activeReport.reportingCurrency}
              />
            </div>
          )}

          {activeTab === 'comparables' && (
            <ComparablesMatrix
              reports={reports}
              activeReportId={activeReportId}
              onSelectReport={id => {
                setActiveReportId(id);
                setActiveTab('metrics');
              }}
            />
          )}

          {activeTab === 'chat' && <AssistantDrawer report={activeReport} />}

          {activeTab === 'cost' && <CostTracker stats={activeReport.processingStats} />}
        </div>
      </main>

      {/* PDF Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onExtractionComplete={handleExtractionComplete}
      />

      {/* Audited Citation Popover */}
      {selectedCitationMetric && (
        <CitationViewerModal
          metric={selectedCitationMetric}
          companyName={activeReport.companyName}
          fiscalYear={activeReport.fiscalYear}
          onClose={() => setSelectedCitationMetric(null)}
        />
      )}
    </div>
  );
}
