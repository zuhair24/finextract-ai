export interface FinancialMetric {
  key: string;
  label: string;
  reportedLabel: string;
  category: 'Income Statement' | 'Balance Sheet' | 'Cash Flow' | 'Per Share & Ratios';
  currentYearValue: number | null;
  previousYearValue: number | null;
  unit: string;
  sourcePage: number | string;
  sourceSection: string;
  verbatimSnippet: string;
  confidence: number;
  notes?: string;
  manualOverride?: number | null;
}

export interface ReconciliationStatus {
  balanceSheetIdentity: {
    totalAssets: number | null;
    totalLiabilities: number | null;
    totalEquity: number | null;
    calculatedSum: number | null;
    discrepancy: number;
    passed: boolean;
    formula: string;
    explanation: string;
  };
  netDebtIdentity: {
    totalDebt: number | null;
    cashEquivalents: number | null;
    calculatedNetDebt: number | null;
    reportedNetDebt: number | null;
    discrepancy: number;
    passed: boolean;
    formula: string;
    explanation: string;
  };
  profitabilityMargins: {
    revenue: number | null;
    ebitda: number | null;
    pat: number | null;
    ebitdaMarginPct: number | null;
    patMarginPct: number | null;
    passed: boolean;
    explanation: string;
  };
  restatementDetection: {
    detected: boolean;
    items: Array<{
      metric: string;
      priorFilingValue: number | null;
      currentFilingPriorValue: number | null;
      difference: number;
      reasonOrNote: string;
    }>;
  };
}

export interface ProcessingStats {
  tokenUsage: {
    promptTokens: number;
    candidateTokens: number;
    totalTokens: number;
    estimatedCostUsd: number;
  };
  durationMs: number;
  modelUsed: string;
  timestamp: string;
  promptCachingApplied?: boolean;
}

export interface CompanyReport {
  id: string;
  companyName: string;
  ticker?: string;
  sector: string;
  fiscalYear: string;
  previousFiscalYear: string;
  reportingCurrency: string;
  reportingScale: string;
  statementType: 'Consolidated' | 'Standalone';
  reportType?: string;
  sourceFileName?: string;
  metrics: FinancialMetric[];
  reconciliationChecks: ReconciliationStatus;
  processingStats: ProcessingStats;
}
