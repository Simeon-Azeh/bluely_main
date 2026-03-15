'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { FiSend, FiX, FiMaximize2 } from 'react-icons/fi';
import ChatLogCard, { ActionProposal } from './ChatLogCard';

interface ChatAction {
    type: string;
    data: Record<string, string>;
}

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    actions?: ChatAction[];
}

interface ChatSession {
    id: string;
    title: string;
    messages: ChatMessage[];
    updatedAt: number;
}

const DAILY_LIMIT = 15;
const STORAGE_KEY_SESSIONS = 'diabuddy_chat_sessions';
const STORAGE_KEY_ACTIVE = 'diabuddy_chat_active';
const STORAGE_KEY_USAGE = 'diabuddy_chat_usage';

function getChatCount(): { count: number; date: string } {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_USAGE);
        if (raw) {
            const parsed = JSON.parse(raw);
            const today = new Date().toISOString().slice(0, 10);
            if (parsed.date === today) return { count: parsed.count, date: today };
        }
    } catch { /* ignore */ }
    return { count: 0, date: new Date().toISOString().slice(0, 10) };
}

function incrementChatCount(): number {
    const today = new Date().toISOString().slice(0, 10);
    const { count, date } = getChatCount();
    const newCount = date === today ? count + 1 : 1;
    localStorage.setItem(STORAGE_KEY_USAGE, JSON.stringify({ count: newCount, date: today }));
    return newCount;
}

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function loadSessions(): ChatSession[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch { /* ignore */ }
    return [];
}

function saveSessions(sessions: ChatSession[]) {
    try {
        localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions.slice(0, 20)));
    } catch { /* ignore */ }
}

function loadActiveId(): string | null {
    try { return localStorage.getItem(STORAGE_KEY_ACTIVE); } catch { return null; }
}

function saveActiveId(id: string) {
    try { localStorage.setItem(STORAGE_KEY_ACTIVE, id); } catch { /* ignore */ }
}

function cleanMealDescription(description: string | undefined, mealType: string): string {
    if (!description) return mealType;
    let clean = description
        .replace(/^(I\s+(just\s+)?(had|ate|eaten|got|grabbed|made)\s+)/i, '')
        .replace(/^(about\s+)/i, '')
        .trim();
    clean = clean
        .replace(/^(a\s+)?(plate|bowl|cup|glass|serving|portion|piece|slice|handful)s?\s+(of\s+)?/i, '')
        .trim();
    clean = clean
        .replace(/\s*(about\s+)?\d+\s+(dishing\s+)?\s*(spoons?|cups?|scoops?|servings?|pieces?|slices?|bowls?|plates?)\s*(of\s+)?/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    if (clean.length > 60) clean = clean.slice(0, 57) + '...';
    return clean || mealType;
}

function extractTitle(messages: ChatMessage[]): string {
    const firstUser = messages.find((m) => m.role === 'user');
    if (firstUser) return firstUser.content.length > 40 ? firstUser.content.slice(0, 40) + '...' : firstUser.content;
    return 'New chat';
}

function getFirstName(displayName: string | null | undefined): string {
    if (!displayName) return '';
    if (displayName.includes('@')) return '';
    const first = displayName.split(' ')[0];
    if (first.length > 20 || /[^a-zA-Z\-']/.test(first)) return '';
    return first;
}

function formatTimestamp(ts: number): string {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

interface FloatingChatProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function FloatingChat({ isOpen, onClose }: FloatingChatProps) {
    const { user } = useAuth();
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [chatCount, setChatCount] = useState(0);
    const [initialized, setInitialized] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const firstName = getFirstName(user?.displayName);
    const userInitial = firstName ? firstName[0].toUpperCase() : (user?.email?.[0]?.toUpperCase() || '?');
    const remaining = Math.max(0, DAILY_LIMIT - chatCount);
    const limitReached = chatCount >= DAILY_LIMIT;

    const activeSession = sessions.find((s) => s.id === activeSessionId);
    const messages = activeSession?.messages || [];

    const makeGreeting = useCallback((name: string) => {
        return name
            ? `Hey ${name}! Ask me anything about your diabetes, glucose, meals, or medications.`
            : `Hey! Ask me anything about your diabetes, glucose, meals, or medications.`;
    }, []);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

    // Save sessions whenever they change
    useEffect(() => {
        if (initialized && sessions.length > 0) saveSessions(sessions);
    }, [sessions, initialized]);

    // Initialize: load shared sessions from localStorage
    useEffect(() => {
        if (!isOpen) return;
        setChatCount(getChatCount().count);
        const loaded = loadSessions();
        const savedActiveId = loadActiveId();

        if (loaded.length > 0) {
            setSessions(loaded);
            if (savedActiveId && loaded.find((s) => s.id === savedActiveId)) {
                setActiveSessionId(savedActiveId);
            } else {
                setActiveSessionId(loaded[0].id);
            }
        } else {
            const newSession: ChatSession = {
                id: generateId(),
                title: 'New chat',
                messages: [{ role: 'assistant', content: makeGreeting(firstName), timestamp: Date.now() }],
                updatedAt: Date.now(),
            };
            setSessions([newSession]);
            setActiveSessionId(newSession.id);
        }
        setInitialized(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    // Re-sync from localStorage when widget opens (in case /chat page wrote new data)
    useEffect(() => {
        if (isOpen && initialized) {
            const fresh = loadSessions();
            if (fresh.length > 0 && JSON.stringify(fresh) !== JSON.stringify(sessions)) {
                setSessions(fresh);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    useEffect(() => {
        if (activeSessionId) saveActiveId(activeSessionId);
    }, [activeSessionId]);

    useEffect(() => {
        if (isOpen) inputRef.current?.focus();
    }, [isOpen]);

    const updateActiveMessages = useCallback((updater: (prev: ChatMessage[]) => ChatMessage[]) => {
        setSessions((prev) => prev.map((s) => {
            if (s.id !== activeSessionId) return s;
            const newMessages = updater(s.messages);
            return { ...s, messages: newMessages, title: extractTitle(newMessages), updatedAt: Date.now() };
        }));
    }, [activeSessionId]);

    const handleLogComplete = useCallback(async (logType: 'glucose' | 'meal') => {
        if (logType !== 'glucose' || !user) return;
        try {
            const res = await api.getMeals(user.uid, 1);
            const lastMeal = res.meals?.[0];
            if (lastMeal) {
                const mealTime = new Date(lastMeal.timestamp);
                const hoursSince = (Date.now() - mealTime.getTime()) / (1000 * 60 * 60);
                const timeLabel = mealTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                const mealDesc = cleanMealDescription(lastMeal.description, lastMeal.mealType);
                const followUp = hoursSince > 2
                    ? `Got it! By the way, your last meal was **${mealDesc}** around ${timeLabel}. Have you eaten anything since then? I can help you log it!`
                    : `Got it! Looks like you had **${mealDesc}** not too long ago (${timeLabel}). If you eat anything else, just let me know and I'll log it for you!`;
                updateActiveMessages((prev) => [...prev, { role: 'assistant', content: followUp, timestamp: Date.now() }]);
            } else {
                updateActiveMessages((prev) => [...prev, { role: 'assistant', content: `Got it! Have you eaten anything recently? I can help you log a meal too!`, timestamp: Date.now() }]);
            }
        } catch {
            // silently skip follow-up
        }
    }, [user, updateActiveMessages]);

    const sendMessage = async () => {
        const trimmed = input.trim();
        if (!trimmed || isLoading || !user || limitReached || !activeSessionId) return;

        updateActiveMessages((prev) => [...prev, { role: 'user', content: trimmed, timestamp: Date.now() }]);
        setInput('');
        setIsLoading(true);

        if (inputRef.current) inputRef.current.style.height = 'auto';

        try {
            const history = messages
                .filter((m) => m.role === 'user' || m.role === 'assistant')
                .slice(1)
                .map(({ role, content }) => ({ role, content }));

            const result = await api.chatWithDiaBuddy(user.uid, trimmed, history, user.displayName);
            const newCount = incrementChatCount();
            setChatCount(newCount);
            updateActiveMessages((prev) => [...prev, { role: 'assistant', content: result.reply, timestamp: Date.now(), actions: result.actions }]);
        } catch {
            updateActiveMessages((prev) => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble right now. Try again in a moment!", timestamp: Date.now() }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed z-50 bottom-24 right-4 md:bottom-8 md:right-8 w-[340px] sm:w-[380px] max-h-[520px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-[#1F2F98] to-[#3B4CC0] text-white shrink-0">
                <div className="flex items-center gap-2">
                    <Image src="/diabuddy.png" alt="DiaBuddy" width={30} height={30} className="rounded-full ring-2 ring-white/20" />
                    <div>
                        <h3 className="text-sm font-bold leading-tight">DiaBuddy</h3>
                        <p className="text-[10px] text-white/60">Your diabetes companion</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <div className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-0.5 mr-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${remaining > 3 ? 'bg-green-300' : remaining > 0 ? 'bg-amber-300' : 'bg-red-300'}`} />
                        <span className="text-[10px] text-white/70 font-medium">{remaining}</span>
                    </div>
                    <Link
                        href="/dashboard/chat"
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                        title="Open full chat"
                    >
                        <FiMaximize2 size={14} />
                    </Link>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                        <FiX size={16} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 min-h-0 max-h-[340px]">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex items-end gap-1.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && (
                            <Image src="/diabuddy.png" alt="" width={22} height={22} className="rounded-full shrink-0 mb-3" />
                        )}
                        <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[80%]`}>
                            <div className={`rounded-2xl px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap font-[450] ${msg.role === 'user'
                                ? 'bg-[#1F2F98] text-white rounded-br-sm'
                                : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                                }`}>
                                {msg.content}
                            </div>
                            {msg.actions && msg.actions.length > 0 && (
                                <div className="mt-1 space-y-0.5 w-full">
                                    {msg.actions.map((action, ai) => {
                                        const prevUserMsg = messages.slice(0, i).reverse().find(m => m.role === 'user');
                                        return (
                                            <ChatLogCard
                                                key={ai}
                                                action={action as ActionProposal}
                                                firebaseUid={user?.uid || ''}
                                                compact
                                                messageTimestamp={prevUserMsg?.timestamp}
                                                onLogged={handleLogComplete}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                            <span className="text-[9px] mt-0.5 px-0.5 text-gray-400">{formatTimestamp(msg.timestamp)}</span>
                        </div>
                        {msg.role === 'user' && (
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#1F2F98] to-[#4F5FD8] flex items-center justify-center shrink-0 mb-3 text-[9px] font-bold text-white">
                                {userInitial}
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className="flex items-center gap-1.5">
                        <Image src="/diabuddy.png" alt="" width={22} height={22} className="rounded-full shrink-0" />
                        <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-3 py-2.5">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[12px] text-[#1F2F98] font-medium">Thinking</span>
                                <span className="flex gap-0.5">
                                    <span className="w-1 h-1 bg-[#1F2F98]/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1 h-1 bg-[#1F2F98]/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-1 h-1 bg-[#1F2F98]/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Limit banner */}
            {limitReached && (
                <div className="mx-3 mb-1 flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1.5 text-[11px] text-amber-700 shrink-0">
                    Daily limit reached. Come back tomorrow!
                </div>
            )}

            {/* Input */}
            <div className="border-t border-gray-100 px-2.5 py-2 shrink-0">
                <div className="flex items-end gap-1.5">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder={limitReached ? 'Daily limit reached' : 'Ask DiaBuddy...'}
                        rows={1}
                        className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] font-[450] focus:outline-none focus:ring-1 focus:ring-[#1F2F98]/20 focus:border-[#1F2F98]/30 focus:bg-white placeholder-gray-400 transition-all"
                        disabled={isLoading || limitReached}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!input.trim() || isLoading || limitReached}
                        className="p-2 rounded-xl bg-[#1F2F98] text-white disabled:opacity-30 hover:bg-[#1a2880] transition-all active:scale-95 shrink-0"
                    >
                        <FiSend size={15} />
                    </button>
                </div>
            </div>
        </div>
    );
}
