import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function Login() {
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
      setError(err.message || "Email atau kata sandi tidak valid");
    } finally {
      setLoading(false);
    }
  };


  return (
    <AuthLayout
      icon={LogIn}
      title="Selamat datang kembali"
      subtitle="Masuk ke akun KriptoAman Anda"
      logo
      darkBlue
      footer={
        <>
          Belum memiliki akun?{" "}
          <Link to="/register" className="font-semibold text-sky-400 hover:text-sky-300 hover:underline">
            Daftar
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
            <Label htmlFor="password">Kata sandi</Label>
            <Link to="/forgot-password" className="text-xs text-sky-400 hover:underline">
              Lupa kata sandi?
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
            Akun admin menggunakan tautan masuk aman tanpa kata sandi.
          </div>
        )}
        {adminLinkSent && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
            Tautan masuk admin telah dikirim. Buka email tersebut untuk masuk langsung.
          </div>
        )}
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sedang masuk...
            </>
          ) : (
            isAdminEmail ? "Kirim tautan masuk admin" : "Masuk"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
