import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { useLanguage } from "@/lib/LanguageContext";

const COPY = {
  id: { title: "Selamat datang kembali", subtitle: "Masuk ke akun KriptoAman Anda", noAccount: "Belum memiliki akun?", register: "Daftar", password: "Kata sandi", forgot: "Lupa kata sandi?", invalid: "Email atau kata sandi tidak valid", adminInfo: "Akun admin menggunakan tautan masuk aman tanpa kata sandi.", adminSent: "Tautan masuk admin telah dikirim. Buka email tersebut untuk masuk langsung.", loading: "Sedang masuk...", adminSubmit: "Kirim tautan masuk admin", submit: "Masuk" },
  en: { title: "Welcome back", subtitle: "Sign in to your KriptoAman account", noAccount: "Don’t have an account?", register: "Create account", password: "Password", forgot: "Forgot password?", invalid: "Invalid email or password", adminInfo: "The administrator account uses a secure passwordless sign-in link.", adminSent: "The administrator sign-in link has been sent. Open the email to sign in.", loading: "Signing in...", adminSubmit: "Send administrator sign-in link", submit: "Sign in" },
};

export default function Login() {
  const { language } = useLanguage();
  const text = COPY[language] || COPY.id;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err.message || text.invalid);
    } finally {
      setLoading(false);
    }
  };


  return (
    <AuthLayout
      icon={LogIn}
      title={text.title}
      subtitle={text.subtitle}
      logo
      darkBlue
      footer={
        <>
          {text.noAccount}{" "}
          <Link to="/register" className="font-semibold text-sky-400 hover:text-sky-300 hover:underline">
            {text.register}
          </Link>
        </>
      }
    >

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        {!isAdminEmail && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{text.password}</Label>
            <Link to="/forgot-password" className="text-xs text-sky-400 hover:underline">
              {text.forgot}
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        )}
        {isAdminEmail && (
          <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-3 text-sm text-sky-200">
            {text.adminInfo}
          </div>
        )}
        {adminLinkSent && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
            {text.adminSent}
          </div>
        )}
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {text.loading}
            </>
          ) : (
            isAdminEmail ? text.adminSubmit : text.submit
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
