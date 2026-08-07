import React from 'react';

export default function Skeleton({ className = '', rounded = 'rounded-xl' }) {
  return <div className={`ka-shimmer ${rounded} ${className}`} />;
}