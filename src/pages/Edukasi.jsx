import React, { useState } from 'react';
import { BookOpen, ChevronRight, Clock, Search, X, ShieldAlert } from 'lucide-react';

const ARTICLES = [
  {
    id: 1, cat: 'Pemula', icon: '🪙',
    title: 'Apa itu Bitcoin?',
    desc: 'Pengantar Bitcoin: sejarah, cara kerja, dan mengapa ia menjadi mata uang digital pertama di dunia.',
    readMin: 5, level: 'Pemula',
    content: `Bitcoin (BTC) adalah mata uang digital terdesentralisasi yang diciptakan oleh entitas anonim bernama Satoshi Nakamoto pada tahun 2009.

**Cara Kerja Bitcoin:**
Bitcoin menggunakan teknologi blockchain — buku besar digital yang terdistribusi — untuk mencatat semua transaksi secara transparan dan tidak dapat diubah.

**Kenapa Bitcoin Berharga?**
• Jumlahnya terbatas (hanya 21 juta BTC)
• Tidak dikontrol pemerintah atau bank
• Transaksi peer-to-peer tanpa perantara
• Dapat dikirim ke seluruh dunia dalam menit

**Cara Mendapatkan Bitcoin:**
1. Beli di exchange (Binance, KriptoAman)
2. Mining (menambang)
3. Terima sebagai pembayaran

⚠️ DYOR — selalu lakukan riset sebelum berinvestasi.`,
  },
  {
    id: 2, cat: 'Pemula', icon: '🔗',
    title: 'Apa itu Blockchain?',
    desc: 'Teknologi di balik kripto: bagaimana blockchain bekerja, keamanan, dan kegunaannya di dunia nyata.',
    readMin: 7, level: 'Pemula',
    content: `Blockchain adalah database terdesentralisasi yang menyimpan data dalam "blok" yang saling terhubung.

**Karakteristik Utama:**
• **Desentralisasi** — tidak ada satu pihak yang mengontrol
• **Immutability** — data yang sudah dicatat tidak bisa diubah
• **Transparansi** — semua transaksi dapat dilihat publik
• **Keamanan** — dijamin oleh kriptografi

**Jenis Blockchain:**
1. Public (Bitcoin, Ethereum)
2. Private (enterprise)
3. Hybrid

**Kegunaan Blockchain:**
- Mata uang digital
- Smart contract
- Supply chain
- Voting digital
- NFT & DeFi`,
  },
  {
    id: 3, cat: 'Menengah', icon: '📊',
    title: 'Analisis Teknikal Dasar',
    desc: 'Pelajari cara membaca grafik kripto: candlestick, support/resistance, dan indikator populer.',
    readMin: 12, level: 'Menengah',
    content: `Analisis teknikal (TA) adalah metode memprediksi harga berdasarkan data historis dan grafik.

**Candlestick Chart:**
Setiap candle menunjukkan: Open, High, Low, Close dalam periode tertentu.
- Candle hijau = harga naik
- Candle merah = harga turun

**Support & Resistance:**
- **Support** = level harga terendah yang sering "memantul" naik
- **Resistance** = level harga tertinggi yang sering "memantul" turun

**Indikator Populer:**
1. **RSI (0-100)** — overbought >70, oversold <30
2. **MACD** — momentum dan arah tren
3. **Moving Average (MA)** — rata-rata harga periode tertentu
4. **Bollinger Bands** — volatilitas pasar

⚠️ TA bukan jaminan. Gunakan bersama analisis fundamental.`,
  },
  {
    id: 4, cat: 'Menengah', icon: '🔒',
    title: 'Keamanan Aset Kripto',
    desc: 'Tips penting menjaga keamanan wallet, seed phrase, dan aset digital Anda dari ancaman hacker.',
    readMin: 8, level: 'Menengah',
    content: `Keamanan adalah hal terpenting dalam dunia kripto. "Not your keys, not your coins."

**Aturan Emas:**
1. **Jangan pernah** bagikan seed phrase ke siapapun
2. Simpan seed phrase offline (kertas, bukan foto)
3. Gunakan hardware wallet untuk simpanan besar
4. Aktifkan 2FA di semua akun exchange

**Ancaman Umum:**
- Phishing (situs palsu)
- SIM swapping
- Malware/keylogger
- Social engineering
- Rug pull (proyek scam)

**Best Practices:**
• Gunakan email khusus untuk kripto
• Cek URL website dengan teliti
• Jangan klik link mencurigakan di Telegram/Twitter
• Update software secara berkala
• Gunakan password manager`,
  },
  {
    id: 5, cat: 'Lanjutan', icon: '⚡',
    title: 'DeFi: Keuangan Terdesentralisasi',
    desc: 'Panduan lengkap DeFi: DEX, yield farming, liquidity pool, dan risikonya.',
    readMin: 15, level: 'Lanjutan',
    content: `DeFi (Decentralized Finance) adalah ekosistem keuangan yang berjalan di atas smart contract tanpa perantara bank.

**Komponen DeFi:**
1. **DEX** (Decentralized Exchange) — Uniswap, PancakeSwap
2. **Lending/Borrowing** — Aave, Compound
3. **Yield Farming** — memberikan likuiditas untuk mendapatkan reward
4. **Staking** — mengunci token untuk mendapat bunga

**Risiko DeFi:**
- Smart contract bug/exploit
- Impermanent loss
- Rug pull
- Volatilitas tinggi
- Regulasi yang belum jelas

**Tips Aman di DeFi:**
• Mulai dengan modal kecil
• Gunakan protokol audit terpercaya
• Pahami cara kerja sebelum deposit
• Diversifikasi di beberapa protokol`,
  },
  {
    id: 7, cat: 'Anti-RugPull', icon: '🚨',
    title: 'Cara Mendeteksi Rug Pull',
    desc: 'Panduan lengkap menghindari proyek kripto scam: ciri-ciri rug pull, red flag, dan cara melindungi aset Anda.',
    readMin: 10, level: 'Penting',
    content: `Rug pull adalah penipuan di mana developer proyek kabur membawa dana investor setelah memompa harga token.

**⚠️ Ciri-Ciri Rug Pull:**
• Anonymous team / tim tidak dikenal
• Kode smart contract tidak diaudit
• Tidak ada liquidity lock
• Hype berlebihan di media sosial
• Janji return tidak realistis (1000x, "pasti untung")
• Token terkonsentrasi di sedikit wallet
• Whitepaper samar atau copy-paste
• Tidak ada produk nyata / roadmap jelas

**🔍 Cara Verifikasi Sebelum Invest:**
1. Cek audit di CertiK, PeckShield, Hacken
2. Cek liquidity lock di Unicrypt atau Team.Finance
3. Analisa distribusi token di Etherscan/BSCScan
4. Cek umur kontrak & aktivitas developer
5. Cari berita proyek di Google News
6. Tanya di komunitas (Telegram, Discord) dan perhatikan respons

**🛡️ Tools Wajib:**
- **Token Sniffer** — scan smart contract otomatis
- **RugCheck** — cek risiko token Solana
- **DEXTools** — analisa on-chain mendalam
- **BubbleMaps** — visualisasi distribusi wallet

**💡 Aturan Emas:**
⚠️ Jika terdengar terlalu bagus untuk jadi kenyataan, kemungkinan besar itu scam. Invest hanya yang Anda siap kehilangan 100%.`,
  },
  {
    id: 8, cat: 'Anti-RugPull', icon: '🔐',
    title: 'Keamanan Wallet & Anti-Phishing',
    desc: 'Cara melindungi wallet kripto Anda dari phishing, fake airdrop, malicious contract, dan serangan hacker.',
    readMin: 8, level: 'Penting',
    content: `Lebih banyak kripto hilang karena keamanan lemah daripada karena pasar turun. Lindungi diri Anda sekarang.

**🎣 Modus Phishing Umum:**
• Link fake di iklan Google ("Metamask.io" palsu)
• Airdrop token gratis → mint = drain wallet
• Support palsu di Telegram/Discord
• Email "verifikasi wallet" dari exchange palsu
• Situs kloning exchange populer

**✅ Checklist Keamanan Harian:**
1. Selalu ketik URL manual, jangan klik link
2. Gunakan bookmark untuk exchange penting
3. Install MetaMask hanya dari situs resmi
4. Jangan approve kontrak tidak dikenal
5. Revoke izin di revoke.cash secara berkala
6. Gunakan hardware wallet (Ledger/Trezor) untuk simpanan besar

**🔑 Proteksi Seed Phrase:**
• Tulis di kertas, simpan di brankas / tempat aman
• JANGAN foto, screenshot, atau kirim via chat
• JANGAN masukkan di situs manapun
• Pertimbangkan metal backup tahan api

⚠️ TIDAK ADA exchange atau wallet resmi yang pernah meminta seed phrase Anda. Siapapun yang meminta itu adalah penipu.`,
  },
  {
    id: 6, cat: 'Lanjutan', icon: '🤖',
    title: 'Trading Bot & Auto-Trade',
    desc: 'Cara kerja trading bot, strategi otomatis, dan bagaimana KriptoAman membantu automasi trading Anda.',
    readMin: 10, level: 'Lanjutan',
    content: `Trading bot adalah program komputer yang secara otomatis mengeksekusi order berdasarkan aturan yang telah ditetapkan.

**Keuntungan Trading Bot:**
- Tidak terpengaruh emosi
- Trading 24/7 tanpa lelah
- Eksekusi lebih cepat
- Backtesting strategi

**Jenis Strategi:**
1. **Grid Trading** — memasang order di level harga tertentu
2. **DCA** (Dollar Cost Averaging) — beli secara berkala
3. **Momentum** — ikuti arah tren
4. **Arbitrage** — manfaatkan perbedaan harga di exchange berbeda

**KriptoAman Auto-Trade:**
Platform kami menyediakan:
• Rule-based bot (RSI, MACD, Bollinger)
• Paper trading (simulasi)
• Grid trading bot
• Stop-loss & take-profit otomatis

⚠️ Bot tidak menjamin profit. Selalu monitor dan kelola risiko.`,
  },
];

const LEVELS = ['Semua', 'Pemula', 'Menengah', 'Lanjutan', 'Penting'];

function ArticleModal({ article, onClose }) {
  const lines = article.content.split('\n');
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end justify-center p-0 md:items-center md:p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700/50 rounded-t-3xl md:rounded-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{article.icon}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${article.level === 'Pemula' ? 'bg-green-500/20 text-green-400' : article.level === 'Menengah' ? 'bg-yellow-500/20 text-yellow-400' : article.level === 'Penting' ? 'bg-rose-500/20 text-rose-400' : 'bg-red-500/20 text-red-400'}`}>{article.level}</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700"><X className="w-4 h-4 text-slate-300" /></button>
        </div>
        <div className="p-5">
          <h2 className="text-white text-xl font-bold mb-1">{article.title}</h2>
          <p className="text-slate-400 text-xs mb-5 flex items-center gap-1"><Clock className="w-3 h-3" /> {article.readMin} menit baca</p>
          <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
            {lines.map((line, i) => {
              if (!line.trim()) return <div key={i} className="h-1" />;
              if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="text-white font-bold">{line.replace(/\*\*/g, '')}</p>;
              if (line.startsWith('•') || line.startsWith('-')) return <p key={i} className="ml-3">{line}</p>;
              if (/^\d+\./.test(line)) return <p key={i} className="ml-3">{line}</p>;
              if (line.startsWith('⚠️')) return <p key={i} className="text-yellow-300 bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20">{line}</p>;
              return <p key={i}>{line}</p>;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Edukasi() {
  const [level, setLevel] = useState('Semua');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const filtered = ARTICLES.filter(a => {
    if (level !== 'Semua' && a.level !== level) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.desc.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white pb-24">
      {selected && <ArticleModal article={selected} onClose={() => setSelected(null)} />}
      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">

        <div>
          <h1 className="text-xl font-bold">Edukasi Kripto</h1>
          <p className="text-slate-500 text-xs">Belajar dari dasar hingga mahir</p>
        </div>

        {/* Anti-rugpull alert banner */}
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-rose-300 font-bold text-sm">⚠️ Waspada Rug Pull & Scam</p>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">Baca panduan <strong className="text-rose-300">Anti Rug Pull</strong> kami — filter "Penting" untuk panduan keamanan kripto terlengkap.</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari artikel..."
            className="w-full bg-slate-800/70 border border-slate-700/50 rounded-2xl pl-9 pr-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder-slate-500" />
        </div>

        {/* Level filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {LEVELS.map(l => (
            <button key={l} onClick={() => setLevel(l)}
              className={`shrink-0 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${level === l ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* Articles */}
        <div className="space-y-3">
          {filtered.map(a => (
            <button key={a.id} onClick={() => setSelected(a)}
              className="w-full text-left bg-slate-800/50 border border-slate-700/40 rounded-2xl p-4 hover:border-indigo-500/40 transition-all active:scale-[0.99]">
              <div className="flex items-start gap-3">
                <div className="text-3xl shrink-0">{a.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${a.level === 'Pemula' ? 'bg-green-500/20 text-green-400' : a.level === 'Menengah' ? 'bg-yellow-500/20 text-yellow-400' : a.level === 'Penting' ? 'bg-rose-500/20 text-rose-400' : 'bg-red-500/20 text-red-400'}`}>{a.level}</span>
                    <span className="text-slate-500 text-[10px] flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{a.readMin} mnt</span>
                  </div>
                  <p className="text-white font-semibold text-sm">{a.title}</p>
                  <p className="text-slate-400 text-xs mt-1 line-clamp-2">{a.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 shrink-0 mt-1" />
              </div>
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Tidak ada artikel ditemukan</p>
          </div>
        )}
      </div>
    </div>
  );
}