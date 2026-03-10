import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { BookOpen, ChevronRight, ChevronDown, Shield, TrendingUp, AlertTriangle, Zap, BarChart3, Lock, Clock, Star } from 'lucide-react';

const CATEGORIES = [
  { id: 'pemula', label: 'Pemula', icon: BookOpen, color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20' },
  { id: 'trading', label: 'Trading', icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
  { id: 'keamanan', label: 'Keamanan', icon: Shield, color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20' },
  { id: 'defi', label: 'DeFi & DEX', icon: Zap, color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20' },
  { id: 'analisis', label: 'Analisis Teknikal', icon: BarChart3, color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
];

const ARTICLES = [
  // Pemula
  {
    id: 1, category: 'pemula', level: 'Pemula', readTime: '5 menit',
    title: 'Apa Itu Kripto? Panduan Lengkap untuk Pemula 2026',
    summary: 'Pelajari dasar-dasar cryptocurrency, cara kerjanya, dan mengapa kripto menjadi instrumen investasi populer di Indonesia.',
    content: `
## Apa Itu Cryptocurrency?

Cryptocurrency (kripto) adalah mata uang digital yang menggunakan teknologi **blockchain** dan **kriptografi** untuk mengamankan transaksi tanpa memerlukan perantara seperti bank.

### Cara Kerja Blockchain

Bayangkan blockchain seperti buku besar digital yang:
- **Terdesentralisasi** — disimpan di ribuan komputer sekaligus
- **Transparan** — semua transaksi bisa dilihat publik
- **Tidak bisa diubah** — sekali dicatat, tidak bisa dihapus
- **Aman** — dilindungi kriptografi tingkat militer

### Jenis Kripto Utama

| Kripto | Fungsi | Kegunaan |
|--------|--------|----------|
| **Bitcoin (BTC)** | Penyimpan nilai | "Emas digital" |
| **Ethereum (ETH)** | Smart contract | DeFi, NFT, dApps |
| **USDT/USDC** | Stablecoin | Hindari volatilitas |
| **Solana (SOL)** | Blockchain cepat | Transaksi murah |

### Tips Investasi Kripto untuk Pemula

1. **Mulai kecil** — investasikan hanya yang siap Anda rugikan
2. **Diversifikasi** — jangan taruh semua di satu aset
3. **DYOR** — Do Your Own Research sebelum beli
4. **Pilih platform legal** — gunakan exchange terdaftar Bappebti seperti KriptoAman
5. **Simpan di cold wallet** untuk jumlah besar

### Regulasi Kripto di Indonesia

Di Indonesia, kripto diatur oleh **Bappebti** (Badan Pengawas Perdagangan Berjangka Komoditi) sebagai aset komoditi digital. Selalu gunakan platform yang terdaftar resmi untuk keamanan investasi Anda.
    `
  },
  {
    id: 2, category: 'pemula', level: 'Pemula', readTime: '4 menit',
    title: 'Cara Beli Bitcoin Pertama Kali di Indonesia (2026)',
    summary: 'Langkah demi langkah cara membeli Bitcoin dengan aman menggunakan rupiah melalui bank lokal.',
    content: `
## Cara Beli Bitcoin di Indonesia

Membeli Bitcoin di Indonesia kini sangat mudah! Berikut panduan lengkapnya.

### Langkah 1: Pilih Exchange Resmi

Gunakan exchange yang **terdaftar Bappebti** seperti KriptoAman. Hindari platform tidak jelas yang berisiko scam.

### Langkah 2: Daftar & Verifikasi KYC

\`\`\`
1. Buat akun dengan email aktif
2. Upload foto KTP (pastikan jelas dan tidak blur)
3. Ambil foto selfie memegang KTP
4. Tunggu verifikasi (biasanya 1-24 jam)
\`\`\`

### Langkah 3: Deposit IDR

Transfer dari bank lokal Anda:
- **BCA, BRI, Mandiri, BNI** — transfer bank biasa
- **Saldo langsung aktif** setelah konfirmasi admin

### Langkah 4: Beli Bitcoin

1. Pilih pasangan BTC/IDR
2. Masukkan jumlah yang ingin dibeli
3. Konfirmasi harga & biaya
4. Klik "Beli" — Bitcoin langsung masuk wallet Anda

### Berapa Minimal Beli Bitcoin?

Di KriptoAman, Anda bisa mulai dari **Rp 10.000** saja! Tidak perlu beli 1 BTC utuh.

### Penting: Simpan di Tempat Aman

Setelah beli, pertimbangkan untuk memindahkan ke **hardware wallet** jika jumlahnya besar. "Not your keys, not your coins."
    `
  },

  // Keamanan
  {
    id: 3, category: 'keamanan', level: 'Wajib Baca', readTime: '7 menit',
    title: 'Cara Menghindari Scam & Rugpull Kripto: Panduan Lengkap',
    summary: 'Kenali tanda-tanda penipuan kripto dan cara melindungi aset digital Anda dari rugpull, phishing, dan social engineering.',
    content: `
## Bahaya Scam di Dunia Kripto

Setiap tahun, miliaran dolar aset kripto hilang karena scam. Kenali dan hindari sebelum terlambat!

### 🚨 Jenis-jenis Scam Kripto

#### 1. Rugpull
Developer proyek kabur setelah mengumpulkan dana investor.

**Ciri-cirinya:**
- Tim anonim, tidak ada identitas jelas
- Whitepaper copy-paste / tidak jelas
- Liquidity tidak terkunci
- Janji return tidak masuk akal (100x dalam seminggu)
- Tekanan untuk beli segera ("FOMO marketing")

#### 2. Phishing
Website/email palsu yang meniru platform resmi untuk mencuri password dan private key.

**Tips menghindari:**
- Selalu cek URL dengan teliti (https://)
- Bookmark website exchange resmi Anda
- Jangan klik link dari DM/email tidak dikenal
- Aktifkan 2FA (Two-Factor Authentication)

#### 3. Pump & Dump
Sekelompok orang menaikkan harga koin artifisial lalu menjual saat puncak.

**Cirinya:**
- Harga naik drastis tanpa berita fundamental
- Promosi agresif di Telegram/Discord
- Volume tiba-tiba melonjak sangat tinggi

#### 4. Honeypot Contract
Smart contract yang bisa dibeli tapi tidak bisa dijual.

**Cara cek:** Gunakan tools seperti TokenSniffer atau Honeypot.is sebelum beli token baru.

### ✅ Checklist Keamanan Kripto

- [ ] Gunakan exchange resmi terdaftar Bappebti
- [ ] Aktifkan 2FA di semua akun
- [ ] Jangan share private key / seed phrase ke siapapun
- [ ] Gunakan email khusus untuk kripto
- [ ] Cek kontrak di Etherscan/BSCScan sebelum invest
- [ ] Diversifikasi — jangan all-in satu proyek

### 🔐 Keamanan di KriptoAman

KriptoAman menggunakan:
- **Multi-signature wallet** untuk keamanan dana
- **Deteksi anomali real-time** untuk mencegah akses tidak sah
- **KYC ketat** untuk mencegah penipuan identitas
- **Enkripsi SSL 256-bit** pada semua transaksi
    `
  },
  {
    id: 4, category: 'keamanan', level: 'Intermediate', readTime: '5 menit',
    title: 'Apa Itu Cold Wallet vs Hot Wallet? Mana yang Lebih Aman?',
    summary: 'Pahami perbedaan cold wallet dan hot wallet, kapan menggunakan masing-masing, dan cara menyimpan kripto dengan aman.',
    content: `
## Cold Wallet vs Hot Wallet

Keamanan aset kripto sangat bergantung pada cara Anda menyimpannya.

### Hot Wallet (Dompet Panas)

Hot wallet terhubung ke internet secara terus-menerus.

**Contoh:** Exchange wallet (KriptoAman, Binance), MetaMask, Trust Wallet

**Kelebihan:**
- Mudah diakses kapan saja
- Cocok untuk trading aktif
- Gratis digunakan

**Kekurangan:**
- Rentan terhadap hack jika exchange diretas
- Bergantung pada keamanan platform

### Cold Wallet (Dompet Dingin)

Cold wallet tidak terhubung ke internet — offline sepenuhnya.

**Contoh:** Ledger, Trezor, Paper Wallet

**Kelebihan:**
- Keamanan tertinggi
- Tidak bisa diretas secara online
- Ideal untuk penyimpanan jangka panjang

**Kekurangan:**
- Harga perangkat (Rp 1-3 juta)
- Kurang praktis untuk trading harian
- Jika hilang/rusak tanpa backup = aset hilang

### Rekomendasi Strategi

| Porsi Dana | Simpan di |
|-----------|-----------|
| Trading aktif (< 20%) | Hot wallet / exchange |
| Tabungan jangka menengah (20-50%) | Software wallet (MetaMask) |
| Simpanan jangka panjang (> 50%) | Hardware cold wallet |

### PENTING: Backup Seed Phrase!

Seed phrase adalah 12-24 kata kunci untuk memulihkan wallet Anda. Simpan di:
- Kertas fisik (bukan digital!)
- Tempat aman dari api dan air
- JANGAN foto, screenshot, atau simpan di cloud
    `
  },

  // Trading
  {
    id: 5, category: 'trading', level: 'Intermediate', readTime: '8 menit',
    title: 'Panduan RSI & MACD untuk Trading Kripto Pemula',
    summary: 'Pelajari cara menggunakan indikator RSI dan MACD untuk membaca sinyal beli/jual yang akurat di pasar kripto.',
    content: `
## Indikator Teknikal: RSI & MACD

Analisis teknikal menggunakan indikator matematis untuk memprediksi pergerakan harga.

### RSI (Relative Strength Index)

RSI mengukur kekuatan momentum harga dalam skala **0-100**.

**Cara membaca RSI:**
- **RSI > 70** = Overbought (jenuh beli) → potensi koreksi turun
- **RSI < 30** = Oversold (jenuh jual) → potensi rebound naik
- **RSI = 50** = Netral, tidak ada sinyal kuat

**Contoh strategi sederhana:**
\`\`\`
BUY:  RSI turun ke bawah 30, lalu naik kembali ke atas 30
SELL: RSI naik ke atas 70, lalu turun kembali ke bawah 70
\`\`\`

**Penting:** RSI di pasar bull bisa stuck di >70 lama. Selalu kombinasikan dengan indikator lain!

### MACD (Moving Average Convergence Divergence)

MACD mengukur perbedaan antara dua EMA (Exponential Moving Average).

**Komponen MACD:**
1. **MACD Line** = EMA 12 - EMA 26
2. **Signal Line** = EMA 9 dari MACD Line
3. **Histogram** = selisih MACD dan Signal Line

**Sinyal trading:**
- **Golden Cross** = MACD memotong Signal ke atas → BUY
- **Death Cross** = MACD memotong Signal ke bawah → SELL
- **Histogram positif & membesar** → momentum bullish kuat
- **Histogram negatif & membesar** → momentum bearish kuat

### Kombinasi RSI + MACD

Sinyal terkuat terjadi ketika:
- RSI < 30 DAN MACD golden cross → **Strong BUY**
- RSI > 70 DAN MACD death cross → **Strong SELL**

### Tips Penggunaan

1. Gunakan timeframe lebih tinggi (4H, 1D) untuk sinyal lebih reliable
2. Selalu pasang **stop loss** untuk membatasi kerugian
3. Indikator adalah alat bantu, bukan jaminan profit
4. Latih dulu dengan **paper trading** di KriptoAman sebelum live
    `
  },
  {
    id: 6, category: 'trading', level: 'Intermediate', readTime: '6 menit',
    title: 'Apa Itu Grid Trading Bot? Cara Profit di Pasar Sideways',
    summary: 'Strategi grid trading adalah cara otomatis menghasilkan profit di pasar yang bergerak sideways tanpa perlu prediksi arah.',
    content: `
## Grid Trading Bot: Profit di Segala Kondisi Pasar

Grid trading adalah strategi menempatkan order beli dan jual secara otomatis pada interval harga tertentu, seperti grid (kisi-kisi).

### Cara Kerja Grid Bot

\`\`\`
Contoh: ETH/USDT, harga $2000-$2500, 10 grid

Grid Level  |  Buy Order  |  Sell Order
------------|-------------|-------------
$2500       |    —        |   Jual ETH
$2450       |  Beli ETH   |   Jual ETH
$2400       |  Beli ETH   |   Jual ETH
$2350       |  Beli ETH   |   Jual ETH
$2300       |  Beli ETH   |   Jual ETH
$2000       |  Beli ETH   |    —
\`\`\`

Setiap kali harga naik → jual, harga turun → beli. Profit dari selisih harga di setiap level.

### Kapan Grid Bot Efektif?

✅ **Cocok untuk:**
- Pasar sideways (ranging) — pergerakan dalam range tertentu
- Kripto dengan volatilitas sedang (bukan micro-cap)
- Pasangan stablecoin (BTC/USDT, ETH/USDT)

❌ **Kurang cocok untuk:**
- Tren kuat (bull run atau bear market ekstrem)
- Aset dengan volume rendah
- Periode berita besar (hard fork, regulasi)

### Setup Grid Bot di KriptoAman

1. Pilih **Auto Trading** → Grid Trading Bot
2. Tentukan exchange dan pasangan trading
3. Set range harga atas dan bawah
4. Tentukan jumlah grid (5-20 level)
5. Masukkan modal (USDT)
6. Aktifkan bot!

### Manajemen Risiko Grid Bot

- Set **stop loss** di bawah grid bawah
- Gunakan maksimal **20-30% modal** untuk satu bot
- Monitor performa setiap hari di awal
- Pause bot jika ada berita besar di market
    `
  },

  // DeFi
  {
    id: 7, category: 'defi', level: 'Advanced', readTime: '7 menit',
    title: 'Apa Itu DeFi? Panduan Decentralized Finance untuk Pemula',
    summary: 'DeFi (Decentralized Finance) adalah ekosistem keuangan tanpa bank. Pelajari cara kerja, peluang, dan risikonya.',
    content: `
## DeFi: Keuangan Tanpa Bank

DeFi adalah ekosistem aplikasi keuangan yang berjalan di blockchain tanpa perantara tradisional.

### Produk DeFi Utama

#### 1. DEX (Decentralized Exchange)
Tukar kripto langsung dari wallet tanpa KYC.

**Contoh:** Uniswap (Ethereum), PancakeSwap (BNB), Raydium (Solana)

**Keunggulan:**
- Tidak perlu verifikasi identitas
- Kontrol penuh atas aset
- Akses ke ribuan token baru

**Risiko:**
- Slippage tinggi untuk aset likuiditas rendah
- Smart contract bugs
- Gas fee bisa mahal (terutama Ethereum)

#### 2. Yield Farming & Staking
Tempatkan kripto untuk mendapatkan bunga/reward.

\`\`\`
Contoh Yield:
- Staking ETH di Lido: ~4% APY
- Liquidity provider di Uniswap: 5-50% APY
- Lending di Aave: 2-10% APY
\`\`\`

**Risiko:** Impermanent loss, smart contract hack

#### 3. Lending & Borrowing
Pinjam atau pinjamkan kripto secara permissionless.

**Cara kerja:**
- Deposit ETH sebagai jaminan
- Pinjam USDT hingga 75% nilai jaminan
- Bayar bunga pinjaman

### Risiko DeFi yang Harus Diketahui

1. **Rug pull** — developer kabur dengan liquidity
2. **Smart contract exploit** — bug kode yang dimanfaatkan hacker
3. **Oracle manipulation** — manipulasi harga feed
4. **Impermanent loss** — kerugian saat menjadi liquidity provider

### DeFi di KriptoAman

KriptoAman menyediakan akses DEX terintegrasi dengan keamanan tambahan:
- Smart contract teraudit
- Slippage protection
- Multi-chain support (ETH, BNB, Polygon, Arbitrum)
    `
  },

  // Analisis Teknikal
  {
    id: 8, category: 'analisis', level: 'Intermediate', readTime: '6 menit',
    title: 'Cara Membaca Candlestick: Pola yang Wajib Diketahui Trader',
    summary: 'Candlestick chart adalah bahasa universal trader. Pelajari pola-pola penting yang bisa memprediksi pergerakan harga berikutnya.',
    content: `
## Membaca Candlestick Chart

Candlestick adalah representasi visual pergerakan harga dalam periode waktu tertentu.

### Anatomi Satu Candlestick

\`\`\`
        │  ← Upper Shadow (sumbu atas)
       ┌┴┐
       │ │ ← Body (antara open & close)
       └┬┘
        │  ← Lower Shadow (sumbu bawah)

Hijau/Putih = Bullish (close > open)
Merah/Hitam = Bearish (close < open)
\`\`\`

### Pola Single Candle

| Pola | Makna | Signal |
|------|-------|--------|
| **Doji** | Open = Close (garis) | Ketidakpastian |
| **Hammer** | Body kecil di atas, ekor panjang bawah | Bullish reversal |
| **Shooting Star** | Body kecil di bawah, ekor panjang atas | Bearish reversal |
| **Marubozu** | Body penuh, tanpa ekor | Momentum kuat |

### Pola Dua Candle

**Bullish Engulfing:**
- Candle merah kecil, diikuti candle hijau besar yang "menelan" candle sebelumnya
- Signal: pembalikan bullish

**Bearish Engulfing:**
- Candle hijau kecil, diikuti candle merah besar
- Signal: pembalikan bearish

### Pola Tiga Candle

**Morning Star (Bullish):**
1. Candle merah panjang
2. Candle kecil (doji/spinning top) — gap down
3. Candle hijau panjang — konfirmasi pembalikan naik

**Evening Star (Bearish):**
Kebalikan dari Morning Star — konfirmasi pembalikan turun

### Tips Praktis

- Konfirmasi pola dengan **volume** — pola tanpa volume seringkali palsu
- Pola lebih valid di **timeframe tinggi** (4H, 1D, 1W)
- Selalu tunggu **candle konfirmasi** sebelum entry
- Kombinasikan dengan **support/resistance** untuk setup terbaik
    `
  },
];

function ArticleModal({ article, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              article.level === 'Pemula' ? 'bg-green-400/10 text-green-400' :
              article.level === 'Wajib Baca' ? 'bg-red-400/10 text-red-400' :
              article.level === 'Advanced' ? 'bg-purple-400/10 text-purple-400' :
              'bg-blue-400/10 text-blue-400'
            }`}>{article.level}</span>
            <div className="flex items-center gap-1 mt-1 text-slate-500 text-xs">
              <Clock className="w-3 h-3" /> {article.readTime}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl font-bold px-2">✕</button>
        </div>
        <div className="overflow-y-auto p-4 flex-1">
          <h2 className="text-lg font-bold text-white mb-4">{article.title}</h2>
          <div className="prose prose-invert prose-sm max-w-none text-slate-300 text-sm leading-relaxed
            [&>h2]:text-white [&>h2]:font-bold [&>h2]:text-base [&>h2]:mt-5 [&>h2]:mb-2
            [&>h3]:text-cyan-300 [&>h3]:font-semibold [&>h3]:text-sm [&>h3]:mt-4 [&>h3]:mb-1.5
            [&>h4]:text-slate-200 [&>h4]:font-semibold [&>h4]:text-sm [&>h4]:mt-3 [&>h4]:mb-1
            [&>p]:mb-3 [&>ul]:mb-3 [&>ul>li]:ml-4 [&>ul>li]:list-disc
            [&>ol]:mb-3 [&>ol>li]:ml-4 [&>ol>li]:list-decimal
            [&>pre]:bg-slate-800 [&>pre]:p-3 [&>pre]:rounded-xl [&>pre]:overflow-x-auto [&>pre]:text-xs
            [&>code]:bg-slate-800 [&>code]:px-1 [&>code]:rounded
            [&>table]:w-full [&>table]:text-xs [&>table>thead>tr>th]:bg-slate-800 [&>table>thead>tr>th]:px-2 [&>table>thead>tr>th]:py-1.5 [&>table>tbody>tr>td]:border-b [&>table>tbody>tr>td]:border-slate-800 [&>table>tbody>tr>td]:px-2 [&>table>tbody>tr>td]:py-1.5
            [&>blockquote]:border-l-4 [&>blockquote]:border-cyan-500 [&>blockquote]:pl-4 [&>blockquote]:text-slate-400">
            {article.content.trim().split('\n').map((line, i) => {
              if (line.startsWith('## ')) return <h2 key={i}>{line.replace('## ', '')}</h2>;
              if (line.startsWith('### ')) return <h3 key={i}>{line.replace('### ', '')}</h3>;
              if (line.startsWith('#### ')) return <h4 key={i}>{line.replace('#### ', '')}</h4>;
              if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold text-white">{line.replace(/\*\*/g, '')}</p>;
              if (line.startsWith('- ') || line.startsWith('✅') || line.startsWith('❌') || line.startsWith('- [ ]')) {
                return <div key={i} className="flex gap-2 mb-1 text-xs"><span className="text-slate-500 shrink-0">•</span><span dangerouslySetInnerHTML={{ __html: line.replace(/^[-✅❌] /, '').replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }} /></div>;
              }
              if (line.match(/^\d\./)) return <div key={i} className="mb-1 text-xs" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }} />;
              if (line.trim() === '') return <div key={i} className="h-2" />;
              if (line.startsWith('```') || line.startsWith('|')) return <pre key={i} className="bg-slate-800 p-3 rounded-xl overflow-x-auto text-xs font-mono text-slate-300 my-2">{line.replace(/```/g, '')}</pre>;
              return <p key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>').replace(/`(.*?)`/g, '<code class="bg-slate-800 px-1 rounded text-cyan-300">$1</code>') }} />;
            })}
          </div>
        </div>
        <div className="p-4 border-t border-slate-800">
          <Link to={createPageUrl('Home')}
            className="block w-full text-center py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-colors text-sm">
            Mulai Praktek di KriptoAman
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Edukasi() {
  const [activeCategory, setActiveCategory] = useState('semua');
  const [selectedArticle, setSelectedArticle] = useState(null);

  const filtered = activeCategory === 'semua' ? ARTICLES : ARTICLES.filter(a => a.category === activeCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white pb-8">
      <div className="max-w-2xl mx-auto px-4 pt-6">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 rounded-full mb-3">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span className="text-indigo-300 text-sm font-semibold">KriptoAman Academy</span>
          </div>
          <h1 className="text-2xl font-extrabold mb-2">Edukasi Kripto<br /><span className="text-cyan-400">Gratis & Terpercaya</span></h1>
          <p className="text-slate-400 text-sm">Dari pemula hingga advanced — pelajari kripto dengan benar sebelum investasi.</p>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
          <button onClick={() => setActiveCategory('semua')}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-colors ${activeCategory === 'semua' ? 'bg-white text-slate-950' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
            Semua
          </button>
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${activeCategory === cat.id ? `${cat.bg} ${cat.color}` : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
              <cat.icon className="w-3 h-3" />
              {cat.label}
            </button>
          ))}
        </div>

        {/* Articles Grid */}
        <div className="space-y-3">
          {filtered.map(article => {
            const cat = CATEGORIES.find(c => c.id === article.category);
            return (
              <button key={article.id} onClick={() => setSelectedArticle(article)}
                className="w-full text-left bg-slate-800/40 border border-slate-700/40 hover:border-slate-600/60 rounded-2xl p-4 transition-all group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cat?.bg} ${cat?.color}`}>
                        {cat?.label}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        article.level === 'Pemula' ? 'bg-green-400/10 text-green-400' :
                        article.level === 'Wajib Baca' ? 'bg-red-400/10 text-red-400' :
                        article.level === 'Advanced' ? 'bg-purple-400/10 text-purple-400' :
                        'bg-blue-400/10 text-blue-400'
                      }`}>{article.level}</span>
                      <span className="text-slate-500 text-[10px] flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />{article.readTime}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-white leading-snug group-hover:text-cyan-300 transition-colors mb-1">
                      {article.title}
                    </h3>
                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">{article.summary}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors mt-1 shrink-0" />
                </div>
              </button>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-8 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-cyan-500/20 rounded-2xl p-5 text-center">
          <div className="text-lg font-bold mb-1">Siap Praktek?</div>
          <p className="text-slate-400 text-xs mb-4">Mulai dengan paper trading dulu — gratis, tanpa risiko uang nyata!</p>
          <Link to={createPageUrl('AutoTrading')}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-colors text-sm">
            Coba Paper Trading <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

      </div>

      {/* Article Modal */}
      {selectedArticle && (
        <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
      )}

      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </div>
  );
}