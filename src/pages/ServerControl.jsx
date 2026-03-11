import React, { useState } from 'react';
import AdminGuard, { OWNER_EMAIL } from '../components/security/AdminGuard';
import { Server, Cloud, Shield, Key, Lock, AlertTriangle, CheckCircle2, ExternalLink, Copy, CheckCheck, ChevronDown, ChevronRight, Terminal, User, Globe, Database, AtSign } from 'lucide-react';

const OWNER = {
  name: 'Rahmanraden',
  email: 'rahmanraden027@gmail.com',
};

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="ml-1 p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-white transition-colors inline-flex">
      {copied ? <CheckCheck className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function CodeBlock({ code }) {
  return (
    <div className="bg-slate-950 border border-slate-700 rounded-xl p-3 my-2 flex items-start gap-2">
      <Terminal className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
      <code className="text-green-300 text-xs font-mono break-all flex-1 whitespace-pre-wrap">{code}</code>
      <CopyBtn text={code} />
    </div>
  );
}

function Accordion({ title, icon: Icon, color = 'blue', badge, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border border-${color}-500/25 rounded-2xl overflow-hidden`}>
      <button onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between p-5 bg-${color}-500/5 hover:bg-${color}-500/10 transition-colors`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl bg-${color}-500/15 border border-${color}-500/30 flex items-center justify-center`}>
            <Icon className={`w-5 h-5 text-${color}-400`} />
          </div>
          <div className="text-left">
            <p className="text-white font-bold">{title}</p>
            {badge && <p className={`text-${color}-400 text-xs`}>{badge}</p>}
          </div>
        </div>
        {open ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
      </button>
      {open && <div className="p-5 border-t border-slate-700/40 space-y-4">{children}</div>}
    </div>
  );
}

function Rule({ ok, text }) {
  return (
    <div className={`flex items-start gap-3 px-3 py-2.5 rounded-xl text-xs ${ok ? 'bg-green-500/5 border border-green-500/15 text-green-200' : 'bg-red-500/5 border border-red-500/15 text-red-300'}`}>
      {ok ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
      {text}
    </div>
  );
}

export default function ServerControl() {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pb-28">
        <div className="max-w-2xl mx-auto space-y-5">

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
              <Server className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Server Infrastructure Control</h1>
              <p className="text-slate-500 text-xs">Akses eksklusif atas nama: <span className="text-indigo-400 font-semibold">{OWNER.name}</span></p>
            </div>
          </div>

          {/* Owner Lock Banner */}
          <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-4 flex items-start gap-3">
            <Lock className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-indigo-300 font-bold text-sm">Kontrol Server Eksklusif</p>
              <p className="text-slate-400 text-xs mt-1">
                Semua akun cloud (DO, AWS, GCP) harus didaftarkan dengan email <span className="text-white font-mono">{OWNER.email}</span> dan kartu kredit/rekening Anda sendiri. Root access / IAM admin hanya untuk Anda.
              </p>
            </div>
          </div>

          {/* ── DIGITALOCEAN ─────────────────────────────────────────────── */}
          <Accordion title="DigitalOcean" icon={Cloud} color="blue" badge="Droplets · Kubernetes · Spaces · Firewall">
            <div className="space-y-3">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">1. Setup Akun (atas nama Anda)</p>
              <div className="space-y-1.5">
                <Rule ok text={`Daftar di cloud.digitalocean.com dengan email: ${OWNER.email}`} />
                <Rule ok text="Payment method: kartu kredit/PayPal atas nama Anda" />
                <Rule ok text="Aktifkan 2FA (Authenticator App) — jangan SMS" />
                <Rule ok text="Account Name / Company: Rahmanraden / KriptoAman" />
              </div>

              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-4">2. SSH Key — Hanya Anda yang Pegang</p>
              <CodeBlock code={`# Generate SSH key di komputer Anda
ssh-keygen -t ed25519 -C "${OWNER.email}" -f ~/.ssh/kriptoaman_do

# Lihat public key (ini yang diupload ke DO)
cat ~/.ssh/kriptoaman_do.pub

# Private key JANGAN di-share ke siapapun
# Backup: ~/.ssh/kriptoaman_do`} />

              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-4">3. Firewall Rules (UFW)</p>
              <CodeBlock code={`# Di server Droplet Anda:
ufw default deny incoming
ufw default allow outgoing
ufw allow from YOUR_HOME_IP to any port 22  # SSH hanya dari IP Anda
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable

# Ganti YOUR_HOME_IP dengan IP publik Anda
curl ifconfig.me`} />

              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-4">4. Team Access — Jangan Beri Root</p>
              <div className="space-y-1.5">
                <Rule ok text="Pergi ke Settings → Team → Invite Members" />
                <Rule ok text="Beri role 'Billing' atau 'Member' saja — BUKAN Owner" />
                <Rule ok text="Jangan pernah share root password Droplet ke orang lain" />
                <Rule text="JANGAN aktifkan root login via password di SSH" />
              </div>

              <a href="https://cloud.digitalocean.com" target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-blue-400 text-xs hover:underline mt-2">
                <ExternalLink className="w-3.5 h-3.5" /> Buka DigitalOcean Dashboard
              </a>
            </div>
          </Accordion>

          {/* ── AWS ──────────────────────────────────────────────────────── */}
          <Accordion title="Amazon Web Services (AWS)" icon={Cloud} color="orange" badge="EC2 · S3 · RDS · Lambda · IAM">
            <div className="space-y-3">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">1. Root Account — HANYA Anda</p>
              <div className="space-y-1.5">
                <Rule ok text={`Root email: ${OWNER.email} — TIDAK BOLEH diganti`} />
                <Rule ok text="Aktifkan MFA di root account (hardware key atau Authenticator)" />
                <Rule ok text="Payment: kartu kredit atas nama Anda" />
                <Rule ok text="Simpan root password di password manager Anda" />
                <Rule text="JANGAN gunakan root account untuk operasi sehari-hari" />
              </div>

              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-4">2. IAM — Buat Admin User Terpisah</p>
              <CodeBlock code={`# Buat IAM user untuk diri sendiri (jangan pakai root)
# AWS Console → IAM → Users → Create User

Username: rahmanraden-admin
Access type: Programmatic + Console
Permissions: AdministratorAccess (hanya untuk Anda)

# Aktifkan MFA di IAM user ini juga`} />

              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-4">3. IAM Policy — Blokir Akses Orang Lain</p>
              <CodeBlock code={`{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Deny",
    "Action": "*",
    "Resource": "*",
    "Condition": {
      "StringNotEquals": {
        "aws:PrincipalTag/Owner": "rahmanraden"
      },
      "Bool": {
        "aws:MultiFactorAuthPresent": "false"
      }
    }
  }]
}`} />

              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-4">4. CloudTrail — Audit Semua Akses</p>
              <div className="space-y-1.5">
                <Rule ok text="Aktifkan CloudTrail di semua region" />
                <Rule ok text="Log ke S3 bucket private yang hanya Anda bisa akses" />
                <Rule ok text="Setup CloudWatch Alert jika ada login dari IP asing" />
                <Rule ok text="Enable AWS GuardDuty untuk deteksi ancaman otomatis" />
              </div>

              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-4">5. EC2 Key Pair — Hanya Anda yang Pegang</p>
              <CodeBlock code={`# Download .pem file saat create EC2
# Simpan di: ~/.ssh/kriptoaman-aws.pem
chmod 400 ~/.ssh/kriptoaman-aws.pem

# SSH ke EC2:
ssh -i ~/.ssh/kriptoaman-aws.pem ubuntu@YOUR_EC2_IP

# JANGAN upload .pem ke GitHub/cloud storage!`} />

              <a href="https://console.aws.amazon.com" target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-orange-400 text-xs hover:underline mt-2">
                <ExternalLink className="w-3.5 h-3.5" /> Buka AWS Console
              </a>
            </div>
          </Accordion>

          {/* ── GOOGLE CLOUD ─────────────────────────────────────────────── */}
          <Accordion title="Google Cloud Platform (GCP)" icon={Cloud} color="green" badge="Compute Engine · Cloud Run · GKE · IAM">
            <div className="space-y-3">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">1. GCP Account — Atas Nama Anda</p>
              <div className="space-y-1.5">
                <Rule ok text={`Login dengan Google Account Anda: ${OWNER.email}`} />
                <Rule ok text="Billing account: kartu kredit atas nama Anda" />
                <Rule ok text="Organization / Project Owner: Rahmanraden" />
                <Rule ok text="Aktifkan 2-Step Verification di Google Account" />
              </div>

              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-4">2. IAM Roles — Kontrol Ketat</p>
              <CodeBlock code={`# Di GCP Console → IAM & Admin → IAM
# Tambah Principal (hanya Anda):
# Member: rahmanraden027@gmail.com
# Role: Owner

# Untuk tim (jika perlu):
# Role: Viewer atau Editor SAJA — bukan Owner
# Prinsip: Least Privilege

# CLI untuk cek siapa yang punya akses:
gcloud projects get-iam-policy YOUR_PROJECT_ID`} />

              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-4">3. Service Account — Jangan Bocorkan Key</p>
              <CodeBlock code={`# Buat service account untuk aplikasi:
gcloud iam service-accounts create kriptoaman-app \\
  --display-name="KriptoAman App"

# Beri role minimal yang dibutuhkan:
gcloud projects add-iam-policy-binding YOUR_PROJECT \\
  --member="serviceAccount:kriptoaman-app@PROJECT.iam.gserviceaccount.com" \\
  --role="roles/run.invoker"

# Download key (simpan aman, jangan commit ke git!):
gcloud iam service-accounts keys create key.json \\
  --iam-account=kriptoaman-app@PROJECT.iam.gserviceaccount.com`} />

              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-4">4. VPC Firewall — Blokir Akses Tidak Sah</p>
              <CodeBlock code={`# Izinkan SSH hanya dari IP Anda:
gcloud compute firewall-rules create allow-ssh-owner \\
  --direction=INGRESS \\
  --priority=1000 \\
  --network=default \\
  --action=ALLOW \\
  --rules=tcp:22 \\
  --source-ranges=YOUR_HOME_IP/32

# Hapus rule SSH default yang terbuka lebar:
gcloud compute firewall-rules delete default-allow-ssh`} />

              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-4">5. Audit Log & Alerts</p>
              <div className="space-y-1.5">
                <Rule ok text="Aktifkan Cloud Audit Logs di semua services" />
                <Rule ok text="Setup Budget Alert agar dapat notifikasi jika ada usage tidak wajar" />
                <Rule ok text="Aktifkan Security Command Center" />
                <Rule ok text="Setup log sink ke Cloud Storage untuk audit trail jangka panjang" />
              </div>

              <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-green-400 text-xs hover:underline mt-2">
                <ExternalLink className="w-3.5 h-3.5" /> Buka Google Cloud Console
              </a>
            </div>
          </Accordion>

          {/* ── ROOT ACCESS EKSKLUSIF ────────────────────────────────────── */}
          <div className="bg-red-500/5 border border-red-500/30 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-red-400" />
              <h2 className="text-red-300 font-bold">Root Access — Hanya Anda (Rahmanraden)</h2>
            </div>
            <div className="space-y-3">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-200">
                ⚠️ <strong>Root = Kekuasaan Penuh.</strong> Siapa yang punya root access bisa hapus semua data, install malware, atau redirect traffic. HANYA Anda yang boleh memilikinya.
              </div>

              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Setup Root Password Sendiri (Pertama Kali Login)</p>
              <CodeBlock code={`# Login pertama kali ke server (via console provider):
sudo passwd root
# Masukkan password kuat — HANYA Anda yang tahu

# Cek user yang punya sudo/root:
cat /etc/sudoers
getent group sudo

# Hapus akses sudo dari user lain (ganti 'otheruser'):
sudo deluser otheruser sudo
sudo usermod -L otheruser   # Lock login user tersebut`} />

              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Buat User Khusus Anda (Jangan Pakai Root Sehari-hari)</p>
              <CodeBlock code={`# Buat user atas nama Anda:
adduser rahmanraden
usermod -aG sudo rahmanraden

# Pindah ke user Anda:
su - rahmanraden

# Verifikasi akses sudo:
sudo whoami   # harus jawab: root`} />

              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Kunci Root Login via SSH</p>
              <CodeBlock code={`# Edit config SSH:
sudo nano /etc/ssh/sshd_config

# Ubah baris ini:
PermitRootLogin no          # ← WAJIB: matikan root login langsung
AllowUsers rahmanraden      # ← hanya user Anda
PasswordAuthentication no   # ← wajib pakai SSH key

# Simpan & restart:
sudo systemctl restart sshd`} />

              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Cek & Monitor Siapa yang Punya Root</p>
              <CodeBlock code={`# Cek semua user dengan UID 0 (root level):
awk -F: '($3 == "0") {print}' /etc/passwd

# Cek riwayat login root:
last root
lastlog

# Cek proses yang berjalan sebagai root:
ps aux | grep root

# Monitor login real-time:
tail -f /var/log/auth.log`} />
            </div>
          </div>

          {/* ── SSH KEY GENERATOR GUIDE ──────────────────────────────────── */}
          <div className="bg-purple-500/5 border border-purple-500/30 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-purple-400" />
              <h2 className="text-purple-300 font-bold">SSH Key Milik Anda Sendiri — Setup Lengkap</h2>
            </div>
            <div className="space-y-3">
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-xs text-purple-200">
                🔑 SSH key = kunci fisik server Anda. Private key (<code>.pem / id_ed25519</code>) = jangan pernah bocor. Public key = aman untuk di-share ke server.
              </div>

              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Langkah 1: Generate SSH Key di Komputer Anda</p>
              <CodeBlock code={`# Windows (PowerShell / WSL) / Mac / Linux:
ssh-keygen -t ed25519 -C "rahmanraden027@gmail.com" -f ~/.ssh/kriptoaman_main

# Akan ada 2 file:
# ~/.ssh/kriptoaman_main      ← PRIVATE KEY (jangan bocor!)
# ~/.ssh/kriptoaman_main.pub  ← PUBLIC KEY (upload ke server)

# Set permission ketat:
chmod 600 ~/.ssh/kriptoaman_main
chmod 644 ~/.ssh/kriptoaman_main.pub`} />

              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Langkah 2: Copy Public Key ke Server</p>
              <CodeBlock code={`# Cara otomatis:
ssh-copy-id -i ~/.ssh/kriptoaman_main.pub rahmanraden@YOUR_SERVER_IP

# Cara manual (jika ssh-copy-id tidak ada):
cat ~/.ssh/kriptoaman_main.pub
# Copy outputnya, lalu di server:
echo "PASTE_PUBLIC_KEY_DISINI" >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys`} />

              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Langkah 3: Test Koneksi SSH</p>
              <CodeBlock code={`# Koneksi dengan key Anda:
ssh -i ~/.ssh/kriptoaman_main rahmanraden@YOUR_SERVER_IP

# Buat shortcut di ~/.ssh/config (Windows: C:\\Users\\Anda\\.ssh\\config):
Host kriptoaman-do
  HostName YOUR_DO_IP
  User rahmanraden
  IdentityFile ~/.ssh/kriptoaman_main

Host kriptoaman-aws
  HostName YOUR_AWS_IP
  User ubuntu
  IdentityFile ~/.ssh/kriptoaman_main

# Setelah config di atas, cukup:
ssh kriptoaman-do
ssh kriptoaman-aws`} />

              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Langkah 4: Backup Private Key (Wajib!)</p>
              <div className="space-y-1.5">
                <Rule ok text="Copy ~/.ssh/kriptoaman_main ke USB flash drive terenkripsi" />
                <Rule ok text="Simpan di lokasi fisik aman (brankas / laci terkunci)" />
                <Rule ok text="Buat backup ke 2 lokasi berbeda (rumah & kantor)" />
                <Rule text="JANGAN upload ke Google Drive / Dropbox / iCloud" />
                <Rule text="JANGAN kirim via WhatsApp / Telegram / Email" />
                <Rule text="JANGAN simpan di repo GitHub / GitLab manapun" />
              </div>

              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Langkah 5: Tambah Passphrase (Lapisan Extra)</p>
              <CodeBlock code={`# Tambah passphrase ke SSH key yang sudah ada:
ssh-keygen -p -f ~/.ssh/kriptoaman_main

# Gunakan ssh-agent agar tidak perlu ketik passphrase terus:
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/kriptoaman_main`} />
            </div>
          </div>

          {/* ── UNIVERSAL SECURITY RULES ─────────────────────────────────── */}
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-yellow-400" />
              <h2 className="text-yellow-300 font-bold">Aturan Universal — Semua Cloud Provider</h2>
            </div>
            <div className="space-y-2">
              {[
                [true, 'Daftar & bayar menggunakan identitas & rekening Anda sendiri'],
                [true, 'Root/Owner access HANYA untuk email Anda: ' + OWNER.email],
                [true, 'Aktifkan MFA / 2FA di semua akun (bukan via SMS)'],
                [true, 'SSH key pair disimpan di komputer Anda — private key TIDAK di-share'],
                [true, 'Firewall: izinkan SSH hanya dari IP rumah/kantor Anda'],
                [true, 'Aktifkan billing alert untuk deteksi pemakaian tidak wajar'],
                [true, 'Aktifkan audit logging di semua provider'],
                [false, 'JANGAN pernah share root password ke developer/tim manapun'],
                [false, 'JANGAN simpan credentials di GitHub / chat / email plaintext'],
                [false, 'JANGAN beri akses Owner/Admin ke orang lain — gunakan least privilege'],
                [false, 'JANGAN aktifkan password login SSH — gunakan key only'],
                [false, 'JANGAN simpan .pem / .json key di folder yang di-sync cloud otomatis'],
              ].map(([ok, text], i) => <Rule key={i} ok={ok} text={text} />)}
            </div>
          </div>

          {/* ── SSH HARDENING ─────────────────────────────────────────────── */}
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Terminal className="w-5 h-5 text-purple-400" />
              <h2 className="text-purple-300 font-bold">SSH Server Hardening (Semua Cloud)</h2>
            </div>
            <CodeBlock code={`# Edit /etc/ssh/sshd_config di server Anda:
PermitRootLogin no           # Tidak boleh login sebagai root
PasswordAuthentication no    # Hanya SSH key, no password
PubkeyAuthentication yes
AllowUsers rahmanraden       # Hanya user Anda
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2

# Restart SSH:
systemctl restart sshd

# Cek siapa yang sedang login:
who
last | head -20`} />
          </div>

          {/* ── DOMAIN REGISTRATION ──────────────────────────────────────── */}
          <div className="bg-cyan-500/5 border border-cyan-500/30 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <AtSign className="w-5 h-5 text-cyan-400" />
              <h2 className="text-cyan-300 font-bold">Domain — Terdaftar Atas Nama Anda</h2>
            </div>
            <div className="space-y-3">
              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3 text-xs text-cyan-200">
                🌐 Domain adalah identitas digital platform Anda. Jika domain tidak atas nama Anda, orang lain bisa mengambil alih atau memperbarui tanpa izin Anda.
              </div>

              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Data Registrasi Domain (Wajib Atas Nama Anda)</p>
              <div className="bg-slate-900/60 rounded-xl p-4 space-y-2 text-xs font-mono">
                {[
                  ['Registrant Name', 'Rahmanraden'],
                  ['Registrant Email', OWNER.email],
                  ['Registrant Organization', 'KriptoAman'],
                  ['Admin Contact', OWNER.email],
                  ['Tech Contact', OWNER.email],
                  ['Billing Contact', OWNER.email],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2">
                    <span className="text-slate-500">{k}:</span>
                    <span className="text-white">{v}</span>
                  </div>
                ))}
              </div>

              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Registrar Terpercaya (Domain Milik Anda)</p>
              <div className="space-y-1.5">
                <Rule ok text="Namecheap / GoDaddy / Cloudflare Registrar — daftar dengan email Anda" />
                <Rule ok text="Aktifkan Domain Lock (EPP Lock) agar tidak bisa transfer tanpa izin Anda" />
                <Rule ok text="Aktifkan WHOIS Privacy Protection (sembunyikan data pribadi dari publik)" />
                <Rule ok text="Aktifkan 2FA di akun registrar Anda" />
                <Rule ok text="Auto-renew ON + kartu kredit atas nama Anda" />
                <Rule text="JANGAN biarkan orang lain daftarkan domain atas nama mereka untuk Anda" />
                <Rule text="JANGAN transfer domain ke akun yang bukan milik Anda" />
              </div>

              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Cek WHOIS — Verifikasi Domain Atas Nama Anda</p>
              <CodeBlock code={`# Cek siapa pemilik domain via terminal:
whois kriptoaman.com

# Atau gunakan website:
# https://www.whois.com/whois/kriptoaman.com
# https://lookup.icann.org

# Pastikan Registrant Name = Rahmanraden
# Pastikan Registrant Email = rahmanraden027@gmail.com`} />

              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">DNS Control — Hanya Anda yang Bisa Edit</p>
              <CodeBlock code={`# Gunakan Cloudflare DNS (gratis, cepat, aman):
# 1. Daftar di cloudflare.com dengan email Anda
# 2. Add site → masukkan domain Anda
# 3. Ganti nameserver di registrar ke Cloudflare NS

# Contoh DNS records untuk KriptoAman:
# Type  Name    Value              TTL
# A     @       YOUR_SERVER_IP     Auto
# A     www     YOUR_SERVER_IP     Auto
# CNAME api     kriptoaman.com     Auto
# MX    @       mail.kriptoaman    Auto

# Aktifkan:
# - Proxy (orange cloud) untuk DDoS protection
# - SSL/TLS: Full (strict)
# - Always Use HTTPS: ON
# - HSTS: ON`} />

              <div className="flex flex-wrap gap-2 mt-1">
                {[
                  ['Cloudflare', 'https://dash.cloudflare.com'],
                  ['Namecheap', 'https://www.namecheap.com'],
                  ['WHOIS Lookup', 'https://lookup.icann.org'],
                ].map(([label, url]) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 text-xs transition-colors">
                    <ExternalLink className="w-3 h-3" /> {label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* ── DATABASE CONTROL ─────────────────────────────────────────── */}
          <div className="bg-yellow-500/5 border border-yellow-500/30 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-yellow-400" />
              <h2 className="text-yellow-300 font-bold">Database Control — MySQL & PostgreSQL</h2>
            </div>
            <div className="space-y-4">
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-xs text-yellow-200">
                🗄️ Database = semua data user & transaksi. Root DB user hanya untuk Anda. App harus pakai user terpisah dengan privilege minimal.
              </div>

              {/* MySQL */}
              <div>
                <p className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">── MySQL ──────────────────────────</p>

                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Install & Amankan MySQL</p>
                <CodeBlock code={`# Install MySQL:
sudo apt update && sudo apt install mysql-server -y

# Jalankan wizard keamanan (WAJIB):
sudo mysql_secure_installation
# Jawab: Y Y Y Y Y
# Set root password yang kuat — HANYA Anda tahu

# Login sebagai root:
sudo mysql -u root -p`} />

                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-3">Buat Database & User untuk Aplikasi</p>
                <CodeBlock code={`-- Di MySQL shell:
-- Buat database KriptoAman:
CREATE DATABASE kriptoaman_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Buat user aplikasi (BUKAN root):
CREATE USER 'kriptoaman_app'@'localhost' IDENTIFIED BY 'PASSWORD_KUAT_DISINI';

-- Beri privilege hanya untuk DB ini:
GRANT SELECT, INSERT, UPDATE, DELETE ON kriptoaman_db.* TO 'kriptoaman_app'@'localhost';
FLUSH PRIVILEGES;

-- Cek user yang ada:
SELECT user, host FROM mysql.user;

-- Pastikan root HANYA bisa login dari localhost:
SELECT user, host FROM mysql.user WHERE user='root';`} />

                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-3">Kunci Akses Remote MySQL</p>
                <CodeBlock code={`# Edit konfigurasi MySQL:
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# Pastikan baris ini ada (bind ke localhost saja):
bind-address = 127.0.0.1
# (Hapus atau comment jika ada: bind-address = 0.0.0.0)

# Restart MySQL:
sudo systemctl restart mysql

# Backup database (jalankan rutin):
mysqldump -u root -p kriptoaman_db > backup_$(date +%Y%m%d).sql`} />
              </div>

              {/* PostgreSQL */}
              <div>
                <p className="text-green-400 text-xs font-bold uppercase tracking-wider mb-2">── PostgreSQL ──────────────────────</p>

                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Install & Amankan PostgreSQL</p>
                <CodeBlock code={`# Install PostgreSQL:
sudo apt update && sudo apt install postgresql postgresql-contrib -y

# Login sebagai postgres superuser:
sudo -i -u postgres psql

# Set password untuk postgres user:
\\password postgres
# Masukkan password kuat — HANYA Anda tahu`} />

                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-3">Buat Database & User untuk Aplikasi</p>
                <CodeBlock code={`-- Di PostgreSQL shell (sudo -i -u postgres psql):

-- Buat database:
CREATE DATABASE kriptoaman_db;

-- Buat user aplikasi (bukan superuser):
CREATE USER kriptoaman_app WITH ENCRYPTED PASSWORD 'PASSWORD_KUAT_DISINI';

-- Beri privilege:
GRANT ALL PRIVILEGES ON DATABASE kriptoaman_db TO kriptoaman_app;

-- Batasi: tidak bisa create database atau role baru:
ALTER USER kriptoaman_app NOCREATEDB NOCREATEROLE;

-- Cek semua user:
\\du

-- Cek semua database:
\\l`} />

                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-3">Kunci Akses Remote PostgreSQL</p>
                <CodeBlock code={`# Edit pg_hba.conf (autentikasi):
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Pastikan hanya localhost yang bisa connect:
# TYPE  DATABASE  USER            ADDRESS    METHOD
local   all       postgres                   peer
local   all       all                        md5
host    all       all             127.0.0.1/32  md5
# Hapus/comment baris yang allow 0.0.0.0/0

# Edit postgresql.conf:
sudo nano /etc/postgresql/*/main/postgresql.conf
# listen_addresses = 'localhost'   ← pastikan ini

# Restart:
sudo systemctl restart postgresql

# Backup database:
pg_dump -U postgres kriptoaman_db > backup_$(date +%Y%m%d).sql`} />
              </div>

              {/* DB Security Rules */}
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Aturan Keamanan Database</p>
                <div className="space-y-1.5">
                  <Rule ok text="Root/superuser DB — password kuat, hanya Anda yang tahu" />
                  <Rule ok text="App hanya pakai user terpisah dengan privilege minimal (SELECT/INSERT/UPDATE/DELETE)" />
                  <Rule ok text="Database bind ke 127.0.0.1 — tidak bisa diakses dari internet langsung" />
                  <Rule ok text="Backup otomatis harian, simpan di storage terpisah (S3/DO Spaces)" />
                  <Rule ok text="Enkripsi backup file sebelum upload ke cloud" />
                  <Rule ok text="Aktifkan slow query log untuk deteksi query mencurigakan" />
                  <Rule text="JANGAN expose port 3306 (MySQL) atau 5432 (PostgreSQL) ke internet" />
                  <Rule text="JANGAN pakai password yang sama untuk DB dan SSH" />
                  <Rule text="JANGAN simpan DB credentials di kode / repo GitHub" />
                  <Rule text="JANGAN beri akses superuser ke developer" />
                </div>
              </div>

              {/* Connection String Example */}
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Connection String (Simpan di .env — Jangan di Git)</p>
                <CodeBlock code={`# .env file di server Anda (chmod 600 .env):

# MySQL:
DATABASE_URL=mysql://kriptoaman_app:PASSWORD@127.0.0.1:3306/kriptoaman_db

# PostgreSQL:
DATABASE_URL=postgresql://kriptoaman_app:PASSWORD@127.0.0.1:5432/kriptoaman_db

# Tambahkan .env ke .gitignore:
echo ".env" >> .gitignore`} />
              </div>
            </div>
          </div>

          {/* ── GOOGLE PLAY CONSOLE ──────────────────────────────────────── */}
          <Accordion title="Google Play Console" icon={Cloud} color="green" badge="Android Developer Account — Atas Nama Anda">
            <div className="space-y-3">
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-xs text-green-200">
                📱 Akun Google Play Console adalah milik Anda selamanya. Daftarkan dengan akun Google pribadi Anda, bukan akun tim atau orang lain.
              </div>

              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Langkah 1: Siapkan Google Account Anda</p>
              <div className="space-y-1.5">
                <Rule ok text={`Gunakan Google Account: ${OWNER.email}`} />
                <Rule ok text="Aktifkan 2-Step Verification di Google Account Anda" />
                <Rule ok text="Pastikan nama di Google Account = nama asli Anda (Rahmanraden)" />
              </div>

              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Langkah 2: Daftar Akun Developer</p>
              <div className="bg-slate-900/60 rounded-xl p-4 space-y-2 text-xs">
                <p className="text-slate-300">Buka: <a href="https://play.google.com/console/signup" target="_blank" rel="noreferrer" className="text-green-400 underline">play.google.com/console/signup</a></p>
                <div className="space-y-1.5 mt-2">
                  <Rule ok text="Account type: Pilih 'Organization' (untuk bisnis) atau 'Individual'" />
                  <Rule ok text="Developer name: KriptoAman (nama yang tampil di Play Store)" />
                  <Rule ok text="Contact name: Rahmanraden" />
                  <Rule ok text={`Contact email: ${OWNER.email}`} />
                  <Rule ok text="Payment: kartu kredit atas nama Anda — biaya $25 USD (sekali seumur hidup)" />
                  <Rule ok text="Alamat: isi dengan alamat Anda yang valid" />
                </div>
              </div>

              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Langkah 3: Verifikasi Identitas (Wajib sejak 2023)</p>
              <div className="space-y-1.5">
                <Rule ok text="Upload KTP / Paspor atas nama Anda (Rahmanraden)" />
                <Rule ok text="Verifikasi bisa memakan waktu 1-3 hari kerja" />
                <Rule ok text="Gunakan dokumen yang masih berlaku" />
                <Rule text="JANGAN gunakan identitas orang lain — akun bisa dibanned permanen" />
              </div>

              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Langkah 4: Setup Keamanan Akun</p>
              <div className="space-y-1.5">
                <Rule ok text="Pergi ke Settings → Developer account → Account details" />
                <Rule ok text="Tambahkan recovery email & phone number Anda" />
                <Rule ok text="Di Users & permissions — JANGAN tambahkan user lain sebagai 'Account owner'" />
                <Rule ok text="Jika ada tim, beri role 'Release manager' atau 'Developer' saja" />
                <Rule text="JANGAN share login Google Account Anda ke siapapun" />
              </div>

              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Data Signing Key (Keystore) — Hanya Anda yang Pegang</p>
              <CodeBlock code={`# Generate keystore untuk sign APK/AAB:
keytool -genkey -v \\
  -keystore kriptoaman-release.keystore \\
  -alias kriptoaman \\
  -keyalg RSA \\
  -keysize 2048 \\
  -validity 10000

# Isi dengan data Anda:
# First & Last Name: Rahmanraden
# Organization: KriptoAman
# Country: ID

# SIMPAN FILE INI! Jika hilang, Anda tidak bisa update app!
# Backup ke: USB terenkripsi + lokasi fisik aman

# Sign AAB/APK:
jarsigner -verbose -sigalg SHA256withRSA \\
  -digestalg SHA-256 \\
  -keystore kriptoaman-release.keystore \\
  app-release.aab kriptoaman`} />

              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-200 mt-2">
                ⚠️ <strong>Keystore = Kunci App Anda.</strong> Jika keystore hilang atau bocor, Anda tidak bisa update app di Play Store dan harus publish ulang dengan package name baru (kehilangan semua rating/review).
              </div>

              <a href="https://play.google.com/console" target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-green-400 text-xs hover:underline mt-2">
                <ExternalLink className="w-3.5 h-3.5" /> Buka Google Play Console
              </a>
            </div>
          </Accordion>

          {/* ── APPLE APP STORE CONNECT ───────────────────────────────────── */}
          <Accordion title="Apple App Store Connect" icon={Cloud} color="slate" badge="iOS Developer Account — Atas Nama Anda">
            <div className="space-y-3">
              <div className="bg-slate-500/10 border border-slate-500/20 rounded-xl p-3 text-xs text-slate-200">
                🍎 Apple Developer Program harus terdaftar atas nama Anda. Apple memverifikasi identitas secara ketat — gunakan nama & data asli Anda.
              </div>

              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Langkah 1: Buat Apple ID Pribadi</p>
              <div className="space-y-1.5">
                <Rule ok text="Buka appleid.apple.com → Create Your Apple ID" />
                <Rule ok text={`Email: gunakan ${OWNER.email} atau buat Apple ID baru khusus developer`} />
                <Rule ok text="Nama: Rahmanraden (nama asli, sesuai KTP)" />
                <Rule ok text="Aktifkan Two-Factor Authentication (WAJIB untuk developer)" />
                <Rule text="JANGAN pakai Apple ID yang sudah dipakai untuk personal (pisahkan)" />
              </div>

              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Langkah 2: Daftar Apple Developer Program</p>
              <div className="bg-slate-900/60 rounded-xl p-4 space-y-2 text-xs">
                <p className="text-slate-300">Buka: <a href="https://developer.apple.com/programs/enroll/" target="_blank" rel="noreferrer" className="text-blue-400 underline">developer.apple.com/programs/enroll</a></p>
                <div className="space-y-1.5 mt-2">
                  <Rule ok text="Entity type: 'Individual' (jika atas nama pribadi) atau 'Organization' (jika ada PT)" />
                  <Rule ok text="Legal Name: Rahmanraden (sesuai KTP/paspor)" />
                  <Rule ok text={`Email: ${OWNER.email}`} />
                  <Rule ok text="Biaya: $99 USD per tahun — bayar dengan kartu kredit atas nama Anda" />
                  <Rule ok text="Untuk Organization: perlu D-U-N-S Number (daftar gratis di Dun & Bradstreet)" />
                </div>
              </div>

              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Langkah 3: Verifikasi Apple (Ketat!)</p>
              <div className="space-y-1.5">
                <Rule ok text="Apple akan verifikasi via telepon / email — jawab dengan cepat" />
                <Rule ok text="Untuk Organization: Apple bisa minta dokumen legalitas perusahaan" />
                <Rule ok text="Proses: 1-7 hari kerja" />
                <Rule ok text="Jika ditolak: hubungi Apple Developer Support dengan dokumen lengkap" />
              </div>

              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Langkah 4: Setup App Store Connect</p>
              <div className="space-y-1.5">
                <Rule ok text="Buka appstoreconnect.apple.com — login dengan Apple ID Anda" />
                <Rule ok text="Users & Access: Anda sebagai 'Account Holder' (tidak bisa dipindah)" />
                <Rule ok text="Jika ada tim: beri role 'Developer' atau 'Marketing' saja" />
                <Rule ok text="Certificates, IDs & Profiles — HANYA Anda yang kelola" />
                <Rule text="JANGAN beri role 'Admin' ke siapapun selain Anda" />
              </div>

              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Sertifikat & Provisioning Profile</p>
              <CodeBlock code={`# Di Mac Anda (Xcode required):

# 1. Generate Certificate Signing Request (CSR):
# Buka Keychain Access → Certificate Assistant
# → Request a Certificate from a Certificate Authority
# Email: rahmanraden027@gmail.com
# Common Name: KriptoAman
# Saved to disk: CertificateSigningRequest.certSigningRequest

# 2. Upload CSR ke Apple Developer Portal:
# developer.apple.com → Certificates → + → iOS Distribution
# Upload file CSR → Download certificate (.cer)

# 3. Double-click .cer → masuk ke Keychain Access Anda
# BACKUP Keychain / p12 file:
# Keychain Access → Klik kanan certificate → Export → .p12
# Set password kuat — JANGAN lupa password ini!

# 4. Buat App ID:
# developer.apple.com → Identifiers → +
# Bundle ID: com.kriptoaman.app (unik, tidak bisa diubah)

# 5. Buat Provisioning Profile:
# developer.apple.com → Profiles → +
# Type: App Store → pilih App ID → pilih Certificate`} />

              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-200 mt-2">
                ⚠️ <strong>Account Holder Apple = Permanen.</strong> Apple tidak mengizinkan transfer ownership akun individual. Bundle ID tidak bisa diubah setelah app publish. Pastikan semua data benar dari awal.
              </div>

              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Perbedaan Penting Individual vs Organization</p>
              <div className="bg-slate-900/60 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left p-2 text-slate-400">Aspek</th>
                      <th className="text-center p-2 text-blue-400">Individual</th>
                      <th className="text-center p-2 text-green-400">Organization</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Biaya', '$99/tahun', '$99/tahun'],
                      ['Nama di App Store', 'Nama pribadi', 'Nama perusahaan'],
                      ['D-U-N-S Number', 'Tidak perlu', 'Wajib'],
                      ['Tim', 'Hanya Anda', 'Bisa tambah tim'],
                      ['Verifikasi', 'KTP/Paspor', 'Dokumen legal PT'],
                    ].map(([a, b, c]) => (
                      <tr key={a} className="border-b border-slate-800">
                        <td className="p-2 text-slate-400">{a}</td>
                        <td className="p-2 text-center text-slate-300">{b}</td>
                        <td className="p-2 text-center text-slate-300">{c}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  ['App Store Connect', 'https://appstoreconnect.apple.com'],
                  ['Apple Developer', 'https://developer.apple.com/programs/enroll/'],
                  ['D-U-N-S Lookup', 'https://developer.apple.com/enroll/duns-lookup/'],
                ].map(([label, url]) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs transition-colors">
                    <ExternalLink className="w-3 h-3" /> {label}
                  </a>
                ))}
              </div>
            </div>
          </Accordion>

          {/* ── RINGKASAN BIAYA & CHECKLIST ───────────────────────────────── */}
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <h2 className="text-green-300 font-bold">Checklist & Biaya Developer Account</h2>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
                  <p className="text-green-400 font-bold text-lg">$25 USD</p>
                  <p className="text-slate-400 text-xs">Google Play Console</p>
                  <p className="text-slate-500 text-xs">Sekali bayar seumur hidup</p>
                </div>
                <div className="bg-slate-500/10 border border-slate-500/20 rounded-xl p-3 text-center">
                  <p className="text-slate-300 font-bold text-lg">$99 USD</p>
                  <p className="text-slate-400 text-xs">Apple Developer Program</p>
                  <p className="text-slate-500 text-xs">Per tahun (auto-renew)</p>
                </div>
              </div>
              <div className="space-y-1.5 mt-2">
                <Rule ok text="Kedua akun atas nama: Rahmanraden" />
                <Rule ok text={`Email terdaftar: ${OWNER.email}`} />
                <Rule ok text="Keystore Android: backup di lokasi aman, password hanya Anda tahu" />
                <Rule ok text="Apple Certificate .p12: export & simpan di Keychain + backup USB" />
                <Rule ok text="Bundle ID Android: com.kriptoaman.app" />
                <Rule ok text="Bundle ID iOS: com.kriptoaman.app" />
                <Rule text="JANGAN biarkan orang lain daftar atas nama mereka untuk Anda" />
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-5">
            <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-400" /> Link Penting
            </h2>
            <div className="grid grid-cols-1 gap-2">
              {[
                ['DigitalOcean Dashboard', 'https://cloud.digitalocean.com'],
                ['AWS Console', 'https://console.aws.amazon.com'],
                ['Google Cloud Console', 'https://console.cloud.google.com'],
                ['AWS IAM Best Practices', 'https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html'],
                ['GCP IAM Best Practices', 'https://cloud.google.com/iam/docs/using-iam-securely'],
                ['DigitalOcean Security Guide', 'https://docs.digitalocean.com/products/droplets/how-to/setup-an-ubuntu-18-04-server/'],
                ['Cloudflare DNS', 'https://dash.cloudflare.com'],
                ['MySQL Docs', 'https://dev.mysql.com/doc/'],
                ['PostgreSQL Docs', 'https://www.postgresql.org/docs/'],
                ['WHOIS Lookup', 'https://lookup.icann.org'],
              ].map(([label, url]) => (
                <a key={url} href={url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" /> {label}
                </a>
              ))}
            </div>
          </div>

        </div>
      </div>
    </AdminGuard>
  );
}