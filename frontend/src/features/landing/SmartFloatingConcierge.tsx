import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  ExternalLink,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { queryOrvanaKnowledge, CopilotResponse } from './orvanaKnowledgeEngine';

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

  const handleSendMessage = (textToSend?: string) => {
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

    // Realistic smart response delay
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
    }, 450);
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
    <aside
      aria-label="Pusat Bantuan Asisten AI Resmi"
      className="fixed bottom-6 right-6 z-40 select-none flex flex-col items-end pointer-events-auto"
    >
      {/* CHAT COPILOT MODAL POPUP */}
      {isOpen && (
        <div className="mb-3 w-[92vw] sm:w-[420px] max-h-[82vh] h-[580px] bg-white border border-stone-200/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-900 transition-all duration-300 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 font-sans ring-1 ring-stone-900/5">
          
          {/* Header Bar */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-emerald-950 via-[#132A21] to-emerald-950 text-white flex items-center justify-between border-b border-emerald-900 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold text-sm shadow-xs">
                🌾
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold font-serif leading-tight">
                    ORVANA Agritech AI Copilot
                  </h4>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Online • Basis Regulasi Resmi</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={resetChat}
                title="Mulai percakapan baru"
                className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Reset Chat"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Tutup Menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Notice Banner */}
          <div className="px-3.5 py-1.5 bg-emerald-50 border-b border-emerald-100/80 flex items-center justify-between text-[11px] text-emerald-900 font-medium">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-emerald-700" />
              <span>Jawaban terverifikasi dokumen teknis ORVANA</span>
            </span>
            <a
              href="/data/orvana_knowledge_base.csv"
              target="_blank"
              rel="noreferrer"
              className="text-[10px] font-mono text-emerald-700 hover:underline flex items-center gap-0.5"
            >
              <span>Lihat CSV</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-stone-50/50 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1`}
              >
                {msg.category && msg.sender === 'bot' && (
                  <span className="text-[9px] font-mono font-bold text-emerald-800 uppercase tracking-wider px-1">
                    {msg.category}
                  </span>
                )}

                <div
                  className={`p-3.5 rounded-2xl max-w-[88%] leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-emerald-950 text-white rounded-br-xs shadow-xs font-medium'
                      : 'bg-white text-stone-800 border border-stone-200/90 rounded-bl-xs shadow-2xs font-normal'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* Quick Action Button inside response */}
                  {msg.actionLink && (
                    <div className="pt-2 mt-2 border-t border-stone-100 flex items-center">
                      <a
                        href={msg.actionLink}
                        onClick={() => {
                          if (msg.actionLink?.startsWith('#')) {
                            setIsOpen(false);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 transition-colors"
                      >
                        <span>Buka Halaman / Fitur Terkait</span>
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Suggested Follow Up Chips (Only on bot message) */}
                {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1.5 max-w-[90%]">
                    {msg.suggestedFollowUps.map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(chip)}
                        className="py-1 px-2.5 rounded-lg bg-white hover:bg-emerald-50 text-stone-700 hover:text-emerald-950 border border-stone-200 hover:border-emerald-300 text-[11px] transition-colors text-left cursor-pointer shadow-2xs"
                      >
                        💡 {chip}
                      </button>
                    ))}
                  </div>
                )}

                <span className="text-[9px] font-mono text-stone-400 px-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-1.5 text-stone-500 text-xs py-1 px-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] font-mono text-stone-400 ml-1">AI sedang memproses basis data...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 bg-white border-t border-stone-200 flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tanya seputar aturan ORVANA, kuota, panen..."
              className="flex-1 bg-stone-50 hover:bg-stone-100/70 focus:bg-white border border-stone-200 focus:border-emerald-600 rounded-xl px-3.5 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputQuery.trim() || isTyping}
              className="p-2.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 disabled:opacity-40 text-white transition-colors cursor-pointer shrink-0 shadow-2xs"
              aria-label="Kirim Pesan"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      )}

      {/* FLOATING TRIGGER BUTTON (Pill Design) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2 px-4 py-2.5 rounded-full bg-stone-900/95 hover:bg-stone-950 text-white shadow-xl hover:shadow-2xl border border-stone-700/80 transition-all duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer"
        aria-label="Buka Asisten AI Orvana"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-xs" />
        <MessageSquare className="w-4 h-4 text-emerald-400 group-hover:rotate-6 transition-transform" />
        <span className="text-xs font-bold font-sans tracking-wide">
          {isOpen ? 'Tutup Asisten' : 'Asisten AI ORVANA'}
        </span>
      </button>
    </aside>
  );
};
