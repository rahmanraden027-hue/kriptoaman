import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { User, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function UserProfileBadge() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setUser(u)).catch(() => {});
  }, []);

  if (!user) return null;

  const initials = user.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email?.[0]?.toUpperCase() || 'U';

  return (
    <Link to={createPageUrl('Settings')}
      className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700/50 rounded-full hover:bg-slate-700/80 transition-colors">
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
        {initials}
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-white text-xs font-semibold truncate max-w-[100px]">
          {user.full_name || user.email}
        </span>
        <span className="text-slate-400 text-[9px] capitalize">{user.role || 'user'}</span>
      </div>
    </Link>
  );
}