import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, X, AlertCircle, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ICON_MAP = {
  alert: <Bell className="w-4 h-4 text-blue-400" />,
  warning: <AlertTriangle className="w-4 h-4 text-yellow-400" />,
  critical: <AlertCircle className="w-4 h-4 text-red-400" />,
  info: <Info className="w-4 h-4 text-slate-400" />,
};

const COLOR_MAP = {
  alert: 'bg-blue-500/10 border-blue-500/30',
  warning: 'bg-yellow-500/10 border-yellow-500/30',
  critical: 'bg-red-500/10 border-red-500/30',
  info: 'bg-slate-700/30 border-slate-600/30',
};

export default function NotificationCenter() {
  const [showPanel, setShowPanel] = useState(false);
  const [filter, setFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const result = await base44.entities.TradingNotification.list('-created_date', 50);
      return result;
    },
    refetchInterval: 5000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.TradingNotification.update(id, { isRead: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => base44.entities.TradingNotification.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const criticalCount = notifications.filter(n => n.type === 'critical' && !n.isAcknowledged).length;

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'critical') return n.type === 'critical' && !n.isAcknowledged;
    return n.type === filter;
  });

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 text-slate-300 hover:text-white transition-colors"
      >
        <Bell className="w-6 h-6" />
        {(unreadCount > 0 || criticalCount > 0) && (
          <span className={`absolute top-0 right-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${criticalCount > 0 ? 'bg-red-500' : 'bg-blue-500'}`}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {showPanel && (
        <div className="absolute right-0 top-12 w-96 max-h-[600px] bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 bg-slate-800/95 border-b border-slate-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white">Notifications</h3>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowPanel(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 text-xs">
              {['all', 'critical', 'warning', 'alert', 'info'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2 py-1 rounded-lg transition-colors ${
                    filter === f
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto space-y-2 p-4">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map(notif => (
                <div
                  key={notif.id}
                  className={`p-3 rounded-lg border ${COLOR_MAP[notif.type] || COLOR_MAP.info} ${!notif.isRead ? 'border-l-4' : ''}`}
                  onClick={() => !notif.isRead && markAsReadMutation.mutate(notif.id)}
                >
                  <div className="flex items-start gap-3">
                    {ICON_MAP[notif.type]}
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">{notif.title}</p>
                      <p className="text-xs text-slate-400 mt-1">{notif.message}</p>
                      {notif.strategyName && (
                        <p className="text-xs text-slate-500 mt-1">Strategy: {notif.strategyName}</p>
                      )}
                      <p className="text-xs text-slate-600 mt-2">
                        {new Date(notif.created_date).toLocaleTimeString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotificationMutation.mutate(notif.id);
                      }}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}