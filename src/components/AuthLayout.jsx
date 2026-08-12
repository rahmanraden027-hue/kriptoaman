import React from "react";
import KriptoAmanLogo from "@/components/brand/KriptoAmanLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children, darkBlue = false }) {
  return (
    <div className={`relative min-h-screen flex items-center justify-center px-4 py-10 ka-bg ${darkBlue ? "text-white" : ""}`}>
      <LanguageSwitcher compact className="absolute right-4 top-4 z-20" />
      <div className="w-full max-w-md">
        <header className="text-center mb-8">
          <div className="flex justify-center">
            <KriptoAmanLogo
              size={60}
              showText
              textSize="text-xl sm:text-2xl"
              className="rounded-2xl"
            />
          </div>
          {Icon && (
            <div className="mx-auto -mt-1 mb-4 flex h-8 w-8 items-center justify-center rounded-xl border border-sky-500/25 bg-sky-500/10 shadow-lg shadow-sky-500/10" aria-hidden="true">
              <Icon className="h-4 w-4 text-sky-300" />
            </div>
          )}
          <h1 className="text-3xl font-extrabold tracking-tight text-white">{title}</h1>
          {subtitle && <p className="ka-muted mt-2 text-sm">{subtitle}</p>}
        </header>
        <main className="ka-surface ka-emerald-glow p-6 sm:p-8">
          {children}
        </main>
        {footer && (
          <p className="text-center text-sm ka-muted mt-6">{footer}</p>
        )}
        <p className="mt-5 text-center text-[10px] leading-relaxed text-slate-600">
          KriptoAman · Digital Asset Monitoring &amp; Security
        </p>
      </div>
    </div>
  );
}
