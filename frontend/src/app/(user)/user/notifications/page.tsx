'use client';

import { useState, useEffect } from "react";
import { BellRing, TrendingUp, Wallet, CheckCircle, AlertCircle } from "lucide-react";
import { UserShell } from "@/components/layout/user-shell";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

type Notification = {
  id: string;
  category: 'IPO Alerts' | 'Deposit & Withdrawal updates' | 'Approval notifications' | 'System alerts';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
};

const categoryIcons = {
  'IPO Alerts': TrendingUp,
  'Deposit & Withdrawal updates': Wallet,
  'Approval notifications': CheckCircle,
  'System alerts': AlertCircle,
};

const categoryColors = {
  'IPO Alerts': 'text-blue-400 bg-blue-500/20',
  'Deposit & Withdrawal updates': 'text-emerald-400 bg-emerald-500/20',
  'Approval notifications': 'text-purple-400 bg-purple-500/20',
  'System alerts': 'text-amber-400 bg-amber-500/20',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  async function loadNotifications() {
    try {
      setLoading(true);
      const userToken = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
      const userId = userToken ? userToken.replace('token-', '') : undefined;

      if (!userId) {
        setLoading(false);
        return;
      }

      const data = await api.user.getNotifications(userId);
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      // Silently handle errors - user might not have notifications yet
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }

  async function markAllRead() {
    try {
      const userToken = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
      const userId = userToken ? userToken.replace('token-', '') : undefined;
      
      if (userId) {
        await api.user.markAllNotificationsAsRead(userId);
        setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      // Still update UI optimistically
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    }
  }

  function formatTimestamp(timestamp: string) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  async function handleNotificationClick(notification: Notification) {
    // Mark as read if not already read
    if (!notification.read) {
      try {
        const userToken = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
        const userId = userToken ? userToken.replace('token-', '') : undefined;
        
        if (userId) {
          await api.user.markNotificationAsRead(userId, notification.id);
          // Update local state optimistically
          setNotifications((prev) =>
            prev.map((item) =>
              item.id === notification.id ? { ...item, read: true } : item
            )
          );
        }
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
        // Still navigate even if marking as read fails
      }
    }

    // Navigate to link if available
    if (notification.link) {
      router.push(notification.link);
    }
  }

  const groupedNotifications = notifications.reduce((acc, notif) => {
    if (!acc[notif.category]) {
      acc[notif.category] = [];
    }
    acc[notif.category].push(notif);
    return acc;
  }, {} as Record<string, Notification[]>);

  const categories: Array<keyof typeof categoryIcons> = [
    'IPO Alerts',
    'Deposit & Withdrawal updates',
    'Approval notifications',
    'System alerts',
  ];

  if (loading) {
    return (
      <UserShell
        title="Notifications"
        subtitle="IPO Alerts, Deposit & Withdrawal updates, Approval notifications, System alerts"
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-white/60" />
        </div>
      </UserShell>
    );
  }

  return (
    <UserShell
      title="Notifications"
      subtitle="IPO Alerts, Deposit & Withdrawal updates, Approval notifications, System alerts"
      actions={
        <button
          onClick={markAllRead}
          className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-widest text-white/80 hover:bg-white/5 transition"
        >
          Mark all read
        </button>
      }
    >
      <div className="space-y-6">
        {categories.map((category) => {
          const categoryNotifications = groupedNotifications[category] || [];
          if (categoryNotifications.length === 0) return null;

          const Icon = categoryIcons[category];
          const unreadCount = categoryNotifications.filter(n => !n.read).length;

          return (
            <div key={category} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={cn("flex size-10 items-center justify-center rounded-xl", categoryColors[category])}>
                  <Icon className="size-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{category}</h3>
                  <p className="text-xs text-white/60">{categoryNotifications.length} notification{categoryNotifications.length !== 1 ? 's' : ''}</p>
                </div>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-blue-500 px-2 py-1 text-xs font-semibold text-white">
                    {unreadCount}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {categoryNotifications.map((item) => (
                  <article
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={cn(
                      "flex gap-4 rounded-2xl border px-4 py-3 cursor-pointer transition hover:bg-white/5",
                      item.read ? "opacity-60 border-white/5" : "border-white/10 bg-white/[0.02]",
                      item.link && "hover:border-white/20"
                    )}
                  >
                    <div className={cn("flex size-10 items-center justify-center rounded-xl flex-shrink-0", categoryColors[category])}>
                      <Icon className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className={cn("font-semibold text-sm", item.read ? "text-white/70" : "text-white")}>
                            {item.title}
                          </p>
                          <p className={cn("text-sm mt-1", item.read ? "text-white/50" : "text-white/70")}>
                            {item.message}
                          </p>
                        </div>
                        {!item.read && (
                          <div className="size-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-white/40 mt-2">{formatTimestamp(item.timestamp)}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          );
        })}

        {notifications.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-12 text-center">
            <BellRing className="size-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/60">No notifications yet</p>
            <p className="text-sm text-white/40 mt-2">You'll see updates here when they arrive</p>
          </div>
        )}
      </div>
    </UserShell>
  );
}
