// Scoped styles + theme variables for the KriptoAman Global Landing preview.
// Dark is the source of truth; .light redefines variables only.
export default function GlobalLandingStyles() {
  return (
    <style>{`
      .ka-landing{
        --ka-bg1:#020713; --ka-bg2:#07111f; --ka-card:#0a1624; --ka-card2:#06101c;
        --ka-border:#17314c; --ka-text:#F8FBFF; --ka-text2:#8EA6BE;
        --ka-blue:#3b82f6; --ka-cyan:#3b82f6; --ka-gold:#F5B72E; --ka-green:#22C55E;
        --ka-btn-primary-bg:#2563eb; --ka-btn-primary-bg-hover:#1d4ed8;
        --ka-radius:20px;
        color:var(--ka-text); background:radial-gradient(circle at 78% 8%,rgba(37,99,235,.10),transparent 28%),radial-gradient(circle at 16% 36%,rgba(14,165,233,.06),transparent 24%),linear-gradient(180deg,var(--ka-bg1),var(--ka-bg2));
        font-family:Inter,system-ui,-apple-system,sans-serif;
        padding-bottom:max(24px,env(safe-area-inset-bottom));
      }
      .ka-landing.light{
        --ka-bg1:#F1F5F9; --ka-bg2:#E2E8F0; --ka-card:#FFFFFF; --ka-card2:#F8FAFC;
        --ka-border:#CBD5E1; --ka-text:#0F172A; --ka-text2:#475569;
        --ka-blue:#2563eb; --ka-cyan:#0EA5E9; --ka-gold:#D97706; --ka-green:#16A34A;
        --ka-btn-primary-bg:#2563eb; --ka-btn-primary-bg-hover:#1d4ed8;
      }
      .ka-card{background:linear-gradient(145deg,color-mix(in srgb,var(--ka-card) 94%,var(--ka-blue) 6%),var(--ka-card));border:1px solid var(--ka-border);border-radius:var(--ka-radius);box-shadow:0 18px 48px rgba(0,0,0,.16);}
      .ka-card2{background:var(--ka-card2);border:1px solid var(--ka-border);border-radius:12px;}
      .ka-text{color:var(--ka-text);} .ka-text2{color:var(--ka-text2);}
      .ka-blue{color:var(--ka-blue);} .ka-cyan{color:var(--ka-cyan);}
      .ka-gold{color:var(--ka-gold);} .ka-green{color:var(--ka-green);}
      .ka-glow{box-shadow:0 0 30px rgba(59,130,246,0.15);}
      .ka-glow-cyan{box-shadow:0 0 60px rgba(59,130,246,0.22);}
      .ka-glow-gold{box-shadow:0 0 40px rgba(245,183,46,0.18);}
      .ka-btn-primary{background:var(--ka-btn-primary-bg);color:#fff;border-radius:12px;font-weight:700;min-height:44px;transition:all .2s;text-decoration:none;}
      .ka-btn-primary:hover{background:var(--ka-btn-primary-bg-hover);filter:none;box-shadow:0 8px 24px rgba(29,78,216,0.35);}
      .ka-btn-outline{background:transparent;color:var(--ka-text);border:1px solid var(--ka-border);border-radius:12px;font-weight:700;min-height:44px;transition:all .2s;text-decoration:none;}
      .ka-btn-outline:hover{border-color:var(--ka-blue);color:var(--ka-blue);}
      .ka-wallet-cta{border:1px solid rgba(245,183,46,.34);background:rgba(245,183,46,.08);color:var(--ka-gold);text-decoration:none;transition:all .2s;}
      .ka-wallet-cta:hover{background:rgba(245,183,46,.14);box-shadow:0 8px 26px rgba(245,183,46,.10);}
      .ka-zvq-outline{border-color:rgba(245,183,46,.34);color:var(--ka-gold);}
      .ka-zvq-outline:hover{border-color:var(--ka-gold);color:var(--ka-gold);box-shadow:0 8px 28px rgba(245,183,46,.10);}
      .ka-v2-intelligence-card{position:relative;overflow:hidden;transition:transform .2s,border-color .2s;}
      .ka-v2-intelligence-card::after{content:"";position:absolute;inset:auto -15% -58% 35%;height:150px;background:radial-gradient(circle,rgba(37,99,235,.13),transparent 66%);pointer-events:none;}
      .ka-v2-intelligence-card:hover{transform:translateY(-2px);border-color:color-mix(in srgb,var(--ka-blue) 45%,var(--ka-border));}
      .ka-v2-livebar{background:linear-gradient(110deg,rgba(37,99,235,.08),rgba(6,16,28,.95) 48%,rgba(245,183,46,.05));}
      .ka-product-card{position:relative;overflow:hidden;text-decoration:none;transition:transform .2s,border-color .2s;}
      .ka-product-card:hover{transform:translateY(-2px);border-color:color-mix(in srgb,var(--ka-blue) 52%,var(--ka-border));}
      .ka-product-card-gold{background:linear-gradient(145deg,rgba(245,183,46,.07),var(--ka-card) 40%);}
      .ka-product-card-gold:hover{border-color:rgba(245,183,46,.42);}
  
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
      .ka-hero-console{border:1px solid color-mix(in srgb,var(--ka-blue) 32%,var(--ka-border));border-radius:28px;background:linear-gradient(160deg,rgba(15,30,48,.94),rgba(4,8,13,.98));box-shadow:0 32px 90px rgba(0,0,0,.46),0 0 70px rgba(37,99,235,.10);overflow:hidden;}
      .ka-console-head{display:flex;align-items:center;justify-content:space-between;padding:20px 22px;border-bottom:1px solid var(--ka-border);gap:16px;text-align:left;}
      .ka-console-head>div{display:flex;flex-direction:column;gap:4px}.ka-console-head strong{font-size:15px;color:var(--ka-text)}
      .ka-console-kicker{font-size:10px;letter-spacing:.16em;font-weight:800;color:var(--ka-blue)}
      .ka-live-state{display:inline-flex;align-items:center;gap:7px;color:var(--ka-gold);font-size:11px;font-weight:800}.ka-live-state i{width:7px;height:7px;border-radius:50%;background:currentColor;box-shadow:0 0 12px currentColor}.ka-live-state.is-online{color:var(--ka-green)}
      .ka-console-stage{padding:10px 22px 0;background:radial-gradient(circle at 50% 45%,rgba(37,99,235,.12),transparent 54%)}
      .ka-console-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border-top:1px solid var(--ka-border);background:rgba(2,6,11,.62)}
      .ka-console-metrics>div,.ka-console-metrics>a{display:flex;align-items:center;gap:10px;padding:16px;border-right:1px solid var(--ka-border);text-decoration:none;min-width:0}.ka-console-metrics>*:last-child{border-right:0}.ka-console-metrics svg{width:17px;height:17px;color:var(--ka-blue);flex:none}.ka-console-metrics span{display:flex;flex-direction:column;color:var(--ka-text2);font-size:10px;min-width:0}.ka-console-metrics b{font-size:15px;color:var(--ka-text);line-height:1.2;white-space:nowrap}

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
        .ka-console-metrics{grid-template-columns:1fr}.ka-console-metrics>div,.ka-console-metrics>a{border-right:0;border-bottom:1px solid var(--ka-border);padding:13px 16px}.ka-console-metrics>*:last-child{border-bottom:0}
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
        #beranda .ka-hero-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:32px;}
        #beranda .ka-hero-copy{text-align:left;}
        #beranda .ka-sec-title{font-size:54px;}
        #beranda .ka-hero-copy>p{margin-left:0;margin-right:0;}
        #beranda .ka-hero-actions,#beranda .ka-hero-indicators{justify-content:flex-start;}
        #beranda .ka-hero-visual{width:420px;height:420px;max-width:420px;max-height:420px;}
        .ka-landing #fitur + section>div{padding:28px!important;}
      }

      @media (min-width:1280px){
        .ka-landing header nav{display:flex;align-items:center;gap:28px;font-size:14px;}
        .ka-landing header button[aria-label="Menu"]{display:none!important;}
      }

      @media (max-width:1279px){
        .ka-landing header nav{display:none!important;}
        .ka-landing header button[aria-label="Menu"]{display:flex!important;}
      }

      .ka-command-hero::before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 72% 38%,rgba(37,99,235,.12),transparent 31%),radial-gradient(ellipse at 72% 42%,rgba(245,183,46,.045),transparent 18%)}
      .ka-command-hero .ka-hero-copy{position:relative;z-index:2}.ka-command-hero .ka-sec-title{letter-spacing:-.035em;text-shadow:0 8px 40px rgba(0,0,0,.35)}
      .ka-command-hero .ka-hero-console{border-color:color-mix(in srgb,var(--ka-blue) 40%,var(--ka-border));background:radial-gradient(circle at 50% 45%,rgba(37,99,235,.12),transparent 36%),linear-gradient(150deg,rgba(6,20,37,.97),rgba(2,8,17,.99));box-shadow:0 32px 100px rgba(0,0,0,.42),0 0 60px rgba(37,99,235,.08),inset 0 0 50px rgba(59,130,246,.025)}
      .ka-core-stage{position:relative;overflow:hidden}.ka-core-stage::before{content:"";position:absolute;inset:8% 12%;border-radius:50%;background:radial-gradient(circle,rgba(56,189,248,.10),rgba(37,99,235,.035) 40%,transparent 68%);filter:blur(3px)}
      .ka-core-horizon{position:absolute;z-index:0;left:7%;right:7%;top:50%;height:1px;background:linear-gradient(90deg,transparent,rgba(59,130,246,.28),rgba(245,183,46,.32),rgba(59,130,246,.28),transparent);box-shadow:0 0 16px rgba(59,130,246,.2)}
      .ka-core-ring{position:absolute;z-index:1;left:50%;top:50%;border:1px solid rgba(245,183,46,.26);border-radius:50%;pointer-events:none;transform:translate(-50%,-50%) rotate(-16deg);box-shadow:0 0 18px rgba(245,183,46,.06)}.ka-core-ring.ring-a{width:72%;height:25%}.ka-core-ring.ring-b{width:84%;height:32%;transform:translate(-50%,-50%) rotate(24deg);border-color:rgba(59,130,246,.24)}.ka-core-ring.ring-c{width:58%;height:58%;border-color:rgba(56,189,248,.13);transform:translate(-50%,-50%)}
      .ka-command-hero .ka-hero-logo{position:relative;z-index:3}.ka-command-hero .ka-coin-badge{backdrop-filter:blur(12px);border-color:rgba(148,163,184,.18);background:rgba(3,12,24,.86);box-shadow:0 12px 28px rgba(0,0,0,.25)}
      .ka-command-hero .ka-console-metrics{background:linear-gradient(180deg,rgba(3,12,24,.25),rgba(3,12,24,.72))}.ka-command-hero .ka-console-metrics>div,.ka-command-hero .ka-console-metrics>a{border-color:rgba(59,130,246,.12)}
      @media(max-width:640px){.ka-command-hero{padding-top:104px}.ka-command-hero .ka-sec-title{font-size:36px;line-height:1.08}.ka-core-ring.ring-a{width:78%}.ka-core-ring.ring-b{width:88%}}

      .ka-intel-command{position:relative;overflow:hidden;border:1px solid color-mix(in srgb,var(--ka-blue) 42%,var(--ka-border));border-radius:28px;background:radial-gradient(circle at 78% 0%,rgba(37,99,235,.17),transparent 30%),radial-gradient(circle at 12% 100%,rgba(245,183,46,.07),transparent 28%),linear-gradient(145deg,rgba(5,18,34,.98),rgba(2,8,17,.99));box-shadow:0 30px 90px rgba(0,0,0,.35),inset 0 0 80px rgba(37,99,235,.035)}
      .ka-intel-grid-bg{position:absolute;inset:0;opacity:.13;pointer-events:none;background-image:linear-gradient(rgba(59,130,246,.18) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,.18) 1px,transparent 1px);background-size:34px 34px;mask-image:linear-gradient(to bottom,black,transparent 78%)}
      .ka-intel-live,.ka-intel-unavailable{display:inline-flex;align-items:center;gap:7px;font-size:10px;font-weight:900;letter-spacing:.08em}.ka-intel-live{color:var(--ka-green)}.ka-intel-unavailable{color:var(--ka-gold)}.ka-intel-live i,.ka-intel-unavailable i{width:7px;height:7px;border-radius:50%;background:currentColor;box-shadow:0 0 14px currentColor}
      .ka-intel-search,.ka-intel-verify,.ka-intel-engine,.ka-intel-proof{border:1px solid color-mix(in srgb,var(--ka-blue) 24%,var(--ka-border));background:rgba(2,10,20,.82);border-radius:14px}.ka-intel-search:focus-within{border-color:var(--ka-blue);box-shadow:0 0 0 3px rgba(59,130,246,.10)}.ka-intel-verify{color:var(--ka-blue);min-height:46px}.ka-intel-verify:hover{border-color:var(--ka-blue);background:rgba(37,99,235,.09)}
      .ka-intel-engine{min-height:260px;padding:18px;overflow:hidden;position:relative}.ka-intel-engine::after{content:"";position:absolute;width:180px;height:180px;border-radius:50%;right:-90px;bottom:-110px;background:radial-gradient(circle,rgba(37,99,235,.14),transparent 68%);pointer-events:none}
      .ka-intel-mini-live,.ka-intel-mini-scan,.ka-intel-mini-idle{border:1px solid currentColor;border-radius:999px;padding:4px 8px;font-size:8px;font-weight:900;letter-spacing:.08em}.ka-intel-mini-live{color:var(--ka-green)}.ka-intel-mini-scan{color:var(--ka-blue)}.ka-intel-mini-idle{color:var(--ka-text2)}
      .ka-pulse-bars{height:88px;display:flex;align-items:flex-end;gap:4px;border-bottom:1px solid rgba(59,130,246,.24);background:linear-gradient(to top,rgba(37,99,235,.05),transparent)}.ka-pulse-bars i{flex:1;min-width:3px;border-radius:4px 4px 0 0;background:linear-gradient(to top,var(--ka-blue),#38bdf8);opacity:.8;box-shadow:0 0 9px rgba(59,130,246,.28)}
      .ka-radar{height:120px;position:relative;display:grid;place-items:center}.ka-radar>i{position:absolute;border:1px solid rgba(59,130,246,.30);border-radius:50%}.ka-radar .r1{width:54px;height:54px}.ka-radar .r2{width:92px;height:92px}.ka-radar .r3{width:126px;height:126px}.ka-radar>b{width:10px;height:10px;border-radius:50%;background:#38bdf8;box-shadow:0 0 20px #38bdf8}.ka-radar>span{position:absolute;width:8px;height:8px;border-radius:50%;background:var(--ka-gold);box-shadow:0 0 12px var(--ka-gold)}
      .ka-graph-map{height:120px;position:relative}.ka-graph-map svg{position:absolute;inset:0;width:100%;height:100%}.ka-graph-map line{stroke:rgba(59,130,246,.32);stroke-width:.5}.ka-graph-map span{position:absolute;transform:translate(-50%,-50%);width:26px;height:26px;border-radius:50%;display:grid;place-items:center;border:1px solid var(--ka-blue);background:#071525;color:#dbeafe;font-size:7px;font-weight:900;box-shadow:0 0 14px rgba(59,130,246,.28)}
      .ka-intel-proof span{display:block;color:var(--ka-text2);font-size:8px;letter-spacing:.08em}.ka-intel-proof b{display:block;margin-top:4px;color:var(--ka-text);font-size:10px;overflow-wrap:anywhere}.ka-evidence-chip{display:flex;flex-direction:column;gap:4px;border:1px solid var(--ka-border);border-radius:12px;padding:12px;text-decoration:none;color:var(--ka-text2);font-size:10px}.ka-evidence-chip:hover{border-color:var(--ka-blue)}.ka-evidence-chip b{color:var(--ka-text);font-size:9px}.ka-evidence-chip small{color:var(--ka-text2)}
      .ka-intel-orbit-stage{position:relative;min-height:280px;display:grid;grid-template-columns:minmax(0,.85fr) minmax(260px,1.3fr) minmax(0,.75fr);align-items:center;gap:22px;padding:22px;border:1px solid rgba(59,130,246,.22);border-radius:20px;background:radial-gradient(circle at 50% 50%,rgba(37,99,235,.16),transparent 34%),linear-gradient(135deg,rgba(4,16,31,.92),rgba(2,8,17,.96));box-shadow:inset 0 1px 0 rgba(255,255,255,.025),inset 0 -50px 90px rgba(0,0,0,.18);perspective:900px;overflow:hidden}
      .ka-intel-orbit-stage::before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,transparent 49.8%,rgba(59,130,246,.08) 50%,transparent 50.2%),linear-gradient(0deg,transparent 49.8%,rgba(59,130,246,.06) 50%,transparent 50.2%);background-size:100% 100%;opacity:.7}
      .ka-orbit-copy{position:relative;z-index:2}.ka-orbit-copy p{font-size:9px;letter-spacing:.18em;font-weight:900;color:var(--ka-blue)}.ka-orbit-copy h3{margin-top:8px;font-size:22px;line-height:1.08;font-weight:900;color:var(--ka-text)}.ka-orbit-copy span{display:block;margin-top:10px;font-size:11px;line-height:1.6;color:var(--ka-text2)}
      .ka-network-globe{position:relative;z-index:2;width:min(100%,270px);aspect-ratio:1;margin:auto;transform:rotateX(8deg);transform-style:preserve-3d;filter:drop-shadow(0 22px 34px rgba(0,0,0,.28))}
      .ka-globe-shell,.ka-globe-lat,.ka-globe-lon,.ka-globe-orbit{position:absolute;left:50%;top:50%;border-radius:50%;pointer-events:none}.ka-globe-shell{width:62%;height:62%;transform:translate(-50%,-50%);border:1px solid rgba(56,189,248,.5);background:radial-gradient(circle at 36% 30%,rgba(56,189,248,.22),rgba(37,99,235,.08) 38%,rgba(2,8,17,.72) 72%);box-shadow:inset -18px -14px 38px rgba(0,0,0,.5),inset 10px 8px 28px rgba(56,189,248,.08),0 0 42px rgba(37,99,235,.2)}
      .ka-globe-lat{width:58%;height:22%;transform:translate(-50%,-50%);border:1px solid rgba(56,189,248,.25)}.ka-globe-lat.lat-b{height:42%}.ka-globe-lon{width:24%;height:60%;transform:translate(-50%,-50%);border:1px solid rgba(56,189,248,.23)}.ka-globe-lon.lon-b{width:44%}
      .ka-globe-orbit{width:88%;height:34%;border:1px solid rgba(245,183,46,.35);transform:translate(-50%,-50%) rotate(-18deg);box-shadow:0 0 18px rgba(245,183,46,.05);animation:ka-orbit-breathe 4.8s ease-in-out infinite}.ka-globe-orbit.orbit-b{width:92%;height:38%;border-color:rgba(59,130,246,.32);transform:translate(-50%,-50%) rotate(28deg);animation-delay:-2.4s}
      .ka-globe-core{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:4;width:48px;height:48px;display:grid;place-items:center;border-radius:50%;border:1px solid rgba(245,183,46,.55);background:linear-gradient(145deg,#102a45,#06101c);color:var(--ka-gold);font-size:12px;letter-spacing:.08em;box-shadow:0 0 28px rgba(37,99,235,.3),0 0 16px rgba(245,183,46,.12)}
      .ka-network-globe>span{position:absolute;z-index:5;transform:translate(-50%,-50%);width:25px;height:25px;display:grid;place-items:center;border-radius:50%;border:1px solid rgba(56,189,248,.65);background:#071525;color:#e0f2fe;font-size:7px;font-weight:900;box-shadow:0 0 14px rgba(56,189,248,.25);animation:ka-node-pulse 3s ease-in-out infinite}
      .ka-orbit-telemetry{position:relative;z-index:2;display:grid;gap:8px}.ka-orbit-telemetry>div{padding:10px 12px;border-left:2px solid rgba(59,130,246,.38);background:linear-gradient(90deg,rgba(37,99,235,.07),transparent)}.ka-orbit-telemetry span{display:block;font-size:7px;letter-spacing:.13em;color:var(--ka-text2)}.ka-orbit-telemetry b{display:block;margin-top:4px;font-size:15px;color:var(--ka-text);font-variant-numeric:tabular-nums}
      .ka-intel-engine{transform:translateZ(0);box-shadow:inset 0 1px 0 rgba(255,255,255,.02),0 18px 38px rgba(0,0,0,.12)}.ka-graph-map{perspective:600px}.ka-graph-map svg{filter:drop-shadow(0 0 5px rgba(59,130,246,.22))}.ka-graph-map line{stroke-dasharray:3 2;animation:ka-evidence-flow 4s linear infinite}.ka-graph-map span{animation:ka-node-pulse 3.4s ease-in-out infinite}
      @keyframes ka-evidence-flow{to{stroke-dashoffset:-20}}@keyframes ka-node-pulse{0%,100%{box-shadow:0 0 10px rgba(59,130,246,.2)}50%{box-shadow:0 0 22px rgba(59,130,246,.48)}}@keyframes ka-orbit-breathe{0%,100%{opacity:.5}50%{opacity:1}}
      @media(max-width:900px){.ka-intel-orbit-stage{grid-template-columns:1fr 1.15fr}.ka-orbit-telemetry{grid-column:1/-1;grid-template-columns:repeat(4,minmax(0,1fr))}}
      @media(max-width:620px){.ka-intel-orbit-stage{grid-template-columns:1fr;padding:16px;gap:14px}.ka-orbit-copy{text-align:center}.ka-network-globe{width:min(82vw,250px)}.ka-orbit-telemetry{grid-template-columns:1fr 1fr}.ka-orbit-telemetry>div{padding:9px 10px}.ka-orbit-copy h3{font-size:19px}}
      /* Mobile command-center density polish: preserve evidence semantics while increasing visual depth. */
      @media(max-width:620px){
        .ka-intel-shell{padding-top:28px!important;padding-bottom:28px!important}
        .ka-intel-command{box-shadow:0 22px 64px rgba(0,0,0,.38),inset 0 0 72px rgba(37,99,235,.045)}
        .ka-intel-orbit-stage{min-height:0;background:radial-gradient(circle at 50% 43%,rgba(37,99,235,.24),transparent 31%),linear-gradient(150deg,rgba(5,20,38,.98),rgba(2,8,17,.99))}
        .ka-network-globe{width:min(88vw,292px);filter:drop-shadow(0 24px 34px rgba(0,0,0,.34)) drop-shadow(0 0 18px rgba(37,99,235,.16))}
        .ka-globe-shell{width:68%;height:68%;border-color:rgba(56,189,248,.68);box-shadow:inset -20px -15px 42px rgba(0,0,0,.52),inset 10px 8px 30px rgba(56,189,248,.13),0 0 48px rgba(37,99,235,.34)}
        .ka-globe-lat{border-color:rgba(56,189,248,.38)}.ka-globe-lon{border-color:rgba(56,189,248,.34)}
        .ka-globe-orbit{border-color:rgba(245,183,46,.52);box-shadow:0 0 24px rgba(245,183,46,.10)}.ka-globe-orbit.orbit-b{border-color:rgba(59,130,246,.52)}
        .ka-globe-core{width:54px;height:54px;box-shadow:0 0 34px rgba(37,99,235,.46),0 0 20px rgba(245,183,46,.18)}
        .ka-network-globe>span{width:29px;height:29px;border-color:rgba(56,189,248,.82);background:rgba(4,20,38,.96);box-shadow:0 0 20px rgba(56,189,248,.36)}
        .ka-orbit-telemetry{gap:6px}.ka-orbit-telemetry>div{min-height:58px;border:1px solid rgba(59,130,246,.12);border-left:2px solid rgba(59,130,246,.5);border-radius:8px;background:linear-gradient(135deg,rgba(37,99,235,.10),rgba(2,10,20,.42))}
        .ka-intel-engine{min-height:0!important;padding:15px}.ka-pulse-bars{height:62px;margin-top:10px!important}.ka-radar,.ka-graph-map{height:128px!important}
        .ka-graph-map{transform:perspective(520px) rotateX(7deg);transform-origin:center 60%;border-radius:14px;background:radial-gradient(circle at 50% 52%,rgba(37,99,235,.12),transparent 46%)}
        .ka-graph-map svg{filter:drop-shadow(0 0 8px rgba(59,130,246,.34))}.ka-graph-map line{stroke-width:1.15;stroke-opacity:.9;animation-duration:2.8s}
        .ka-graph-map span{transform:translate(-50%,-50%) translateZ(18px);box-shadow:0 0 18px rgba(59,130,246,.46)}
      }
      @media(max-width:420px){.ka-intel-command{border-radius:20px;padding:14px!important}.ka-intel-engine{min-height:0}.ka-intel-shell{padding-left:10px!important;padding-right:10px!important}.ka-intel-proof>div.grid{grid-template-columns:1fr 1fr}.ka-network-globe{width:min(86vw,276px)}.ka-orbit-copy h3{font-size:20px}.ka-orbit-copy span{font-size:10px}.ka-pulse-bars{height:54px}.ka-radar,.ka-graph-map{height:118px!important}}

      @media (prefers-reduced-motion:reduce){
        .ka-landing *, .ka-landing *::before, .ka-landing *::after{animation-duration:.01ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important;}
      }
    `}</style>
  );
}
