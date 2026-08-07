import React from 'react';

export default function SecurityToggle({ checked, onChange, disabled = false }) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`w-11 h-6 rounded-full transition-all relative shrink-0 tap-reset ${disabled ? 'bg-ka-card-border cursor-not-allowed' : checked ? 'bg-ka-emerald' : 'bg-ka-card-border'}`}
      aria-pressed={checked}
    >
      <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
        style={{ left: checked ? '1.375rem' : '0.125rem' }} />
    </button>
  );
}