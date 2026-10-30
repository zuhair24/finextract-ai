import React, { useState, useRef } from 'react';
import { CompanyReport } from '../types/finance';
import {
  Upload,
  FileUp,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
  ArrowRight,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onExtractionComplete: (report: CompanyReport) => void;
}

export const UploadModal: React.FC<Props> = ({ isOpen, onClose, onExtractionComplete }) => {
  const [mode, setMode] = useState<'pdf' | 'text'>('pdf');
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [companyHint, setCompanyHint] = useState('');
  const [fiscalYearHint, setFiscalYearHint] = useState('FY 2023-24');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.type !== 'application/pdf') {
        setErrorMessage('Please select a valid PDF file.');
        return;
      }
      setFile(selected);
      setErrorMessage(null);
      if (!companyHint) {
        const clean = selected.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
        setCompanyHint(clean);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      if (selected.type !== 'application/pdf') {
        setErrorMessage('Please drop a valid PDF file.');
        return;
      }
      setFile(selected);
      setErrorMessage(null);
      if (!companyHint) {
        const clean = selected.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
        setCompanyHint(clean);
      }
    }
  };

  const handleProcess = async () => {
    if (mode === 'pdf' && !file) {
      setErrorMessage('Please select a PDF annual report file to upload.');
      return;
    }
    if (mode === 'text' && !rawText.trim()) {
      setErrorMessage('Please paste financial statement text.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      let pdfBase64: string | undefined = undefined;

      if (mode === 'pdf' && file) {
        setProgressStep('Reading document binary stream...');
        const reader = new FileReader();
        pdfBase64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      setProgressStep('AI locating Consolidated Balance Sheet and Profit & Loss...');
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64,
          rawText: mode === 'text' ? rawText : undefined,
          fileName: file ? file.name : 'Financial_Report.txt',
          companyHint: companyHint.trim() || undefined,
          targetFiscalYear: fiscalYearHint,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${response.status}`);
      }

      setProgressStep('Extracting figures, page citations & running forensic reconciliation...');
      const data = await response.json();

      if (!data.success || !data.result) {
        throw new Error(data.error || 'Failed to parse extracted financial figures.');
      }

      const report: CompanyReport = {
        ...data.result,
        ticker: companyHint ? companyHint.slice(0, 8).toUpperCase() : 'EXT',
        sourceFileName: file ? file.name : 'Pasted Financial Report Excerpt',
        reportType: 'Audited Annual Financials',
      };

      onExtractionComplete(report);
      onClose();
    } catch (err: any) {
      console.error('Extraction failed:', err);
      let msg = err.message || 'An error occurred during extraction. Check your network or API secret.';
      try {
        const parsed = JSON.parse(msg);
        if (parsed?.error?.message) {
          msg = parsed.error.message;
        }
      } catch {}
      if (msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE')) {
        msg = 'The AI model is currently experiencing a temporary capacity spike. Please click Extract Figures again in a moment.';
      }
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
      setProgressStep('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Extract Annual Report Financials</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload any company's PDF annual report for automated financial figures, page citations &amp; reconciliation
              </p>
            </div>
          </div>
          {!isProcessing && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/30 rounded-xl flex items-start gap-3 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Extraction Error: </span>
                {errorMessage}
              </div>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setMode('pdf')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2 ${
                mode === 'pdf' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FileUp className="w-4 h-4" /> Upload PDF Annual Report
            </button>
            <button
              type="button"
              onClick={() => setMode('text')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2 ${
                mode === 'text' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" /> Paste Financial Excerpt
            </button>
          </div>

          {/* Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Company Name / Ticker (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Reliance / Tata Motors / HDFC Bank"
                value={companyHint}
                onChange={e => setCompanyHint(e.target.value)}
                disabled={isProcessing}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Reporting Fiscal Year
              </label>
              <input
                type="text"
                placeholder="e.g. FY 2023-24"
                value={fiscalYearHint}
                onChange={e => setFiscalYearHint(e.target.value)}
                disabled={isProcessing}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {mode === 'pdf' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Annual Report File (PDF)</label>
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition ${
                  file
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-slate-300 dark:border-slate-700 hover:border-blue-500 bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-950/80'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {file ? (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{file.name}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB &bull; File attached and ready
                    </span>
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 underline mt-2">Click to replace file</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center mb-2">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Drop company annual report PDF here or click to browse
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Supports BSE/NSE filings, 10-K, audited annual accounts (up to 50MB)
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Financial Statement Text / Balance Sheet Excerpt
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500">Quick Test:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCompanyHint('Tata Motors Limited');
                      setFiscalYearHint('FY 2023-24');
                      setRawText(`CONSOLIDATED BALANCE SHEET AS AT MARCH 31, 2024
(₹ in Crore)
ASSETS
Non-Current Assets:
Property, plant and equipment: 1,48,210
Capital work-in-progress: 12,450
Intangible assets: 54,810
Other non-current assets: 25,640
Total Non-Current Assets: 2,41,110

Current Assets:
Inventories: 48,230
Trade receivables: 18,940
Cash and cash equivalents: 44,200
Other bank balances & liquid investments: 23,900
Other current assets: 23,294
Total Current Assets: 1,10,364
TOTAL ASSETS: 3,51,474

EQUITY AND LIABILITIES
Equity:
Equity Share capital: 766
Other Equity: 91,165
Total Equity: 91,931

Non-Current Liabilities:
Borrowings: 56,120
Lease liabilities: 18,240
Provisions & deferred tax: 31,851
Total Non-Current Liabilities: 1,06,211

Current Liabilities:
Short-term Borrowings: 27,963
Trade payables: 88,410
Other current liabilities: 36,959
Total Current Liabilities: 1,53,332
TOTAL LIABILITIES & EQUITY: 3,51,474

CONSOLIDATED STATEMENT OF PROFIT AND LOSS FOR THE YEAR ENDED MARCH 31, 2024
Revenue from operations: 4,37,928
Other Income: 5,120
Total Income: 4,43,048
Raw materials and component consumed: 2,75,410
Employee benefit expense: 41,890
Other expenses: 57,840
EBITDA: 62,788
Finance costs: 10,210
Depreciation and amortisation: 26,400
Profit before tax: 36,178
Tax expense: 4,371
Profit for the year (PAT): 31,807`);
                    }}
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-blue-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-blue-300 border border-slate-300 dark:border-slate-700 transition"
                  >
                    + Auto / Tata Motors
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCompanyHint('TCS Limited');
                      setFiscalYearHint('FY 2023-24');
                      setRawText(`CONSOLIDATED STATEMENT OF PROFIT AND LOSS FOR THE YEAR ENDED MARCH 31, 2024
(₹ in Crore)
Revenue from operations: 2,40,893
Other income: 8,024
Total Income: 2,48,917
Employee expenses: 1,37,840
Other operating expenses: 43,708
Operating Profit (EBIT): 59,345
Finance costs: 779
Depreciation and amortisation: 3,871
Profit before tax: 62,719
Tax expense: 16,620
Profit for the year (PAT): 46,099

BALANCE SHEET AS AT MARCH 31, 2024
Total Assets: 1,47,879
Total Equity: 90,518
Non-Current Liabilities: 12,716
Current Liabilities: 44,645
Total Liabilities: 57,361
Borrowings (Lease obligations): 7,984
Cash and cash equivalents & bank balances: 46,835
Net Cash: (38,851)`);
                    }}
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-blue-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-blue-300 border border-slate-300 dark:border-slate-700 transition"
                  >
                    + IT / TCS
                  </button>
                </div>
              </div>
              <textarea
                rows={8}
                placeholder="Paste the Balance Sheet, Profit & Loss statement, or Cash Flow table text here..."
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                disabled={isProcessing}
                className="w-full p-3.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl font-mono text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Processing Visualizer */}
          {isProcessing && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 rounded-xl space-y-2">
              <div className="flex items-center gap-2.5 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                <span>AI Automated Extraction in Progress</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 pl-6">{progressStep}</p>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                <div className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full w-2/3 animate-pulse" />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Powered by <span className="text-slate-800 dark:text-slate-200 font-semibold">Gemini 3.8 Flash</span> &bull; Fully Automated
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleProcess}
              disabled={isProcessing || (mode === 'pdf' && !file) || (mode === 'text' && !rawText.trim())}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <span>Extract Figures</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
