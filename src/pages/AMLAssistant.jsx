import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, ShieldCheck, Loader2, AlertTriangle, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const SUGGESTED_QUESTIONS = [
  "Apa status AML saya saat ini?",
  "Kenapa akun saya di-flag?",
  "Dokumen apa yang perlu saya siapkan?",
  "Berapa lama proses review AML?",
];

const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';
  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        isUser ? 'bg-blue-600' : 'bg-gradient-to-br from-amber-500 to-orange-600'
      }`}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <ShieldCheck className="w-4 h-4 text-white" />}
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
        isUser
          ? 'bg-blue-600 text-white rounded-tr-sm'
          : 'bg-slate-800 text-slate-100 rounded-tl-sm border border-slate-700/50'
      }`}>
        {message.content && (
          isUser
            ? <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            : <div className="text-sm prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
        )}
        {message.tool_calls?.map((tc, idx) => (
          <div key={idx} className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
            <Loader2 className={`w-3 h-3 ${tc.status === 'completed' || tc.status === 'success' ? '' : 'animate-spin'}`} />
            <span>Mengecek data AML/KYC…</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function AMLAssistant() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    let unsubscribe = null;
    (async () => {
      try {
        const conv = await base44.agents.createConversation({
          agent_name: 'aml_assistant',
          metadata: { name: 'AML Assistant Chat' },
        });
        setConversation(conv);
        setCreating(false);
        unsubscribe = base44.agents.subscribeToConversation(conv.id, (data) => {
          setMessages(data.messages || []);
        });
      } catch (err) {
        console.error('Failed to create AML conversation:', err);
        setCreating(false);
      }
    })();
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const content = text || input.trim();
    if (!content || !conversation || loading) return;
    setInput('');
    setLoading(true);
    try {
      await base44.agents.addMessage(conversation, { role: 'user', content });
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setLoading(false);
    }
  };

  const assistantThinking = loading && messages[messages.length - 1]?.role === 'user';

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col max-w-2xl mx-auto px-4">
      {/* Header */}
      <div className="flex items-center gap-3 py-4 border-b border-slate-800">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-bold text-lg leading-tight">AML Assistant</h1>
          <p className="text-slate-400 text-xs">Panduan status & dokumentasi AML</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.length === 0 && !creating && (
          <div className="space-y-4">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-sm text-slate-300">
              <div className="flex items-center gap-2 mb-2 text-amber-400 font-semibold">
                <AlertTriangle className="w-4 h-4" />
                Halo! Saya AML Assistant
              </div>
              <p className="mb-2">Saya bisa membantu Anda memahami status AML (Anti-Money Laundering) screening akun Anda dan memandu dokumentasi yang diperlukan.</p>
              <p className="text-slate-400 text-xs">Coba tanyakan salah satu pertanyaan di bawah:</p>
            </div>
            <div className="space-y-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  disabled={loading}
                  className="w-full text-left px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 rounded-xl text-sm text-slate-200 transition-colors disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <MessageBubble key={idx} message={msg} />
        ))}

        {assistantThinking && (
          <div className="flex gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div className="bg-slate-800 border border-slate-700/50 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-800 pt-3 pb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
            placeholder="Tanyakan tentang status AML Anda…"
            disabled={loading || creating}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || creating || !input.trim()}
            className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity shrink-0"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}