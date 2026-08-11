import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import { toast } from "@/components/ui/use-toast";
import { useLanguage } from "@/lib/LanguageContext";

const COPY = {
  id: { title:"Buat akun KriptoAman", subtitle:"Daftar untuk mulai memantau aset digital", hasAccount:"Sudah memiliki akun?", login:"Masuk", password:"Kata sandi", confirm:"Konfirmasi kata sandi", mismatch:"Konfirmasi kata sandi tidak cocok", exists:"Email ini sudah terdaftar dan terverifikasi. Silakan masuk, bukan meminta OTP baru.", failed:"Pendaftaran gagal", guidance:"Gunakan minimal 12 karakter. Jangan gunakan ulang kata sandi dari akun lain.", consentStart:"Saya telah membaca dan menyetujui", terms:"Syarat Penggunaan", and:"serta", privacy:"Kebijakan Privasi", consentEnd:"Saya memahami KriptoAman saat ini menyediakan informasi, pemantauan, edukasi, dan keamanan aset digital—bukan jaminan keuntungan investasi.", creating:"Membuat akun...", register:"Daftar", verifyTitle:"Verifikasi email Anda", verifySubtitle:"Kami mengirim kode ke", verifying:"Memverifikasi...", verify:"Verifikasi", noCode:"Belum menerima kode?", resend:"Kirim ulang", sentTitle:"Kode dikirim", sentDescription:"Periksa email Anda untuk kode baru.", invalidCode:"Kode verifikasi tidak valid", resendFailed:"Gagal mengirim ulang kode" },
  en: { title:"Create your KriptoAman account", subtitle:"Register to start monitoring digital assets", hasAccount:"Already have an account?", login:"Sign in", password:"Password", confirm:"Confirm password", mismatch:"Password confirmation does not match", exists:"This email is already registered and verified. Please sign in instead of requesting another OTP.", failed:"Registration failed", guidance:"Use at least 12 characters. Do not reuse a password from another account.", consentStart:"I have read and agree to the", terms:"Terms of Service", and:"and", privacy:"Privacy Policy", consentEnd:"I understand that KriptoAman currently provides digital-asset information, monitoring, education, and security—not guaranteed investment returns.", creating:"Creating account...", register:"Register", verifyTitle:"Verify your email", verifySubtitle:"We sent a code to", verifying:"Verifying...", verify:"Verify", noCode:"Didn’t receive the code?", resend:"Resend", sentTitle:"Code sent", sentDescription:"Check your email for the new code.", invalidCode:"Invalid verification code", resendFailed:"Failed to resend code" },
};

export default function Register() {
  const { language } = useLanguage();
  const text = COPY[language] || COPY.id;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError(text.mismatch);
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email, password, termsAccepted });
      setShowOtp(true);
    } catch (err) {
      if (err.status === 409) {
        setError(text.exists);
      } else {
        setError(err.message || text.failed);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err.message || text.invalidCode);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      toast({
        title: text.sentTitle,
        description: text.sentDescription,
      });
    } catch (err) {
      setError(err.message || text.resendFailed);
    }
  };


  if (showOtp) {
    return (
      <AuthLayout
        icon={Mail}
        title={text.verifyTitle}
        subtitle={`${text.verifySubtitle} ${email}`}
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}
        <div className="flex justify-center mb-6">
          <InputOTP
            maxLength={6}
            value={otpCode}
            onChange={setOtpCode}
            autoFocus
            autoComplete="one-time-code"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button
          className="w-full h-12 font-medium"
          onClick={handleVerify}
          disabled={loading || otpCode.length < 6}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {text.verifying}
            </>
          ) : (
            text.verify
          )}
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-4">
          {text.noCode}{" "}
          <button onClick={handleResend} className="text-primary font-medium hover:underline">
            {text.resend}
          </button>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={UserPlus}
      title={text.title}
      subtitle={text.subtitle}
      footer={
        <>
          {text.hasAccount}{" "}
          <Link to="/login" className="font-semibold text-sky-400 hover:text-sky-300 hover:underline">
            {text.login}
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
        <div className="space-y-2">
          <Label htmlFor="password">{text.password}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">{text.confirm}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {text.guidance}
        </p>
        <div className="flex items-start gap-3 rounded-lg border border-slate-700/70 bg-slate-900/40 p-3">
          <Checkbox
            id="legal-consent"
            checked={termsAccepted}
            onCheckedChange={(checked) => setTermsAccepted(checked === true)}
            aria-required="true"
          />
          <Label htmlFor="legal-consent" className="text-xs font-normal leading-relaxed text-muted-foreground">
            {text.consentStart} <Link to="/TermsOfService" target="_blank" className="text-sky-400 hover:underline">{text.terms}</Link>{" "}
            {text.and} <Link to="/PrivacyPolicy" target="_blank" className="text-sky-400 hover:underline">{text.privacy}</Link>. {text.consentEnd}
          </Label>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading || !termsAccepted}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {text.creating}
            </>
          ) : (
            text.register
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
