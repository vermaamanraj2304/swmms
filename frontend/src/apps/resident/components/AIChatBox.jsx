import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  RotateCcw, 
  Copy, 
  Check, 
  Lightbulb, 
  ArrowRight,
  User,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';

export default function AIChatBox({
  messages = [],
  input = '',
  setInput,
  sending = false,
  onSend,
  onClearChat,
  onSelectPrompt
}) {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const samplePrompts = [
    { label: '🌱 Wet vs Dry Segregation', prompt: 'How do I segregate wet and dry waste properly?' },
    { label: '⚡ E-Waste & Batteries', prompt: 'What should I do with old phone batteries and chargers?' },
    { label: '🚚 Truck Schedule & Radar', prompt: 'When does the daily garbage truck arrive in my sector?' },
    { label: '🪙 Points & Bill Rebates', prompt: 'How do I earn Garbage Points and redeem them for bill discounts?' }
  ];

  // Helper to format text with bold and bullet highlights
  const renderFormattedText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Bullet items
      if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
        const content = line.trim().replace(/^[-•]\s*/, '');
        return (
          <li key={idx} className="ml-4 list-disc text-slate-700 leading-relaxed py-0.5">
            {formatBold(content)}
          </li>
        );
      }
      // Blank lines
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }
      // Normal paragraphs
      return (
        <p key={idx} className="leading-relaxed py-0.5">
          {formatBold(line)}
        </p>
      );
    });
  };

  const formatBold = (str) => {
    const parts = str.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs h-[640px] flex flex-col overflow-hidden">
      {/* 1. Header Bar */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-[#0B2E24] text-white border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse"></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm tracking-tight text-white">SWM&MS AI Assistant</h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-emerald-400" /> Google Gemini Ready
              </span>
            </div>
            <p className="text-[11px] text-slate-300">24/7 Municipal Sanitation & Segregation Guide</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onClearChat && (
            <button
              type="button"
              onClick={onClearChat}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition text-xs flex items-center gap-1.5 cursor-pointer"
              title="Reset Conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px] font-semibold">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Suggested Prompt Chips */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2 overflow-x-auto shrink-0">
        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden sm:inline">Ask:</span>
        </div>
        {samplePrompts.map((p, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelectPrompt ? onSelectPrompt(p.prompt) : setInput(p.prompt)}
            className="px-3 py-1 rounded-full bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-medium border border-slate-200/80 hover:border-emerald-200 transition shadow-2xs whitespace-nowrap cursor-pointer"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* 3. Messages Scroll Area */}
      <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto bg-slate-50/40">
        {messages.map((msg, i) => {
          const isUser = msg.sender === 'user';
          return (
            <div 
              key={i} 
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                isUser 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-slate-900 text-white shadow-xs'
              }`}>
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-emerald-400" />}
              </div>

              {/* Message Bubble */}
              <div className={`relative group max-w-xl p-4 rounded-2xl text-xs ${
                isUser 
                  ? 'bg-emerald-600 text-white rounded-tr-none shadow-xs' 
                  : 'bg-white text-slate-800 rounded-tl-none border border-slate-200/80 shadow-xs'
              }`}>
                {!isUser && (
                  <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-100 text-[10px] text-slate-400">
                    <span className="font-bold text-emerald-700 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" /> 
                      {msg.source === 'gemini' ? 'Google Gemini AI' : 'SWM&MS AI Assistant'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.text, i)}
                      className="opacity-60 hover:opacity-100 transition p-1 hover:bg-slate-100 rounded text-slate-500"
                      title="Copy response"
                    >
                      {copiedIndex === i ? (
                        <span className="text-emerald-600 flex items-center gap-0.5 font-bold">
                          <Check className="w-3 h-3" /> Copied
                        </span>
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                )}

                <div className={isUser ? 'text-white leading-relaxed' : 'text-slate-800'}>
                  {isUser ? msg.text : renderFormattedText(msg.text)}
                </div>

                {msg.timestamp && (
                  <div className={`text-[10px] mt-2 pt-1 flex justify-end ${
                    isUser ? 'text-emerald-100/70' : 'text-slate-400'
                  }`}>
                    {msg.timestamp}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {sending && (
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200/80 p-3.5 rounded-2xl rounded-tl-none text-xs flex items-center gap-2 shadow-xs">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]"></span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium pl-1">Generating AI response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. Input & Send Bar */}
      <div className="p-3 sm:p-4 bg-white border-t border-slate-200/80 shrink-0 space-y-2">
        <form onSubmit={onSend} className="flex items-center gap-2">
          <input 
            type="text" 
            placeholder="Ask anything about waste segregation, recycling rules, truck schedules..." 
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={sending}
            className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition text-slate-800 placeholder:text-slate-400 disabled:opacity-50"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || sending}
            className="bg-[#00B074] hover:bg-[#009e67] disabled:opacity-40 text-white px-5 py-3 rounded-2xl font-bold text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shrink-0"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span className="flex items-center gap-1">
            <Info className="w-3 h-3" /> Powered by SWM&MS Municipal AI • Supports English & Hindi
          </span>
          <span className="hidden sm:inline">Press Enter to send</span>
        </div>
      </div>
    </div>
  );
}
