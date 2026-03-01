import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingState({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      <p className="text-slate-400 text-sm">{text}</p>
    </div>
  );
}