// Scoped styles + theme variables for the KriptoAman Global Landing preview.
// Dark is the source of truth; .light redefines variables only.
export default function GlobalLandingStyles() {
  return (
    <style>{`
      .ka-landing{
        --ka-bg1:#05070a; --ka-bg2:#0b1016; --ka-card:#111821; --ka-card2:#0b1016;
        --ka-border:#1f2a38; --ka-text:#ffffff; --ka-text2:#94a3b8;
        --ka-blue:#3b82f6; --ka-cyan:#3b82f6; --ka-gold:#F5B72E; --ka-green:#22C55E;
        --ka-radius:16px;
        color:var(--ka-text); background:linear-gradient(180deg,var(--ka-bg1),var(--ka-bg2));
        font-family:Inter,system-ui,-apple-system,sans-serif;
      }
      .ka-landing.light{
        --ka-bg1:#F1F5F9; --ka-bg2:#E2E8F0; --ka-card:#FFFFFF; --ka-card2:#F8FAFC;
        --ka-border:#CBD5E1; --ka-text:#0F172A; --ka-text2:#475569;
        --ka-blue:#2563eb; --ka-cyan:#0EA5E9; --ka-gold:#D97706; --ka-green:#16A34A;
      }
      .ka-card{background:var(--ka-card);border:1px solid var(--ka-border);border-radius:var(--ka-radius);}
      .ka-card2{background:var(--ka-card2);border:1px solid var(--ka-border);border-radius:12px;}
      .ka-text{color:var(--ka-text);} .ka-text2{color:var(--ka-text2);}
      .ka-blue{color:var(--ka-blue);} .ka-cyan{color:var(--ka-cyan);}
      .ka-gold{color:var(--ka-gold);} .ka-green{color:var(--ka-green);}
      .ka-glow{box-shadow:0 0 30px rgba(59,130,246,0.15);}
      .ka-glow-cyan{box-shadow:0 0 60px rgba(59,130,246,0.22);}
      .ka-glow-gold{box-shadow:0 0 40px rgba(245,183,46,0.18);}
      .ka-btn-primary{background:var(--ka-blue);color:#fff;border-radius:12px;font-weight:700;min-height:44px;transition:all .2s;}
      .ka-btn-primary:hover{filter:brightness(1.08);box-shadow:0 8px 24px rgba(59,130,246,0.35);}
      .ka-btn-outline{background:transparent;color:var(--ka-text);border:1px solid var(--ka-border);border-radius:12px;font-weight:700;min-height:44px;transition:all .2s;}
      .ka-btn-outline:hover{border-color:var(--ka-blue);color:var(--ka-blue);}
      .ka-divider{background:var(--ka-border);}
      .ka-nav-link{color:var(--ka-text2);font-weight:600;position:relative;}
      .ka-nav-link:hover{color:var(--ka-text);}
      .ka-nav-link.active{color:var(--ka-blue);}
      .ka-nav-link.active::after{content:"";position:absolute;left:0;right:0;bottom:-6px;height:2px;background:var(--ka-blue);border-radius:2px;}
      .ka-chip{background:rgba(59,130,246,0.10);border:1px solid rgba(59,130,246,0.30);color:var(--ka-blue);border-radius:999px;}
      .ka-coin-badge{display:flex;align-items:center;justify-content:center;border-radius:999px;font-weight:800;border:1px solid var(--ka-border);background:var(--ka-card);}
      .ka-net-dot{fill:var(--ka-cyan);}
      .ka-net-line{stroke:var(--ka-blue);stroke-opacity:.45;}
      .ka-faq summary{cursor:pointer;list-style:none;}
      .ka-faq summary::-webkit-details-marker{display:none;}
      .ka-faq[open] .ka-faq-icon{transform:rotate(180deg);}
      .ka-sec-title{font-weight:800;letter-spacing:-0.02em;line-height:1.1;}
    `}</style>
  );
}