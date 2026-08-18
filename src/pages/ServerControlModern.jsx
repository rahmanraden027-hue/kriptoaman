import React from 'react';
import ServerControl from './ServerControl';

export default function ServerControlModern() {
  return (
    <div className="ka-server-modern">
      <style>{`
        .ka-server-modern {
          min-height: 100vh;
          background:
            radial-gradient(900px 520px at 6% -8%, rgba(56,189,248,.14), transparent 58%),
            radial-gradient(760px 460px at 96% 0%, rgba(99,102,241,.12), transparent 58%),
            #030914;
        }

        .ka-server-modern .min-h-screen.bg-gradient-to-br {
          background:
            linear-gradient(rgba(56,189,248,.028) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56,189,248,.028) 1px, transparent 1px),
            radial-gradient(1000px 560px at 50% -10%, rgba(14,165,233,.09), transparent 62%),
            transparent !important;
          background-size: 30px 30px, 30px 30px, auto, auto !important;
          padding-top: 1.25rem !important;
        }

        .ka-server-modern .max-w-2xl {
          max-width: 80rem !important;
        }

        .ka-server-modern .max-w-2xl > :first-child {
          position: relative;
          overflow: hidden;
          padding: 1.25rem 1.35rem;
          border: 1px solid rgba(56,189,248,.22);
          border-radius: 24px;
          background: linear-gradient(135deg, rgba(8,22,40,.92), rgba(4,12,25,.78));
          box-shadow: 0 22px 70px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.035);
        }

        .ka-server-modern .max-w-2xl > :first-child::after {
          content: 'INFRASTRUCTURE COMMAND · OWNER CONTROL';
          position: absolute;
          right: 1rem;
          top: .85rem;
          padding: .35rem .6rem;
          border: 1px solid rgba(56,189,248,.2);
          border-radius: 999px;
          background: rgba(56,189,248,.07);
          color: rgb(125 211 252);
          font-size: 8px;
          font-weight: 800;
          letter-spacing: .14em;
        }

        .ka-server-modern .max-w-2xl > :nth-child(2) {
          border-radius: 20px !important;
          border-color: rgba(99,102,241,.28) !important;
          background: linear-gradient(135deg, rgba(99,102,241,.1), rgba(14,165,233,.055)) !important;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.03);
        }

        .ka-server-modern [class*='rounded-2xl'][class*='overflow-hidden'],
        .ka-server-modern [class*='rounded-2xl'][class*='p-5'] {
          border-color: rgba(71,103,139,.34) !important;
          background: linear-gradient(145deg, rgba(8,22,39,.84), rgba(4,12,24,.76)) !important;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.025), 0 12px 40px rgba(0,0,0,.18);
          backdrop-filter: blur(18px);
        }

        .ka-server-modern [class*='rounded-2xl'][class*='overflow-hidden'] > button {
          min-height: 72px;
          background: linear-gradient(90deg, rgba(56,189,248,.035), rgba(99,102,241,.025)) !important;
          border-bottom-color: rgba(56,189,248,.08) !important;
        }

        .ka-server-modern [class*='rounded-2xl'][class*='overflow-hidden'] > button:hover {
          background: linear-gradient(90deg, rgba(56,189,248,.08), rgba(99,102,241,.055)) !important;
        }

        .ka-server-modern [class*='rounded-2xl'][class*='overflow-hidden'] > button > div:first-child > div:first-child {
          box-shadow: 0 0 24px rgba(56,189,248,.1);
        }

        .ka-server-modern [class*='bg-slate-950'][class*='border'][class*='rounded-xl'] {
          background: rgba(1,8,18,.82) !important;
          border-color: rgba(56,189,248,.15) !important;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.02);
        }

        .ka-server-modern code,
        .ka-server-modern pre {
          font-variant-ligatures: none;
        }

        .ka-server-modern a[target='_blank'] {
          border-radius: 10px;
          padding: .35rem .55rem;
          background: rgba(56,189,248,.045);
          text-decoration: none !important;
        }

        .ka-server-modern button,
        .ka-server-modern a {
          transition: transform .16s ease, border-color .2s ease, background .2s ease, color .2s ease, box-shadow .2s ease;
        }

        .ka-server-modern button:active,
        .ka-server-modern a:active {
          transform: scale(.985);
        }

        @media (min-width: 1024px) {
          .ka-server-modern .max-w-2xl {
            padding-left: 1rem;
            padding-right: 1rem;
          }

          .ka-server-modern .max-w-2xl > :first-child {
            padding: 1.5rem 1.6rem;
          }
        }

        @media (max-width: 640px) {
          .ka-server-modern .max-w-2xl > :first-child::after {
            display: none;
          }

          .ka-server-modern .min-h-screen.bg-gradient-to-br {
            padding-left: .75rem !important;
            padding-right: .75rem !important;
          }
        }
      `}</style>
      <ServerControl />
    </div>
  );
}
