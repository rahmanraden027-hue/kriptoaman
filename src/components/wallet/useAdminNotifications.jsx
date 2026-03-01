import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export function useAdminNotifications() {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((transaction) => {
    const id = Date.now();
    const isReceived = transaction.type === 'received';
    const verb = isReceived ? 'Diterima' : 'Dikirim';
    const action = isReceived ? 'deposit' : 'withdrawal';

    // Show toast
    toast.success(
      `${verb} ${transaction.amount} ${transaction.coin}`,
      {
        description: `${transaction.coin} ${verb.toLowerCase()} - Status: ${transaction.status}`,
        duration: 5000,
        icon: isReceived ? '📥' : '📤',
      }
    );

    // Add to notifications list
    const newNotif = {
      id,
      ...transaction,
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 50)); // Keep last 50

    return id;
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const getUnreadCount = () => notifications.filter(n => !n.read).length;

  return {
    notifications,
    addNotification,
    markAsRead,
    dismissNotification,
    unreadCount: getUnreadCount(),
  };
}