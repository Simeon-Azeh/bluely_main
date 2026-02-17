'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Card, CardContent, Button } from '@/components/ui';
import {
    FiBell, FiCheckCircle, FiTrash2, FiZap,
    FiClock, FiActivity, FiAward, FiSettings, FiAlertCircle,
} from 'react-icons/fi';
import { TbPill } from 'react-icons/tb';

interface Notification {
    _id: string;
    type: 'prediction' | 'reminder' | 'medication' | 'insight' | 'achievement' | 'system';
    title: string;
    message: string;
    isRead: boolean;
    data?: Record<string, unknown>;
    createdAt: string;
}

const typeConfig: Record<string, { Icon: React.ElementType; color: string; bg: string }> = {
    prediction: { Icon: FiZap, color: 'text-blue-600', bg: 'bg-blue-100' },
    reminder: { Icon: FiClock, color: 'text-amber-600', bg: 'bg-amber-100' },
    medication: { Icon: TbPill, color: 'text-purple-600', bg: 'bg-purple-100' },
    insight: { Icon: FiActivity, color: 'text-green-600', bg: 'bg-green-100' },
    achievement: { Icon: FiAward, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    system: { Icon: FiSettings, color: 'text-gray-600', bg: 'bg-gray-100' },
};

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function NotificationsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
    }, [user, authLoading, router]);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        try {
            const res = await api.getNotifications(user.uid, filter === 'unread');
            setNotifications(res.notifications || []);
            setUnreadCount(res.unreadCount ?? 0);
        } catch (err) {
            console.error('Failed to load notifications:', err);
        }
    }, [user, filter]);

    useEffect(() => {
        if (user) {
            fetchNotifications().finally(() => setLoading(false));
        }
    }, [user, fetchNotifications]);

    const handleMarkRead = async (id: string) => {
        try {
            await api.markNotificationRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
            );
            setUnreadCount((c) => Math.max(0, c - 1));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to mark as read');
        }
    };

    const handleMarkAllRead = async () => {
        if (!user) return;
        try {
            await api.markAllNotificationsRead(user.uid);
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to mark all as read');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await api.deleteNotification(id);
            setNotifications((prev) => {
                const removed = prev.find((n) => n._id === id);
                if (removed && !removed.isRead) setUnreadCount((c) => Math.max(0, c - 1));
                return prev.filter((n) => n._id !== id);
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete');
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#1F2F98] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-24 md:pb-8">
            <div className="max-w-2xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <FiBell className="w-6 h-6 text-gray-900" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                            <p className="text-sm text-gray-500">
                                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                            </p>
                        </div>
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            onClick={handleMarkAllRead}
                            className="text-sm text-[#1F2F98] hover:bg-[#1F2F98]/10 px-3 py-2 rounded-xl flex items-center gap-1.5"
                        >
                            <FiCheckCircle className="w-4 h-4" />
                            Mark all read
                        </Button>
                    )}
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
                        <FiAlertCircle className="shrink-0" />
                        {error}
                        <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
                            &times;
                        </button>
                    </div>
                )}

                {/* Filter tabs */}
                <div className="flex gap-2 mb-4">
                    <button
                        type="button"
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === 'all'
                            ? 'bg-[#1F2F98] text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        All
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter('unread')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === 'unread'
                            ? 'bg-[#1F2F98] text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        Unread
                        {unreadCount > 0 && (
                            <span className="ml-1.5 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Notification List */}
                {notifications.length === 0 ? (
                    <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
                        <CardContent>
                            <div className="text-center py-12">
                                <FiBell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                <p className="text-gray-500 text-sm">
                                    {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                                </p>
                                <p className="text-gray-400 text-xs mt-1">
                                    {filter === 'unread'
                                        ? 'Switch to "All" to see past notifications'
                                        : 'Notifications from predictions, reminders, and insights will appear here'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {notifications.map((n) => {
                            const cfg = typeConfig[n.type] || typeConfig.system;
                            const { Icon } = cfg;
                            return (
                                <div
                                    key={n._id}
                                    className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${n.isRead
                                        ? 'bg-white border-gray-100'
                                        : 'bg-blue-50/40 border-blue-100'
                                        }`}
                                >
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className={`text-sm truncate ${n.isRead ? 'font-medium text-gray-700' : 'font-semibold text-gray-900'
                                                }`}>
                                                {n.title}
                                            </h3>
                                            <span className="text-xs text-gray-400 shrink-0 whitespace-nowrap">
                                                {timeAgo(n.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                            {n.message}
                                        </p>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 mt-2">
                                            {!n.isRead && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleMarkRead(n._id)}
                                                    className="text-xs text-[#1F2F98] hover:underline flex items-center gap-1"
                                                >
                                                    <FiCheckCircle className="w-3 h-3" />
                                                    Mark read
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(n._id)}
                                                className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1"
                                            >
                                                <FiTrash2 className="w-3 h-3" />
                                                Delete
                                            </button>
                                        </div>
                                    </div>

                                    {/* Unread indicator */}
                                    {!n.isRead && (
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#1F2F98] shrink-0 mt-1.5" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
