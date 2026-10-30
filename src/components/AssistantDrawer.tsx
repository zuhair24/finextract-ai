import React, { useState } from 'react';
import { CompanyReport } from '../types/finance';
import { MessageSquare, Send, Sparkles, Bot, User, Bookmark, Loader2, ArrowRight } from 'lucide-react';

interface Props {
  report: CompanyReport;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const AssistantDrawer: React.FC<Props> = ({ report }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello! I am your AI Financial Auditor for ${report.companyName} (${report.fiscalYear}). You can ask me any question about the extracted numbers, notes, borrowings, cash flows, or exact page citations.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const predefinedPrompts = [
    `What was ${report.companyName}'s net debt in ${report.fiscalYear} and what page is it on?`,
    `Did the balance sheet reconcile (Assets = Liabilities + Equity)?`,
    `What was the operating cash flow and free cash flow?`,
    `What are the reported borrowings and cash balances?`,
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: textToSend.trim(),
          extractionResult: report,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to get answer');
      }

      const botMsg: Message = {
        id: 'bot_' + Date.now(),
        sender: 'assistant',
        text: data.answer || 'No answer generated.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: 'bot_err_' + Date.now(),
          sender: 'assistant',
          text: `Error retrieving cited response: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs dark:shadow-xl flex flex-col h-[650px] transition-colors">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">AI Financial Auditor &bull; Cited Query Assistant</h3>
              <span className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 px-2 py-0.5 rounded-full font-mono border border-purple-200 dark:border-purple-500/30">
                MCP Q&amp;A
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Querying {report.companyName} ({report.fiscalYear}) with audited page references
            </p>
          </div>
        </div>
      </div>

      {/* Suggested Prompts */}
      <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800/80 overflow-x-auto flex items-center gap-2">
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-purple-500 dark:text-purple-400" /> Suggested:
        </span>
        {predefinedPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p)}
            disabled={isLoading}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-purple-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 whitespace-nowrap transition border border-slate-200 dark:border-slate-700/60 shadow-2xs"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Message History */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map(m => (
          <div
            key={m.id}
            className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                m.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30'
              }`}
            >
              {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none whitespace-pre-line'
              }`}
            >
              {m.text}
              <div
                className={`text-[10px] mt-1.5 ${
                  m.sender === 'user' ? 'text-blue-200 text-right' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {m.timestamp}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30 flex items-center justify-center text-xs shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600 dark:text-purple-400" />
              <span>Checking document notes, tables, and page citations...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder={`Ask a question about ${report.companyName} (e.g. What was the net debt in FY24?)...`}
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-purple-600/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
