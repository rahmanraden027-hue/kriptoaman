import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { kriptoAuth } from "@/lib/kriptoAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2, ShieldCheck } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { useLanguage } from "@/lib/LanguageContext";

const COPY = {
  id: { title: "Selamat datang kembali", subtitle: "Masuk ke akun KriptoAman Anda", noAccount: "Belum memiliki akun?", register: "Daftar", password: "Kata sandi", forgot: "Lupa kata sandi?", invalid: "Email atau kata sandi tidak valid", adminInfo: "Akun admin menggunakan tautan masuk aman tanpa kata sandi.", adminSent: "Tautan masuk admin telah dikirim. Buka email tersebut untuk masuk langsung.", loading: "Sedang masuk...", adminSubmit: "Kirim tautan masuk admin", submit: "Masuk", twoFactor: "Kode 2FA", twoFactorHelp: "Masukkan 6 digit dari aplikasi Authenticator", verify: "Verifikasi & Masuk" },
  en: { title: "Welcome back", subtitle: "Sign in to your KriptoAman account", noAccount: "Don’t have an account?", register: "Create account", password: "Password", forgot: "Forgot password?", invalid: "Invalid email or password", adminInfo: "The administrator account uses a secure passwordless sign-in link.", adminSent: "The administrator sign-in link has been sent. Open the email to sign in.", loading: "Signing in...", adminSubmit: "Send administrator sign-in link", submit: "Sign in", twoFactor: "2FA code", twoFactorHelp: "Enter the 6 digits from your Authenticator app", verify: "Verify & sign in" },
};

export default function Login() {
  const { language } = useLanguage();
  const text = COPY[language] || COPY.id;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [requires2FA, setRequires2FA] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminLinkSent, setAdminLinkSent] = useState(false);
  const isAdminEmail = email.trim().toLowerCase() === "kriptoaman@gmail.com";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isAdminEmail) {
        await base44.auth.requestAdminLink(email);
        setAdminLinkSent(true);
        return;
      }

      if (requires2FA) {
        await kriptoAuth.loginWith2FA(email, password, totpCode);
        window.location.href = "/dashboard";
        return;
      }

      const result = await base44.auth.loginViaEmailPassword(email, password);
      if (result?.two_factor_required) {
        setRequires2FA(true);
        setTotpCode("");
        return;
      }
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err.message || text.invalid);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout icon={LogIn} title={text.title} subtitle={text.subtitle} logo darkBlue footer={<>{text.noAccount}{" "}<Link to="/register" className="font-semibold text-sky-400 hover:text-sky-300 hover:underline">{text.register}</Link></>}>
      {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input id="email" type="email" autoComplete="email" autoFocus={!requires2FA} placeholder="you@example.com" value={email} onChange={(e) => { setEmail(e.target.value); setRequires2FA(false); }} className="pl-10 h-12" required disabled={requires2FA} />
          </div>
        </div>

        {!isAdminEmail && (
          <div className="space-y-2">
            <div className="flex items-center justify-between"><Label htmlFor="password">{text.password}</Label><Link to="/forgot-password" className="text-xs text-sky-400 hover:underline">{text.forgot}</Link></div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => { setPassword(e.target.value); setRequires2FA(false); }} className="pl-10 h-12" required disabled={requires2FA} />
            </div>
          </div>
        )}

        {requires2FA && (
          <div className="space-y-2 rounded-xl border border-sky-500/30 bg-sky-500/10 p-3">
            <div className="flex items-center gap-2 text-sky-200 font-semibold text-sm"><ShieldCheck className="w-4 h-4" />{text.twoFactor}</div>
            <p className="text-xs text-sky-200/70">{text.twoFactorHelp}</p>
            <Input inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, ""))} className="h-12 text-center text-xl tracking-[0.35em]" autoFocus required />
            <button type="button" onClick={() => { setRequires2FA(false); setTotpCode(""); }} className="text-xs text-sky-300 hover:underline">Ganti akun / kata sandi</button>
          </div>
        )}

        {isAdminEmail && <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-3 text-sm text-sky-200">{text.adminInfo}</div>}
        {adminLinkSent && <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{text.adminSent}</div>}

        <Button type="submit" className="w-full h-12 font-medium" disabled={loading || (requires2FA && totpCode.length !== 6)}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{text.loading}</> : isAdminEmail ? text.adminSubmit : requires2FA ? text.verify : text.submit}
        </Button>
      </form>
    </AuthLayout>
  );
}
