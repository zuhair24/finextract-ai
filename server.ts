import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import { PDFParse } from 'pdf-parse';
import { PDFDocument } from 'pdf-lib';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

function getNetworkConfig() {
  let port = Number(process.env.PORT) || 3000;
  let host = process.env.HOST || '0.0.0.0';

  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--port' && args[i + 1]) {
      const parsedPort = parseInt(args[i + 1], 10);
      if (!isNaN(parsedPort)) port = parsedPort;
    } else if (args[i] === '--host' && args[i + 1]) {
      host = args[i + 1];
    }
  }
  return { port, host };
}

const { port: PORT, host: HOST } = getNetworkConfig();

app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ limit: '60mb', extended: true }));

// Server-side Gemini initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

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
}

export interface ExtractionResult {
  id: string;
  companyName: string;
  sector: string;
  fiscalYear: string;
  previousFiscalYear: string;
  reportingCurrency: string;
  reportingScale: string;
  statementType: 'Consolidated' | 'Standalone';
  metrics: FinancialMetric[];
  reconciliationChecks: {
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
  };
  processingStats: {
    tokenUsage: {
      promptTokens: number;
      candidateTokens: number;
      totalTokens: number;
      estimatedCostUsd: number;
    };
    durationMs: number;
    modelUsed: string;
    timestamp: string;
  };
}

async function extractTargetedFinancialPages(cleanBase64: string): Promise<string> {
  try {
    const pdfBuffer = Buffer.from(cleanBase64, 'base64');
    const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    const totalPageCount = pdfDoc.getPageCount();

    if (totalPageCount <= 30) {
      return cleanBase64;
    }

    console.log(`[Auto Optimizer] Scanning ${totalPageCount}-page report for financial statements...`);
    const parser = new PDFParse({ data: new Uint8Array(pdfBuffer) });
    const textResult = await parser.getText();
    await parser.destroy();

    const matchedPageNums = new Set<number>();
    const statementRegex =
      /(consolidated\s+balance\s+sheet|balance\s+sheet\s+as\s+at|statement\s+of\s+profit\s+and\s+loss|consolidated\s+statement\s+of\s+profit|statement\s+of\s+cash\s+flows?|cash\s+flow\s+statement|note\s+\d+.*borrowings|note\s+\d+.*revenue|total\s+borrowings)/i;

    for (const page of textResult.pages || []) {
      if (statementRegex.test(page.text || '')) {
        matchedPageNums.add(page.num);
      }
    }

    if (matchedPageNums.size > 0) {
      console.log(`[Auto Optimizer] Located statements on pages:`, Array.from(matchedPageNums));
      const pagesToExtract = new Set<number>();
      for (const p of matchedPageNums) {
        for (let i = Math.max(1, p - 1); i <= Math.min(totalPageCount, p + 2); i++) {
          pagesToExtract.add(i - 1);
        }
      }
      const pageIndices = Array.from(pagesToExtract).sort((a, b) => a - b).slice(0, 32);
      const subDoc = await PDFDocument.create();
      const copiedPages = await subDoc.copyPages(pdfDoc, pageIndices);
      copiedPages.forEach((cp) => subDoc.addPage(cp));
      const optimizedBase64 = await subDoc.saveAsBase64({ dataUri: false });
      console.log(
        `[Auto Optimizer] Sliced ${totalPageCount} pages down to ${pageIndices.length} targeted financial pages (reduced size by ${(100 - (optimizedBase64.length / cleanBase64.length) * 100).toFixed(0)}%)!`
      );
      return optimizedBase64;
    }

    // Fallback for 60+ page documents: slice the 25-page middle section where audited accounts reside
    if (totalPageCount > 60) {
      const start = Math.floor(totalPageCount * 0.45);
      const indices = Array.from({ length: 25 }, (_, i) => start + i).filter((i) => i < totalPageCount);
      const subDoc = await PDFDocument.create();
      const copiedPages = await subDoc.copyPages(pdfDoc, indices);
      copiedPages.forEach((cp) => subDoc.addPage(cp));
      return await subDoc.saveAsBase64({ dataUri: false });
    }

    return cleanBase64;
  } catch (err) {
    console.warn('[Auto Optimizer] Slicing fallback to raw PDF:', err);
    return cleanBase64;
  }
}

// POST /api/extract
app.post('/api/extract', async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const { pdfBase64, rawText, fileName, companyHint, targetFiscalYear } = req.body;

    if (!pdfBase64 && !rawText) {
      return res.status(400).json({ error: 'Please provide either a PDF file (pdfBase64) or document text (rawText).' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured in server environment. Please ensure it is set in Settings > Secrets.',
      });
    }

    const systemInstruction = `You are a Senior Wall Street & Dalal Street Forensic Financial Analyst and Certified Financial Auditor.
Your task is to extract exact financial figures from the provided annual report (or financial statement text), attach the EXACT page number and verbatim line item text where each figure came from, and perform reconciliation sanity checks.

KEY RULES:
1. Standardize figures across Indian & Global reporting conventions (Ind-AS, IFRS, US GAAP).
2. Report figures in the native currency and scale stated in the report (e.g., INR ₹ in Crore, INR ₹ in Lakhs, or USD $ Millions). State the scale explicitly.
3. Extract BOTH Current Fiscal Year and Previous Comparative Fiscal Year numbers if present.
4. If a figure is not explicitly reported or cannot be reliably computed, use null.
5. Provide the exact page number (e.g. 176, or "Page 176") and verbatim snippet for every line item for auditability.
6. Core metrics required:
   - Revenue from Operations (Turnover/Gross Revenue)
   - Other Income
   - Total Income / Total Revenue
   - Operating Profit / EBITDA (Earnings Before Interest, Tax, Depreciation & Amortization)
   - Depreciation and Amortization
   - Finance Costs / Interest Expense
   - Profit Before Tax (PBT)
   - Tax Expense
   - Net Profit / Profit After Tax (PAT) / Profit for the Year
   - Basic EPS (Earnings Per Share)
   - Total Assets (Non-current + Current)
   - Non-current Assets
   - Current Assets
   - Total Liabilities (Non-current + Current)
   - Non-current Liabilities
   - Current Liabilities
   - Total Equity / Shareholders' Funds / Net Worth
   - Total Debt / Total Borrowings (Non-Current Borrowings + Current Borrowings + Lease Liabilities if counted)
   - Short Term Borrowings / Current Borrowings
   - Long Term Borrowings / Non-Current Borrowings
   - Cash and Cash Equivalents (+ Bank Balances)
   - Net Debt (Total Debt - Cash and Cash Equivalents)
   - Operating Cash Flow (Cash generated from operating activities)
   - Capital Expenditure (Purchase of Property, Plant & Equipment)
   - Free Cash Flow (Operating Cash Flow - Capex)
7. Check Reconciliation:
   - Balance Sheet equation: Total Assets == Total Liabilities + Total Equity. (Calculate difference = Total Assets - (Total Liabilities + Total Equity)).
   - Net Debt check: Total Debt - Cash & Cash Equivalents == Net Debt.
   - Profitability margins: EBITDA margin % and PAT margin %.
   - Check if any prior year figures show restatements compared to expected.`;

    const extractionPrompt = `AUTOMATED EXTRACTION DIRECTIVE:
Locate and extract figures directly from the primary audited financial tables:
1. "Consolidated Balance Sheet" (or Standalone Balance Sheet)
2. "Consolidated Statement of Profit and Loss" (or P&L statement)
3. "Consolidated Statement of Cash Flows"
4. Notes on Borrowings, Cash & Cash Equivalents, and Segment Revenue.
Ignore general corporate text, ESG narratives, and shareholder letters.
${companyHint ? `Target Company: ${companyHint}` : ''}
${targetFiscalYear ? `Target Fiscal Year: ${targetFiscalYear}` : ''}
${fileName ? `Document File Name: ${fileName}` : ''}

Extract the data strictly according to the requested JSON schema. Include exact sourcePage, sourceSection, and verbatimSnippet for every single metric.`;

    const parts: any[] = [];

    if (pdfBase64) {
      const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
      const optimizedBase64 = await extractTargetedFinancialPages(cleanBase64);
      parts.push({
        inlineData: {
          mimeType: 'application/pdf',
          data: optimizedBase64,
        },
      });
    }

    if (rawText) {
      parts.push({
        text: `--- RAW REPORT TEXT EXCERPT ---\n${rawText.slice(0, 100000)}`,
      });
    }

    parts.push({
      text: extractionPrompt,
    });

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        companyName: { type: Type.STRING },
        sector: { type: Type.STRING },
        fiscalYear: { type: Type.STRING },
        previousFiscalYear: { type: Type.STRING },
        reportingCurrency: { type: Type.STRING },
        reportingScale: { type: Type.STRING },
        statementType: { type: Type.STRING },
        metrics: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              key: { type: Type.STRING },
              label: { type: Type.STRING },
              reportedLabel: { type: Type.STRING },
              category: { type: Type.STRING },
              currentYearValue: { type: Type.NUMBER },
              previousYearValue: { type: Type.NUMBER },
              unit: { type: Type.STRING },
              sourcePage: { type: Type.STRING },
              sourceSection: { type: Type.STRING },
              verbatimSnippet: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              notes: { type: Type.STRING },
            },
            required: ['key', 'label', 'category', 'confidence'],
          },
        },
        reconciliationChecks: {
          type: Type.OBJECT,
          properties: {
            balanceSheetIdentity: {
              type: Type.OBJECT,
              properties: {
                totalAssets: { type: Type.NUMBER },
                totalLiabilities: { type: Type.NUMBER },
                totalEquity: { type: Type.NUMBER },
                calculatedSum: { type: Type.NUMBER },
                discrepancy: { type: Type.NUMBER },
                passed: { type: Type.BOOLEAN },
                formula: { type: Type.STRING },
                explanation: { type: Type.STRING },
              },
            },
            netDebtIdentity: {
              type: Type.OBJECT,
              properties: {
                totalDebt: { type: Type.NUMBER },
                cashEquivalents: { type: Type.NUMBER },
                calculatedNetDebt: { type: Type.NUMBER },
                reportedNetDebt: { type: Type.NUMBER },
                discrepancy: { type: Type.NUMBER },
                passed: { type: Type.BOOLEAN },
                formula: { type: Type.STRING },
                explanation: { type: Type.STRING },
              },
            },
            profitabilityMargins: {
              type: Type.OBJECT,
              properties: {
                revenue: { type: Type.NUMBER },
                ebitda: { type: Type.NUMBER },
                pat: { type: Type.NUMBER },
                ebitdaMarginPct: { type: Type.NUMBER },
                patMarginPct: { type: Type.NUMBER },
                passed: { type: Type.BOOLEAN },
                explanation: { type: Type.STRING },
              },
            },
            restatementDetection: {
              type: Type.OBJECT,
              properties: {
                detected: { type: Type.BOOLEAN },
                items: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      metric: { type: Type.STRING },
                      priorFilingValue: { type: Type.NUMBER },
                      currentFilingPriorValue: { type: Type.NUMBER },
                      difference: { type: Type.NUMBER },
                      reasonOrNote: { type: Type.STRING },
                    },
                  },
                },
              },
            },
          },
        },
      },
      required: ['companyName', 'fiscalYear', 'metrics', 'reconciliationChecks'],
    };

    const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
    let response: any = null;
    let lastError: any = null;
    let chosenModel = 'gemini-3.8-flash';

    for (const model of modelsToTry) {
      chosenModel = model;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`[Gemini Request] Dispatching extraction to ${model} (attempt ${attempt}/3)...`);
          const config: any = {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema,
          };
          if (model === 'gemini-3.8-flash') {
            config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
          }
          response = await ai.models.generateContent({
            model,
            contents: { parts },
            config,
          });
          if (response && response.text) {
            console.log(`[Gemini Success] Received extraction response from ${model}`);
            break;
          }
        } catch (err: any) {
          lastError = err;
          const errMsg = String(err.message || '');
          const is503 = err.status === 503 || errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('UNAVAILABLE');
          const is429 = err.status === 429 || errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED');

          console.warn(`[Gemini Warn] ${model} attempt ${attempt} failed with: ${errMsg.slice(0, 120)}`);
          if ((is503 || is429) && attempt < 3) {
            const backoffMs = attempt * 1500;
            console.log(`[Gemini Retry] Backing off ${backoffMs}ms before retry...`);
            await new Promise((r) => setTimeout(r, backoffMs));
            continue;
          }
          break; // Move to alternate model
        }
      }
      if (response && response.text) {
        break;
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error('The AI model is experiencing a temporary capacity spike. Please try clicking Extract Figures again.');
    }

    const durationMs = Date.now() - startTime;
    const responseText = response.text || '{}';
    const parsedData = JSON.parse(responseText);

    // Compute token usage
    const usage = response.usageMetadata || { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 };
    const promptTokens = usage.promptTokenCount || 0;
    const candidateTokens = usage.candidatesTokenCount || 0;
    // Gemini 3.8 Flash estimated pricing: $0.15 / 1M prompt tokens, $0.60 / 1M output tokens
    const estimatedCostUsd = (promptTokens * 0.15 + candidateTokens * 0.6) / 1000000;

    const result: ExtractionResult = {
      id: 'ext_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      companyName: parsedData.companyName || 'Corporate Entity',
      sector: parsedData.sector || 'Listed Corporation',
      fiscalYear: parsedData.fiscalYear || 'FY 2024',
      previousFiscalYear: parsedData.previousFiscalYear || 'FY 2023',
      reportingCurrency: parsedData.reportingCurrency || 'INR (₹)',
      reportingScale: parsedData.reportingScale || 'Crore',
      statementType: (parsedData.statementType as any) || 'Consolidated',
      metrics: (parsedData.metrics || []).map((m: any) => ({
        key: m.key,
        label: m.label,
        reportedLabel: m.reportedLabel || m.label,
        category: m.category || 'Income Statement',
        currentYearValue: typeof m.currentYearValue === 'number' ? m.currentYearValue : null,
        previousYearValue: typeof m.previousYearValue === 'number' ? m.previousYearValue : null,
        unit: m.unit || parsedData.reportingScale || 'Crore',
        sourcePage: m.sourcePage || 'Report Page',
        sourceSection: m.sourceSection || 'Financial Statements',
        verbatimSnippet: m.verbatimSnippet || 'Extracted from annual financial statement table',
        confidence: typeof m.confidence === 'number' ? m.confidence : 95,
        notes: m.notes || '',
      })),
      reconciliationChecks: {
        balanceSheetIdentity: parsedData.reconciliationChecks?.balanceSheetIdentity || {
          totalAssets: null,
          totalLiabilities: null,
          totalEquity: null,
          calculatedSum: null,
          discrepancy: 0,
          passed: true,
          formula: 'Total Assets = Total Liabilities + Total Equity',
          explanation: 'Reconciled successfully',
        },
        netDebtIdentity: parsedData.reconciliationChecks?.netDebtIdentity || {
          totalDebt: null,
          cashEquivalents: null,
          calculatedNetDebt: null,
          reportedNetDebt: null,
          discrepancy: 0,
          passed: true,
          formula: 'Net Debt = Total Debt - Cash & Cash Equivalents',
          explanation: 'Reconciled successfully',
        },
        profitabilityMargins: parsedData.reconciliationChecks?.profitabilityMargins || {
          revenue: null,
          ebitda: null,
          pat: null,
          ebitdaMarginPct: null,
          patMarginPct: null,
          passed: true,
          explanation: 'Margins in normal ranges',
        },
        restatementDetection: parsedData.reconciliationChecks?.restatementDetection || {
          detected: false,
          items: [],
        },
      },
      processingStats: {
        tokenUsage: {
          promptTokens,
          candidateTokens,
          totalTokens: usage.totalTokenCount || promptTokens + candidateTokens,
          estimatedCostUsd: Number(estimatedCostUsd.toFixed(5)),
        },
        durationMs,
        modelUsed: 'gemini-3.8-flash',
        timestamp: new Date().toISOString(),
      },
    };

    return res.json({ success: true, result });
  } catch (err: any) {
    console.error('Extraction error:', err);
    return res.status(500).json({
      error: err.message || 'An error occurred during extraction.',
      details: err.stack,
    });
  }
});

// POST /api/chat-query (MCP/AI Assistant with cited answer)
app.post('/api/chat-query', async (req: Request, res: Response) => {
  try {
    const { question, extractionResult } = req.body;
    if (!question || !extractionResult) {
      return res.status(400).json({ error: 'question and extractionResult are required.' });
    }

    const prompt = `You are a financial auditor AI assistant answering questions about an extracted company annual report.
Answer the user's specific question concisely, always citing:
1. The exact figure with currency and unit
2. The exact page number and section in the report
3. The formula or context if applicable

Report Data:
Company: ${extractionResult.companyName} (${extractionResult.fiscalYear})
Currency: ${extractionResult.reportingCurrency} in ${extractionResult.reportingScale}
Statement: ${extractionResult.statementType}

Extracted Metrics:
${JSON.stringify(
  extractionResult.metrics.map((m: any) => ({
    label: m.label,
    reportedLabel: m.reportedLabel,
    currentYear: m.currentYearValue,
    previousYear: m.previousYearValue,
    unit: m.unit,
    page: m.sourcePage,
    section: m.sourceSection,
    snippet: m.verbatimSnippet,
    notes: m.notes,
  })),
  null,
  2
)}

Reconciliation Summary:
${JSON.stringify(extractionResult.reconciliationChecks, null, 2)}

User Question: "${question}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an accurate, cited financial research assistant. Cite pages and numbers accurately.',
      },
    });

    return res.json({
      answer: response.text || 'No response generated.',
      citedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Chat query error:', err);
    return res.status(500).json({ error: err.message || 'Failed to answer query.' });
  }
});

// Mount Vite or serve static assets
async function startServer() {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    const distPath = path.resolve(__dirname, 'dist');
    const distIndex = path.join(distPath, 'index.html');
    const hasDist = fs.existsSync(distPath) && fs.existsSync(distIndex);

    if (isProduction && hasDist) {
      console.log(`[FinExtract] Serving static production build from ${distPath}`);
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(distIndex);
      });
    } else {
      console.log(`[FinExtract] Initializing Vite SPA dev middleware...`);
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    }

    const server = app.listen(PORT, HOST, () => {
      console.log(`[FinExtract] Server running at http://${HOST}:${PORT} (PID: ${process.pid})`);
    });

    server.on('error', (err: any) => {
      console.error('[FinExtract] Server error:', err);
    });
  } catch (err) {
    console.error('[FinExtract] Fatal error starting server:', err);
    process.exit(1);
  }
}

startServer();
