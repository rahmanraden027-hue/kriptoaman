import React from 'react';
import UserProfileBadge from './UserProfileBadge';

export default function AppHeader({ title, subtitle }) {
  return (
    <div className="pt-4 pb-2 flex items-center justify-between">
      <div>
        {title && <h1 className="text-white font-bold text-lg leading-tight">{title}</h1>}
        {subtitle && <p className="text-slate-400 text-xs">{subtitle}</p>}
      </div>
      <UserProfileBadge />
    </div>
  );
}