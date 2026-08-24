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
      .ka-btn-primary{background:var(--ka-blue);color:#fff;border-radius:12px;font-weight:700;min-height:44px;transition:all .2s;text-decoration:none;}
      .ka-btn-primary:hover{filter:brightness(1.08);box-shadow:0 8px 24px rgba(59,130,246,0.35);}
      .ka-btn-outline{background:transparent;color:var(--ka-text);border:1px solid var(--ka-border);border-radius:12px;font-weight:700;min-height:44px;transition:all .2s;text-decoration:none;}
      .ka-btn-outline:hover{border-color:var(--ka-blue);color:var(--ka-blue);}
      .ka-divider{background:var(--ka-border);}
      .ka-nav-link{color:var(--ka-text2);font-weight:600;position:relative;text-decoration:none;}
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

      /* Landing layout safety net. These rules keep the public landing readable
         if a responsive utility bundle is stale or only partially applied. */
      .ka-landing header{position:fixed;top:0;left:0;right:0;z-index:50;}
      .ka-landing header>div:first-of-type{max-width:1440px;margin:0 auto;padding:0 12px;height:64px;display:flex;align-items:center;justify-content:space-between;gap:8px;}
      .ka-landing header>div:first-of-type>a:first-child{display:flex;align-items:center;gap:8px;min-width:0;text-decoration:none;}
      .ka-landing header nav{display:none;}
      .ka-landing header>div:first-of-type>div:last-child{display:flex;align-items:center;gap:6px;flex-shrink:0;}
      .ka-landing header button{display:flex;align-items:center;justify-content:center;}

      #beranda{position:relative;padding:112px 16px 64px;overflow:hidden;}
      #beranda>div:nth-of-type(2){max-width:1440px;margin:0 auto;display:grid;grid-template-columns:minmax(0,1fr);gap:40px;align-items:center;}
      #beranda>div:nth-of-type(2)>div:first-child{text-align:center;min-width:0;}
      #beranda .ka-sec-title{margin-top:20px;font-size:34px;overflow-wrap:anywhere;}
      #beranda>div:nth-of-type(2)>div:first-child>p{max-width:576px;margin:20px auto 0;font-size:14px;line-height:1.65;}
      #beranda>div:nth-of-type(2)>div:first-child>div:nth-of-type(1){margin-top:28px;display:flex;flex-direction:column;gap:12px;justify-content:center;}
      #beranda>div:nth-of-type(2)>div:first-child>div:nth-of-type(2){margin-top:32px;display:flex;flex-wrap:wrap;gap:12px 24px;justify-content:center;}
      #beranda>div:nth-of-type(2)>div:first-child>div:nth-of-type(2)>div{display:flex;align-items:center;gap:8px;}
      #beranda>div:nth-of-type(2)>div:nth-child(2){position:relative;margin:0 auto;width:100%;max-width:420px;aspect-ratio:1/1;}
      #beranda>p{text-align:center;margin-top:40px;font-size:11px;}

      @media (min-width:640px){
        .ka-landing header>div:first-of-type{padding-left:24px;padding-right:24px;gap:16px;}
        #beranda{padding-left:24px;padding-right:24px;}
        #beranda .ka-sec-title{font-size:48px;}
        #beranda>div:nth-of-type(2)>div:first-child>p{font-size:16px;}
        #beranda>div:nth-of-type(2)>div:first-child>div:nth-of-type(1){flex-direction:row;}
      }

      @media (min-width:1024px){
        .ka-landing header nav{display:flex;align-items:center;gap:28px;font-size:14px;}
        .ka-landing header button[aria-label="Menu"]{display:none;}
        #beranda>div:nth-of-type(2){grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:32px;}
        #beranda>div:nth-of-type(2)>div:first-child{text-align:left;}
        #beranda .ka-sec-title{font-size:54px;}
        #beranda>div:nth-of-type(2)>div:first-child>p{margin-left:0;margin-right:0;}
        #beranda>div:nth-of-type(2)>div:first-child>div:nth-of-type(1),
        #beranda>div:nth-of-type(2)>div:first-child>div:nth-of-type(2){justify-content:flex-start;}
      }

      @media (max-width:1023px){
        .ka-landing header nav{display:none!important;}
      }
    `}</style>
  );
}
