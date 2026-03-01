import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageCircle, Loader2, ChevronDown, RotateCcw, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

const QUICK_TOPICS = [
  '💸 Transaksi gagal / pending',
  '🔐 Masalah keamanan akun',
  '💱 Swap / bridge bermasalah',
  '🏦 Deposit / withdraw bank',
  '❓ Pertanyaan umum lainnya',
];

const AUTO_REPLIES = {
  default: 'Terima kasih sudah menghubungi CoinVault Support! Tim kami sedang meninjau pesan Anda dan akan membalas secepatnya (biasanya dalam 1-2 jam). Sementara itu, apakah ada detail tambahan yang ingin Anda sampaikan?',
  transaction: 'Untuk masalah transaksi, mohon sertakan: (1) Hash transaksi, (2) Tanggal & waktu, (3) Jumlah & koin yang terlibat. Kami akan segera menginvestigasi.',
  security: 'Masalah keamanan sangat kami prioritaskan! Jika Anda merasa akun dikompromikan, segera ubah password dan aktifkan 2FA di halaman Settings > Security. Tim keamanan kami akan menghubungi Anda segera.',
  swap: 'Untuk masalah swap/bridge, mohon sertakan: (1) Token asal & tujuan, (2) Jumlah, (3) TX hash jika ada. Kami akan melacak status transaksi Anda.',
  bank: 'Untuk masalah deposit/withdraw IDR, proses biasanya memerlukan 1-3 hari kerja. Jika sudah melebihi waktu tersebut, mohon lampirkan bukti transfer dan kami akan segera menindaklanjuti.',
};

function getAutoReply(message) {
  const msg = message.toLowerCase();
  if (msg.includes('transaksi') || msg.includes('pending') || msg.includes('gagal')) return AUTO_REPLIES.transaction;
  if (msg.includes('keamanan') || msg.includes('hack') || msg.includes('security') || msg.includes('password')) return AUTO_REPLIES.security;
  if (msg.includes('swap') || msg.includes('bridge') || msg.includes('tukar')) return AUTO_REPLIES.swap;
  if (msg.includes('bank') || msg.includes('deposit') || msg.includes('withdraw') || msg.includes('idr')) return AUTO_REPLIES.bank;
  return AUTO_REPLIES.default;
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  const time = msg.created_date
    ? new Date(msg.created_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mr-2 mt-0.5">
          <Headphones className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      <div className={`max-w-[78%] space-y-0.5`}>
        <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-slate-800 text-slate-100 rounded-bl-sm border border-slate-700/50'
        }`}>
          {msg.content}
        </div>
        {time && <p className={`text-[10px] text-slate-600 ${isUser ? 'text-right' : 'text-left'} px-1`}>{time}</p>}
      </div>
    </div>
  );
}

export default function SupportChat({ user, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [autoReplying, setAutoReplying] = useState(false);
  const [conversationId] = useState(() => {
    const key = 'cv_support_conv_id';
    let id = localStorage.getItem(key);
    if (!id) { id = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; localStorage.setItem(key, id); }
    return id;
  });
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadMessages();
    // Real-time subscription
    const unsub = base44.entities.SupportMessage.subscribe((event) => {
      if (event.data?.conversationId === conversationId) {
        setMessages(prev => {
          if (event.type === 'create') {
            if (prev.find(m => m.id === event.id)) return prev;
            return [...prev, event.data];
          }
          return prev;
        });
      }
    });
    return unsub;
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, autoReplying]);

  const loadMessages = async () => {
    setLoading(true);
    const data = await base44.entities.SupportMessage.filter({ conversationId }, 'created_date', 100);
    setMessages(data);
    setLoading(false);
  };

  const sendMessage = async (content) => {
    if (!content.trim() || sending) return;
    setSending(true);
    const userMsg = {
      conversationId,
      role: 'user',
      content: content.trim(),
      userEmail: user?.email || '',
    };
    await base44.entities.SupportMessage.create(userMsg);
    setInput('');
    setSending(false);

    // Auto-reply after short delay
    setAutoReplying(true);
    setTimeout(async () => {
      const reply = {
        conversationId,
        role: 'support',
        content: getAutoReply(content),
        userEmail: user?.email || '',
      };
      await base44.entities.SupportMessage.create(reply);
      setAutoReplying(false);
    }, 1200);
  };

  const handleQuickTopic = (topic) => {
    setInput(topic);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const isFirstMessage = messages.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="bg-slate-950 border border-slate-700 rounded-t-2xl sm:rounded-2xl w-full max-w-md flex flex-col"
        style={{ height: '85vh', maxHeight: '600px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center">
                <Headphones className="w-4 h-4 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-950" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">CoinVault Support</p>
              <p className="text-green-400 text-[10px]">● Online · Biasanya membalas dalam 1-2 jam</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={loadMessages} className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-0">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
            </div>
          ) : (
            <>
              {/* Welcome message */}
              <div className="flex justify-start mb-4">
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                  <Headphones className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="max-w-[78%] px-3.5 py-2.5 rounded-2xl rounded-bl-sm bg-slate-800 border border-slate-700/50 text-slate-100 text-sm leading-relaxed">
                  Halo{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}! 👋 Selamat datang di CoinVault Support. Ada yang bisa kami bantu hari ini?
                </div>
              </div>

              {/* Quick topics on first visit */}
              {isFirstMessage && (
                <div className="mb-4 pl-9 space-y-2">
                  <p className="text-slate-500 text-xs mb-1.5">Topik umum:</p>
                  {QUICK_TOPICS.map(topic => (
                    <button key={topic} onClick={() => handleQuickTopic(topic)}
                      className="block w-full text-left px-3 py-2 bg-slate-800/70 border border-slate-700/50 rounded-xl text-slate-300 text-xs hover:bg-slate-800 hover:text-white transition-colors">
                      {topic}
                    </button>
                  ))}
                </div>
              )}

              {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}

              {autoReplying && (
                <div className="flex justify-start mb-3">
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                    <Headphones className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="px-4 py-3 bg-slate-800 rounded-2xl rounded-bl-sm border border-slate-700/50 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-slate-800 shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ketik pesan Anda…"
              rows={1}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-slate-600 resize-none focus:outline-none focus:border-blue-500 transition-colors leading-relaxed"
              style={{ maxHeight: '100px', overflowY: 'auto' }}
            />
            <Button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || sending}
              size="icon"
              className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 shrink-0"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-slate-600 text-[10px] text-center mt-1.5">Enter untuk kirim · Shift+Enter untuk baris baru</p>
        </div>
      </div>
    </div>
  );
}