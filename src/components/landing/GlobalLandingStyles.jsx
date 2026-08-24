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
        padding-bottom:max(24px,env(safe-area-inset-bottom));
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

      /* Responsive safety net for stale/partial utility CSS. */
      .ka-landing header{position:fixed;top:0;left:0;right:0;z-index:50;}
      .ka-landing header>div:first-of-type{max-width:1440px;margin:0 auto;padding:0 12px;height:64px;display:flex;align-items:center;justify-content:space-between;gap:8px;}
      .ka-landing header>div:first-of-type>a:first-child{display:flex;align-items:center;gap:8px;min-width:0;text-decoration:none;}
      .ka-landing header nav{display:none;}
      .ka-landing header>div:first-of-type>div:last-child{display:flex;align-items:center;gap:6px;flex-shrink:0;}
      .ka-landing header button{display:flex;align-items:center;justify-content:center;}
      .ka-landing header .ka-btn-primary{display:inline-flex;align-items:center;justify-content:center;height:36px;min-height:36px;padding:0 13px;line-height:1;border-radius:11px;white-space:nowrap;font-size:13px;}

      #beranda{position:relative;padding:112px 16px 56px;overflow:hidden;}
      #beranda .ka-hero-grid{max-width:1440px;margin:0 auto;display:grid;grid-template-columns:minmax(0,1fr);gap:36px;align-items:center;}
      #beranda .ka-hero-copy{text-align:center;min-width:0;}
      #beranda .ka-sec-title{margin-top:20px;font-size:34px;overflow-wrap:anywhere;}
      #beranda .ka-hero-copy>p{max-width:576px;margin:20px auto 0;font-size:14px;line-height:1.65;}
      #beranda .ka-hero-actions{margin-top:28px;display:flex;flex-direction:column;gap:12px;justify-content:center;}
      #beranda .ka-hero-actions>a{width:100%;min-height:48px;}
      #beranda .ka-hero-indicators{margin-top:30px;display:flex;flex-wrap:wrap;gap:12px 22px;justify-content:center;}
      #beranda .ka-hero-indicators>div{display:flex;align-items:center;gap:8px;}

      /* Visual is completely self-contained so it cannot collapse into document flow. */
      #beranda .ka-hero-visual{position:relative;margin:4px auto 0;width:min(82vw,340px);height:min(82vw,340px);max-width:340px;max-height:340px;aspect-ratio:1/1;isolation:isolate;}
      #beranda .ka-hero-network{position:absolute;inset:0;width:100%;height:100%;display:block;z-index:0;}
      #beranda .ka-hero-center{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;border-radius:999px;z-index:1;pointer-events:none;}
      #beranda .ka-hero-logo{display:flex;align-items:center;justify-content:center;width:150px;height:150px;border-radius:999px;overflow:visible;}
      #beranda .ka-hero-logo>div{width:150px!important;height:150px!important;min-width:150px!important;display:flex!important;align-items:center!important;justify-content:center!important;}
      #beranda .ka-hero-logo img{display:block!important;width:150px!important;height:150px!important;max-width:150px!important;object-fit:contain!important;}
      #beranda .ka-coin-badge{position:absolute!important;width:58px!important;height:58px!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;z-index:3;line-height:1.05;overflow:hidden;}
      #beranda .ka-coin-symbol{font-size:12px;font-weight:800;}
      #beranda .ka-coin-name{font-size:7px;margin-top:2px;white-space:nowrap;}
      #beranda .ka-coin-btc{top:6px;left:4px;}
      #beranda .ka-coin-eth{top:6px;right:4px;}
      #beranda .ka-coin-sol{bottom:18px;left:6px;}
      #beranda .ka-coin-trx{bottom:18px;right:6px;}
      #beranda>p{text-align:center;margin-top:28px;font-size:11px;line-height:1.5;}

      /* Landing body rhythm: compact on phones, comfortable on desktop. */
      .ka-landing #fitur{padding-top:32px!important;padding-bottom:24px!important;}
      .ka-landing #fitur + section{padding-top:16px!important;padding-bottom:24px!important;}
      .ka-landing #fitur + section>div{padding:20px!important;}
      .ka-landing #fitur + section>div>div:first-child{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:18px!important;}
      .ka-landing #fitur + section>div>div:nth-child(2){gap:12px!important;}
      .ka-landing #fitur + section .ka-card2{min-height:116px;padding:14px!important;display:flex;flex-direction:column;justify-content:center;}
      .ka-landing #fitur + section .ka-card2>p:first-child{font-size:clamp(22px,7vw,34px);line-height:1.05;overflow-wrap:anywhere;}
      .ka-landing #keamanan{padding-top:36px!important;padding-bottom:36px!important;}
      .ka-landing #keamanan>div{gap:16px!important;}
      .ka-landing #keamanan .ka-card{padding:20px!important;}
      .ka-landing #keamanan .ka-card>p{line-height:1.6;}
      .ka-landing #keamanan .ka-btn-primary{width:100%!important;max-width:320px;align-self:flex-start;}

      @media (max-width:420px){
        .ka-landing header>div:first-of-type{height:60px;padding-left:10px;padding-right:10px;}
        .ka-landing header>div:first-of-type>a:first-child span{letter-spacing:.08em!important;font-size:12px!important;}
        .ka-landing header .ka-btn-primary{height:34px;min-height:34px;padding:0 11px;font-size:12px;}
        #beranda{padding-top:96px;padding-left:14px;padding-right:14px;}
        #beranda .ka-chip{max-width:100%;white-space:normal;text-align:center;justify-content:center;line-height:1.35;}
        #beranda .ka-sec-title{font-size:31px;}
        #beranda .ka-hero-visual{width:min(78vw,310px);height:min(78vw,310px);max-width:310px;max-height:310px;}
        #beranda .ka-hero-logo,#beranda .ka-hero-logo>div,#beranda .ka-hero-logo img{width:132px!important;height:132px!important;min-width:132px!important;max-width:132px!important;}
        #beranda .ka-coin-badge{width:52px!important;height:52px!important;}
        .ka-landing #fitur + section{padding-left:14px!important;padding-right:14px!important;}
        .ka-landing #fitur + section>div{padding:16px!important;}
        .ka-landing #fitur + section>div>div:nth-child(2){grid-template-columns:repeat(2,minmax(0,1fr))!important;}
        .ka-landing #fitur + section .ka-card2{min-width:0;min-height:108px;padding:12px!important;}
        .ka-landing #fitur + section .ka-card2>p:first-child{font-size:clamp(20px,6.6vw,30px);}
        .ka-landing #keamanan{padding-left:14px!important;padding-right:14px!important;}
        .ka-landing #keamanan .ka-card{padding:18px!important;}
      }

      @media (min-width:640px){
        .ka-landing header>div:first-of-type{padding-left:24px;padding-right:24px;gap:16px;}
        #beranda{padding-left:24px;padding-right:24px;}
        #beranda .ka-sec-title{font-size:48px;}
        #beranda .ka-hero-copy>p{font-size:16px;}
        #beranda .ka-hero-actions{flex-direction:row;}
        #beranda .ka-hero-actions>a{width:auto;min-width:190px;}
        #beranda .ka-hero-visual{width:400px;height:400px;max-width:400px;max-height:400px;}
        .ka-landing #fitur{padding-top:44px!important;padding-bottom:36px!important;}
        .ka-landing #keamanan{padding-top:48px!important;padding-bottom:48px!important;}
      }

      @media (min-width:1024px){
        .ka-landing header nav{display:flex;align-items:center;gap:28px;font-size:14px;}
        .ka-landing header button[aria-label="Menu"]{display:none;}
        #beranda .ka-hero-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:32px;}
        #beranda .ka-hero-copy{text-align:left;}
        #beranda .ka-sec-title{font-size:54px;}
        #beranda .ka-hero-copy>p{margin-left:0;margin-right:0;}
        #beranda .ka-hero-actions,#beranda .ka-hero-indicators{justify-content:flex-start;}
        #beranda .ka-hero-visual{width:420px;height:420px;max-width:420px;max-height:420px;}
        .ka-landing #fitur + section>div{padding:28px!important;}
      }

      @media (max-width:1023px){
        .ka-landing header nav{display:none!important;}
      }

      @media (prefers-reduced-motion:reduce){
        .ka-landing *, .ka-landing *::before, .ka-landing *::after{animation-duration:.01ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important;}
      }
    `}</style>
  );
}
