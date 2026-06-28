import React, { useRef, useState, useCallback } from 'react';
import { Loader2, ChevronDown } from 'lucide-react';

const TRIGGER = 70;
const MAX_PULL = 120;

export default function PullToRefresh({ onRefresh, children, className = '' }) {
  const containerRef = useRef(null);
  const startYRef = useRef(0);
  const pullingRef = useRef(false);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const handleTouchStart = useCallback((e) => {
    const el = containerRef.current;
    if (!el || el.scrollTop > 0 || refreshing) return;
    startYRef.current = e.touches[0].clientY;
    pullingRef.current = true;
  }, [refreshing]);

  const handleTouchMove = useCallback((e) => {
    if (!pullingRef.current) return;
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta <= 0) return;
    setPull(Math.min(delta * 0.5, MAX_PULL));
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (!pullingRef.current) return;
    pullingRef.current = false;

    if (pull >= TRIGGER && onRefresh) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
    setPull(0);
  }, [pull, onRefresh]);

  const progress = Math.min(pull / TRIGGER, 1);

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto overscroll-contain ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200"
        style={{ height: refreshing ? TRIGGER : pull }}
      >
        {refreshing ? (
          <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
        ) : pull > 0 ? (
          <ChevronDown
            className="w-5 h-5 text-slate-500 transition-transform"
            style={{ transform: `rotate(0deg) scale(${progress})` }}
          />
        ) : null}
      </div>
      {children}
    </div>
  );
}