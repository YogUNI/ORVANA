import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Bot,
} from 'lucide-react';
import { queryOrvanaKnowledge, CopilotResponse } from './orvanaKnowledgeEngine';
import { apiClient } from '../../lib/apiClient';

/**
 * Format markdown sederhana (**bold**, *italic*, list bullet, dll)
 * agar teks dari Gemini/AI tampil rapi dan bold tanpa mentah '**'.
 */
function renderFormattedMarkdown(text: string) {
  // Pisahkan baris per baris
  const lines = text.split('\n');

  return lines.map((line, lineIdx) => {
    // Cek apakah list item (- atau *)
    const isBullet = /^\s*[-*]\s+(.*)$/.test(line);
    const content = isBullet ? line.replace(/^\s*[-*]\s+/, '') : line;

    // Tokenisasi regex untuk **bold** dan teks biasa
    const parts = content.split(/(\*\*[^*]+\*\*)/g);

    const renderedLine = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2);
        return (
          <strong key={pIdx} className="font-bold text-stone-900">
            {boldText}
          </strong>
        );
      }
      return part;
    });

    if (isBullet) {
      return (
        <span key={lineIdx} className="flex items-start gap-1.5 my-1">
          <span className="text-emerald-700 font-bold shrink-0">•</span>
          <span className="flex-1">{renderedLine}</span>
        </span>
      );
    }

    return (
      <span key={lineIdx} className="block min-h-[1.1em]">
        {renderedLine}
      </span>
    );
  });
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  category?: string;
  actionLink?: string;
  suggestedFollowUps?: string[];
  timestamp: string;
}

export const SmartFloatingConcierge: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const initialBotMessage: ChatMessage = {
    id: 'msg-init-1',
    sender: 'bot',
    text: 'Halo! Saya Asisten AI Resmi ORVANA. Seluruh jawaban saya bersumber langsung dari basis data regulasi rantai pasok pangan massal, aturan kuota 60%, audit kas, dan pengawasan gizi. Ada yang ingin Anda tanyakan?',
    category: 'PUSAT PENGETAHUAN RESMI',
    suggestedFollowUps: [
      'Apa itu aturan kuota 60%?',
      'Bagaimana petani menerima pembayaran?',
      'Bagaimana cara cek paspor QR makanan?',
    ],
    timestamp: 'Baru saja',
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialBotMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputQuery).trim();
    if (!text) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setIsTyping(true);

    try {
      // Siapkan history untuk multi-turn chat Gemini
      const recentHistory = messages.slice(-4).map((m) => ({
        role: (m.sender === 'bot' ? 'model' : 'user') as 'model' | 'user',
        text: m.text,
      }));

      const res: any = await apiClient.post('/public/chatbot/query', {
        message: text,
        history: recentHistory,
      });

      const data = res?.data || res;
      if (data && data.answer) {
        const botReply: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: data.answer,
          category: data.category || 'ORVANA AI ASSISTANT',
          actionLink: data.actionLink,
          suggestedFollowUps: data.suggestedFollowUps,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botReply]);
        setIsTyping(false);
        return;
      }
    } catch {
      // Fallback ke local engine jika backend mati / offline
    }

    // Local Fallback
    setTimeout(() => {
      const result: CopilotResponse = queryOrvanaKnowledge(text);
      const botReply: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: result.answer,
        category: result.category,
        actionLink: result.actionLink,
        suggestedFollowUps: result.suggestedFollowUps,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botReply]);
      setIsTyping(false);
    }, 350);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const resetChat = () => {
    setMessages([initialBotMessage]);
  };

  return (
    <>
      {/* BACKDROP BLUR OVERLAY (Hanya di layar mobile atau saat drawer terbuka) */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-50 bg-stone-950/20 backdrop-blur-xs transition-opacity duration-300 pointer-events-auto sm:bg-stone-950/10"
          aria-hidden="true"
        />
      )}

      {/* BESPOKE ARTISAN AGRITECH COPILOT DRAWER */}
      <aside
        aria-label="Terminal Asisten AI Resmi ORVANA"
        className={`fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[460px] md:w-[480px] h-screen bg-[#FAF8F5] shadow-[-10px_0_40px_rgba(19,42,33,0.15)] border-l border-emerald-950/10 flex flex-col font-sans text-stone-900 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Top Header: Dark Artisan Emerald with warm ambient glow */}
        <div className="relative px-5 py-4 bg-[#11231B] text-white flex items-center justify-between border-b border-emerald-800/40 shrink-0 overflow-hidden shadow-xs">
          {/* Subtle noise / ambient warm accent behind header */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-300 to-emerald-400 text-emerald-950 flex items-center justify-center font-bold text-lg shadow-md shadow-amber-400/20 shrink-0 ring-2 ring-white/10">
              🌾
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-extrabold font-serif tracking-tight text-amber-50">
                  ORVANA Intelligence
                </h4>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  v2.5 RAG
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-200/80 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ring-4 ring-emerald-400/20" />
                <span>Siap melayani seputar ekosistem pangan</span>
              </div>
            </div>
          </div>

          <div className="relative flex items-center gap-1.5">
            <button
              type="button"
              onClick={resetChat}
              title="Mulai sesi baru"
              className="p-2 rounded-xl text-stone-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
              aria-label="Reset Percakapan"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl text-stone-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
              aria-label="Tutup Terminal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Technical Verified Sub-header */}
        <div className="px-4 py-2 bg-emerald-950/5 border-b border-emerald-900/10 flex items-center justify-between text-[11px] text-emerald-900 font-medium">
          <span className="flex items-center gap-1.5 font-sans">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>Konteks terkalibrasi ke standar SPPG & Pergub Gizi</span>
          </span>
          <a
            href="/data/orvana_knowledge_base.csv"
            target="_blank"
            rel="noreferrer"
            className="text-[10px] font-mono font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-emerald-100/60 transition-colors"
          >
            <span>Audit CSV</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-5 text-xs">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1.5`}
            >
              {/* Bot Persona Badge */}
              {msg.sender === 'bot' && (
                <div className="flex items-center gap-2 pl-0.5">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-emerald-900 to-emerald-700 text-white shadow-xs shrink-0 flex items-center justify-center ring-1 ring-emerald-500/30">
                    <Bot className="w-3.5 h-3.5 text-emerald-200" />
                  </div>
                  <span className="text-[11px] font-bold text-stone-800 tracking-tight">
                    ORVANA Concierge
                  </span>
                  {msg.category && (
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200/60">
                      {msg.category}
                    </span>
                  )}
                </div>
              )}

              {/* Message Bubble Card */}
              <div
                className={`p-4 rounded-2xl max-w-[90%] leading-relaxed shadow-sm transition-all ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-br from-[#12241C] to-[#1C382C] text-white rounded-br-xs font-medium text-[12.5px] border border-emerald-900/40 shadow-emerald-950/10'
                    : 'bg-white text-stone-800 border border-stone-200/80 rounded-tl-xs shadow-stone-200/50 text-[12.5px]'
                }`}
              >
                {msg.sender === 'bot' ? (
                  <div className="space-y-2">{renderFormattedMarkdown(msg.text)}</div>
                ) : (
                  <p className="whitespace-pre-line">{msg.text}</p>
                )}

                {/* Quick Action Button inside response */}
                {msg.actionLink && (
                  <div className="pt-2.5 mt-3 border-t border-stone-100 flex items-center">
                    <a
                      href={msg.actionLink}
                      onClick={() => {
                        if (msg.actionLink?.startsWith('#')) {
                          setIsOpen(false);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50/80 hover:bg-emerald-100/80 px-3 py-1.5 rounded-lg border border-emerald-200/50 transition-all"
                    >
                      <span>Lihat Bagian Terkait di Layar</span>
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Suggested Follow Up Chips (Pill Artisan Style) */}
              {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1.5 max-w-[92%] pl-1">
                  {msg.suggestedFollowUps.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(chip)}
                      className="group py-1.5 px-3 rounded-xl bg-white hover:bg-emerald-50/90 text-stone-700 hover:text-emerald-950 border border-stone-200/90 hover:border-emerald-300 text-[11.5px] transition-all text-left cursor-pointer shadow-2xs hover:shadow-xs flex items-center gap-1.5 active:scale-95"
                    >
                      <span className="text-amber-500 font-bold group-hover:scale-110 transition-transform">✦</span>
                      <span>{chip}</span>
                    </button>
                  ))}
                </div>
              )}

              <span className={`text-[9px] font-mono text-stone-400 px-1 ${msg.sender === 'bot' ? 'pl-2' : ''}`}>
                {msg.timestamp}
              </span>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center gap-2 text-stone-500 text-xs py-2 px-3 bg-white/70 rounded-xl border border-stone-200/60 w-fit shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]" />
              <span className="text-[11px] font-mono text-emerald-900 font-medium ml-1">
                Merumuskan jawaban kontekstual...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar: Artisan Clean Box with elevated shadow */}
        <div className="p-4 bg-white border-t border-stone-200/90 shrink-0 shadow-lg">
          <div className="relative flex items-center bg-stone-50 border border-stone-200 focus-within:border-emerald-600 focus-within:bg-white focus-within:ring-3 focus-within:ring-emerald-600/10 rounded-2xl transition-all shadow-inner">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tanya seputar aturan kuota, DP 30%, QC mutu..."
              className="flex-1 bg-transparent px-4 py-3 text-xs sm:text-[13px] text-stone-900 placeholder:text-stone-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputQuery.trim() || isTyping}
              className="mr-1.5 p-2 rounded-xl bg-[#132A21] hover:bg-emerald-900 disabled:opacity-30 disabled:pointer-events-none text-white transition-all cursor-pointer shadow-xs active:scale-95"
              aria-label="Kirim Pesan"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 mt-2 px-1">
            <span>Model: Gemini 3.5 Flash RAG</span>
            <span>Tekan Enter untuk kirim</span>
          </div>
        </div>
      </aside>

      {/* FLOATING TRIGGER BUTTON (Pill Design - Selalu di pojok kanan bawah) */}
      <div className="fixed bottom-6 right-6 z-40 select-none pointer-events-auto">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group relative flex items-center gap-2.5 px-4.5 py-3 rounded-full bg-[#11231B] hover:bg-black text-white shadow-2xl hover:shadow-emerald-950/40 border border-emerald-800/40 transition-all duration-300 hover:scale-[1.03] active:scale-95 cursor-pointer ring-4 ring-emerald-950/10"
          aria-label="Buka Asisten AI Orvana"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-xs" />
          <MessageSquare className="w-4 h-4 text-emerald-300 group-hover:rotate-6 transition-transform" />
          <span className="text-xs font-bold font-sans tracking-wide">
            {isOpen ? 'Tutup Konsol AI' : 'Asisten AI ORVANA'}
          </span>
        </button>
      </div>
    </>
  );
};
