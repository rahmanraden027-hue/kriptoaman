import React from 'react';
import PaperTrading from './PaperTrading.jsx';

export default function PaperTradingMobilePolish() {
  return (
    <div className="ka-paper-trading-polish">
      <style>{`
        .ka-paper-trading-polish > .min-h-screen {
          padding-bottom: calc(10.5rem + env(safe-area-inset-bottom, 0px)) !important;
        }

        @media (max-width: 639px) {
          .ka-global-shell:has(.ka-paper-trading-polish) > .h-8 {
            height: 0.25rem !important;
          }

          .ka-paper-trading-polish > .min-h-screen > .max-w-7xl {
            gap: 0.75rem;
            padding-top: 0.5rem;
          }

          .ka-paper-trading-polish > .min-h-screen > .max-w-7xl > section:first-child {
            border-radius: 22px;
            padding: 1rem;
          }

          .ka-paper-trading-polish > .min-h-screen > .max-w-7xl > section:first-child h1 {
            margin-top: 0.75rem;
            font-size: 1.45rem;
            line-height: 1.2;
          }

          .ka-paper-trading-polish > .min-h-screen > .max-w-7xl > section:first-child h1 + p {
            margin-top: 0.6rem;
            font-size: 0.8rem;
            line-height: 1.35rem;
          }

          .ka-paper-trading-polish > .min-h-screen > .max-w-7xl > section:first-child [class*="mt-4"][class*="grid"] {
            margin-top: 0.75rem;
          }

          .ka-paper-trading-polish > .min-h-screen > .max-w-7xl > section:first-child [class*="rounded-xl"] {
            padding: 0.75rem;
          }

          .ka-paper-trading-polish > .min-h-screen > .max-w-7xl > section:nth-child(2) {
            gap: 0.65rem;
          }

          .ka-paper-trading-polish > .min-h-screen > .max-w-7xl > section:nth-child(2) > div {
            padding: 0.85rem 1rem;
          }

          .ka-paper-trading-polish > .min-h-screen > .max-w-7xl > section:nth-child(2) > div > div:last-child {
            margin-top: 0.35rem;
            font-size: 1.45rem;
          }

          .ka-paper-trading-polish select,
          .ka-paper-trading-polish input {
            font-size: 16px;
          }

          .ka-paper-trading-polish button {
            touch-action: manipulation;
          }
        }
      `}</style>
      <PaperTrading />
    </div>
  );
}
