import React from "react";
import KriptoAmanLogo from "@/components/brand/KriptoAmanLogo";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children, logo = false, darkBlue = false }) {
  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${darkBlue ? "dark bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950" : "bg-background"}`}>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          {logo ? (
            <div className="flex justify-center mb-4">
              <KriptoAmanLogo size={48} showText={true} textSize="text-lg" />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
              <Icon className="w-7 h-7 text-primary-foreground" aria-hidden="true" />
            </div>
          )}
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
        </div>
        <div className={`rounded-2xl border border-border p-8 ${darkBlue ? "bg-slate-900/80 backdrop-blur shadow-lg" : "bg-card shadow-sm"}`}>
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}