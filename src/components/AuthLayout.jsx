import React from "react";
import KriptoAmanLogo from "@/components/brand/KriptoAmanLogo";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children, logo = false, darkBlue = false }) {
  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ka-bg ${darkBlue ? "text-white" : ""}`}>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          {logo ? (
            <div className="flex justify-center mb-4">
              <KriptoAmanLogo size={56} showText={true} textSize="text-xl" />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-ka-emerald mb-4 ka-emerald-glow">
              <Icon className="w-7 h-7 text-black" aria-hidden="true" />
            </div>
          )}
          <h1 className="text-3xl font-extrabold tracking-tight text-white">{title}</h1>
          {subtitle && <p className="ka-muted mt-2 text-sm">{subtitle}</p>}
        </div>
        <div className="ka-surface ka-emerald-glow p-8">
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm ka-muted mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}