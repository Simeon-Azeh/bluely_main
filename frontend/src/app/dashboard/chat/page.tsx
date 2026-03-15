'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { FiArrowLeft, FiSend, FiAlertCircle, FiPlus, FiMessageSquare, FiX, FiTrash2 } from 'react-icons/fi';
import ChatLogCard, { ActionProposal } from '@/components/dashboard/ChatLogCard';

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

// ── Follow-up suggestion map ────────────────────────────────────────────────
const FOLLOWUP_MAP: Array<{ keywords: string[]; questions: string[] }> = [
    {
        keywords: ['blood sugar', 'glucose level', 'spike', 'high blood sugar'],
        questions: [
            'What are the best ways to prevent glucose spikes?',
            'How long after eating does blood sugar peak?',
            'What are symptoms of high blood sugar?',
        ],
    },
    {
        keywords: ['food', 'eat', 'meal', 'diet', 'nutrition', 'carb'],
        questions: [
            'What are low-glycemic foods I can eat?',
            'How do I count carbohydrates effectively?',
            'What are good snack options for diabetics?',
        ],
    },
    {
        keywords: ['exercise', 'activity', 'workout', 'walk', 'physical'],
        questions: [
            'When is the best time to exercise with diabetes?',
            'Can exercise cause low blood sugar?',
            'How much exercise is recommended per week?',
        ],
    },
    {
        keywords: ['stress', 'anxiety', 'mental', 'sleep', 'rest'],
        questions: [
            'How does poor sleep affect blood sugar?',
            'What relaxation techniques help with diabetes?',
            'Can stress raise glucose levels?',
        ],
    },
    {
        keywords: ['insulin', 'medication', 'medicine', 'dose'],
        questions: [
            'What should I ask my doctor about my medication?',
            'How does insulin work in the body?',
            'What happens if I miss a dose?',
        ],
    },
    {
        keywords: ['low blood sugar', 'hypo', 'hypoglycemia', 'shaky', 'dizzy'],
        questions: [
            'What should I eat during a low blood sugar episode?',
            'How can I prevent hypoglycemia?',
            'What are the warning signs of low blood sugar?',
        ],
    },
    {
        keywords: ['reading', 'data', 'log', 'trend', 'pattern', 'average', 'a1c'],
        questions: [
            'What do my recent glucose trends look like?',
            'Am I eating enough balanced meals?',
            'How is my activity affecting my glucose?',
        ],
    },
];

const DEFAULT_FOLLOWUPS = [
    'What foods help stabilize blood sugar?',
    'How does exercise affect glucose levels?',
    'What do my recent glucose readings look like?',
];

function getFollowUpQuestions(lastAssistantMessage: string): string[] {
    const lower = lastAssistantMessage.toLowerCase();
    for (const entry of FOLLOWUP_MAP) {
        if (entry.keywords.some((kw) => lower.includes(kw))) {
            return entry.questions;
        }
    }
    return DEFAULT_FOLLOWUPS;
}

// ── Timestamp formatter ─────────────────────────────────────────────────────

function formatTimestamp(ts: number): string {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    if (isToday) return time;
    if (isYesterday) return `Yesterday, ${time}`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + `, ${time}`;
}

// ── Chat count helpers ──────────────────────────────────────────────────────

function getChatCount(): { count: number; date: string } {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_USAGE);
        if (raw) {
            const parsed = JSON.parse(raw);
            const today = new Date().toISOString().slice(0, 10);
            if (parsed.date === today) {
                return { count: parsed.count, date: today };
            }
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

// ── Chat session persistence ────────────────────────────────────────────────

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function loadSessions(): ChatSession[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                // Migrate old single-chat format
                return parsed.map((s: ChatSession) => ({
                    ...s,
                    messages: s.messages.map((m) => ({ ...m, timestamp: m.timestamp || Date.now() })),
                }));
            }
        }
        // Migrate from old single-history format
        const oldHistory = localStorage.getItem('diabuddy_chat_history');
        if (oldHistory) {
            const msgs = JSON.parse(oldHistory) as ChatMessage[];
            if (Array.isArray(msgs) && msgs.length > 1) {
                const session: ChatSession = {
                    id: generateId(),
                    title: extractTitle(msgs),
                    messages: msgs.map((m) => ({ ...m, timestamp: m.timestamp || Date.now() })),
                    updatedAt: Date.now(),
                };
                localStorage.removeItem('diabuddy_chat_history');
                saveSessions([session]);
                return [session];
            }
            localStorage.removeItem('diabuddy_chat_history');
        }
    } catch { /* ignore */ }
    return [];
}

function saveSessions(sessions: ChatSession[]) {
    try {
        // Keep max 20 sessions
        const trimmed = sessions.slice(0, 20);
        localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(trimmed));
    } catch { /* ignore */ }
}

function loadActiveId(): string | null {
    try {
        return localStorage.getItem(STORAGE_KEY_ACTIVE);
    } catch { return null; }
}

function saveActiveId(id: string) {
    try {
        localStorage.setItem(STORAGE_KEY_ACTIVE, id);
    } catch { /* ignore */ }
}

function cleanMealDescription(description: string | undefined, mealType: string): string {
    if (!description) return mealType;
    // Strip conversational prefixes like "I had", "I ate", "I just ate"
    let clean = description
        .replace(/^(I\s+(just\s+)?(had|ate|eaten|got|grabbed|made)\s+)/i, '')
        .replace(/^(about\s+)/i, '')
        .trim();
    // Strip quantity/container qualifiers like "a plate of", "a bowl of"
    clean = clean
        .replace(/^(a\s+)?(plate|bowl|cup|glass|serving|portion|piece|slice|handful)s?\s+(of\s+)?/i, '')
        .trim();
    // Strip inline quantity phrases like "about 3 dishing spoons" or "2 cups of"
    clean = clean
        .replace(/\s*(about\s+)?\d+\s+(dishing\s+)?\s*(spoons?|cups?|scoops?|servings?|pieces?|slices?|bowls?|plates?)\s*(of\s+)?/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    // Truncate if still long
    if (clean.length > 60) clean = clean.slice(0, 57) + '...';
    return clean || mealType;
}

function extractTitle(messages: ChatMessage[]): string {
    const firstUser = messages.find((m) => m.role === 'user');
    if (firstUser) {
        return firstUser.content.length > 40
            ? firstUser.content.slice(0, 40) + '...'
            : firstUser.content;
    }
    return 'New chat';
}

// ── Name helper ─────────────────────────────────────────────────────────────

function getFirstName(displayName: string | null | undefined): string {
    if (!displayName) return '';
    if (displayName.includes('@')) return '';
    const first = displayName.split(' ')[0];
    if (first.length > 20 || /[^a-zA-Z\-']/.test(first)) return '';
    return first;
}

// ═════════════════════════════════════════════════════════════════════════════

export default function ChatPage() {
    const { user } = useAuth();
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [chatCount, setChatCount] = useState(0);
    const [initialized, setInitialized] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const firstName = getFirstName(user?.displayName);
    const userInitial = firstName ? firstName[0].toUpperCase() : (user?.email?.[0]?.toUpperCase() || '?');
    const remaining = Math.max(0, DAILY_LIMIT - chatCount);
    const limitReached = chatCount >= DAILY_LIMIT;

    // Active session's messages
    const activeSession = sessions.find((s) => s.id === activeSessionId);
    const messages = activeSession?.messages || [];

    const makeGreeting = useCallback((name: string) => {
        return name
            ? `Hey ${name}! I'm DiaBuddy, your diabetes companion. I can see your logged data too, so feel free to ask about your glucose trends, meals, or anything diabetes-related.`
            : `Hey! I'm DiaBuddy, your diabetes companion. I can see your logged data too, so feel free to ask about your glucose trends, meals, or anything diabetes-related.`;
    }, []);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Save sessions whenever they change
    useEffect(() => {
        if (initialized && sessions.length > 0) {
            saveSessions(sessions);
        }
    }, [sessions, initialized]);

    // Initialize: load sessions, set active
    useEffect(() => {
        setChatCount(getChatCount().count);
        const loaded = loadSessions();
        const savedActiveId = loadActiveId();

        if (loaded.length > 0) {
            setSessions(loaded);
            // Restore last active session, or default to most recent
            if (savedActiveId && loaded.find((s) => s.id === savedActiveId)) {
                setActiveSessionId(savedActiveId);
            } else {
                setActiveSessionId(loaded[0].id);
            }
        } else {
            // Create first session
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
    }, []);

    // Persist active session ID
    useEffect(() => {
        if (activeSessionId) saveActiveId(activeSessionId);
    }, [activeSessionId]);

    const createNewChat = () => {
        const newSession: ChatSession = {
            id: generateId(),
            title: 'New chat',
            messages: [{ role: 'assistant', content: makeGreeting(firstName), timestamp: Date.now() }],
            updatedAt: Date.now(),
        };
        setSessions((prev) => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
        setInput('');
        setShowSidebar(false);
    };

    const switchSession = (id: string) => {
        setActiveSessionId(id);
        setShowSidebar(false);
    };

    const deleteSession = (id: string) => {
        setSessions((prev) => {
            const filtered = prev.filter((s) => s.id !== id);
            if (id === activeSessionId) {
                if (filtered.length > 0) {
                    setActiveSessionId(filtered[0].id);
                } else {
                    // Create a new one if deleted the last
                    const newSession: ChatSession = {
                        id: generateId(),
                        title: 'New chat',
                        messages: [{ role: 'assistant', content: makeGreeting(firstName), timestamp: Date.now() }],
                        updatedAt: Date.now(),
                    };
                    setActiveSessionId(newSession.id);
                    return [newSession];
                }
            }
            return filtered;
        });
    };

    const updateActiveMessages = useCallback((updater: (prev: ChatMessage[]) => ChatMessage[]) => {
        setSessions((prev) => prev.map((s) => {
            if (s.id !== activeSessionId) return s;
            const newMessages = updater(s.messages);
            return {
                ...s,
                messages: newMessages,
                title: extractTitle(newMessages),
                updatedAt: Date.now(),
            };
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
            // silently skip follow-up if meal fetch fails
        }
    }, [user, updateActiveMessages]);

    const sendMessage = async () => {
        const trimmed = input.trim();
        if (!trimmed || isLoading || !user || limitReached || !activeSessionId) return;

        const userMessage: ChatMessage = { role: 'user', content: trimmed, timestamp: Date.now() };
        updateActiveMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
        }

        try {
            const history = messages
                .filter((m) => m.role === 'user' || m.role === 'assistant')
                .slice(1)
                .map(({ role, content }) => ({ role, content }));

            const result = await api.chatWithDiaBuddy(user.uid, trimmed, history, user.displayName);

            const newCount = incrementChatCount();
            setChatCount(newCount);

            updateActiveMessages((prev) => [
                ...prev,
                { role: 'assistant', content: result.reply, timestamp: Date.now(), actions: result.actions },
            ]);
        } catch {
            updateActiveMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: "Sorry, I'm having trouble right now. Please try again in a moment!",
                    timestamp: Date.now(),
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
    };

    const handleSuggestionClick = (q: string) => {
        setInput(q);
        inputRef.current?.focus();
    };

    const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant');
    const isFirstMessageOnly = messages.length <= 1;
    const showFollowUps = !isLoading && !limitReached && messages.length > 1;
    const followUps = lastAssistantMsg ? getFollowUpQuestions(lastAssistantMsg.content) : DEFAULT_FOLLOWUPS;

    const initialSuggestions = [
        'What do my recent glucose readings look like?',
        'What foods help stabilize blood sugar?',
        'How does exercise affect glucose?',
        'What causes blood sugar spikes?',
    ];

    const shouldShowDateSep = (i: number): string | null => {
        if (i === 0) return null;
        const prev = messages[i - 1];
        const curr = messages[i];
        const prevDate = new Date(prev.timestamp).toDateString();
        const currDate = new Date(curr.timestamp).toDateString();
        if (prevDate !== currDate) {
            const d = new Date(curr.timestamp);
            const now = new Date();
            if (d.toDateString() === now.toDateString()) return 'Today';
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
            return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        }
        return null;
    };

    return (
        <div className="flex flex-col h-[calc(100dvh-4rem)] bg-gradient-to-b from-slate-50 to-gray-100 relative">
            {/* ── Chat History Sidebar (overlay) ── */}
            {showSidebar && (
                <div className="absolute inset-0 z-50 flex">
                    <div className="w-72 bg-white border-r border-gray-200 flex flex-col h-full shadow-xl">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                            <h2 className="text-sm font-bold text-gray-900">Chat History</h2>
                            <button onClick={() => setShowSidebar(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500">
                                <FiX size={18} />
                            </button>
                        </div>
                        <div className="px-3 py-2">
                            <button
                                onClick={createNewChat}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-[#1F2F98] bg-[#1F2F98]/5 hover:bg-[#1F2F98]/10 rounded-xl transition-colors"
                            >
                                <FiPlus size={16} />
                                New Chat
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
                            {sessions.map((s) => (
                                <div
                                    key={s.id}
                                    className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${s.id === activeSessionId
                                        ? 'bg-[#1F2F98]/10 text-[#1F2F98]'
                                        : 'hover:bg-gray-50 text-gray-700'
                                        }`}
                                    onClick={() => switchSession(s.id)}
                                >
                                    <FiMessageSquare size={14} className="shrink-0 opacity-50" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-medium truncate">{s.title}</p>
                                        <p className="text-[10px] text-gray-400">
                                            {formatTimestamp(s.updatedAt)}
                                        </p>
                                    </div>
                                    {sessions.length > 1 && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 hover:text-red-500 transition-all"
                                        >
                                            <FiTrash2 size={13} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 bg-black/20" onClick={() => setShowSidebar(false)} />
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200/80 bg-white shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
                <div className="flex items-center gap-2">
                    <Link
                        href="/dashboard"
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                    >
                        <FiArrowLeft size={20} />
                    </Link>
                    <button
                        onClick={() => setShowSidebar(true)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
                        title="Chat history"
                    >
                        <FiMessageSquare size={18} />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Image
                                src="/diabuddy.png"
                                alt="DiaBuddy"
                                width={34}
                                height={34}
                                className="rounded-full object-cover ring-2 ring-[#1F2F98]/10"
                            />
                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-gray-900 leading-tight">DiaBuddy</h1>
                            <p className="text-[10px] text-gray-400">Your diabetes companion</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1 bg-gray-50 rounded-full px-2 py-0.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${remaining > 3 ? 'bg-green-400' : remaining > 0 ? 'bg-amber-400' : 'bg-red-400'}`} />
                        <span className="text-[10px] text-gray-500 font-medium">{remaining} left</span>
                    </div>
                    <button
                        onClick={createNewChat}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-[#1F2F98]"
                        title="New chat"
                    >
                        <FiPlus size={18} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 min-h-0">
                {messages.map((msg, i) => {
                    const dateSep = shouldShowDateSep(i);
                    return (
                        <React.Fragment key={i}>
                            {dateSep && (
                                <div className="flex items-center justify-center py-2">
                                    <span className="text-[11px] text-gray-400 bg-gray-100 px-3 py-0.5 rounded-full font-medium">
                                        {dateSep}
                                    </span>
                                </div>
                            )}
                            <div className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-0.5`}>
                                {msg.role === 'assistant' && (
                                    <Image
                                        src="/diabuddy.png"
                                        alt="DiaBuddy"
                                        width={28}
                                        height={28}
                                        className="rounded-full object-cover shrink-0 mb-4"
                                    />
                                )}
                                <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[82%]`}>
                                    <div
                                        className={`rounded-2xl px-3.5 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap font-[450] ${msg.role === 'user'
                                            ? 'bg-[#1F2F98] text-white rounded-br-md'
                                            : 'bg-white text-gray-800 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-gray-100/80 rounded-bl-md'
                                            }`}
                                    >
                                        {msg.content}
                                    </div>
                                    {msg.actions && msg.actions.length > 0 && (
                                        <div className="mt-1 space-y-1 w-full">
                                            {msg.actions.map((action, ai) => {
                                                const prevUserMsg = messages.slice(0, i).reverse().find(m => m.role === 'user');
                                                return (
                                                    <ChatLogCard
                                                        key={ai}
                                                        action={action as ActionProposal}
                                                        firebaseUid={user?.uid || ''}
                                                        messageTimestamp={prevUserMsg?.timestamp}
                                                        onLogged={handleLogComplete}
                                                    />
                                                );
                                            })}
                                        </div>
                                    )}
                                    <span className="text-[10px] mt-0.5 px-1 text-gray-400">
                                        {formatTimestamp(msg.timestamp)}
                                    </span>
                                </div>
                                {msg.role === 'user' && (
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1F2F98] to-[#4F5FD8] flex items-center justify-center shrink-0 mb-4 text-[11px] font-bold text-white">
                                        {userInitial}
                                    </div>
                                )}
                            </div>
                        </React.Fragment>
                    );
                })}

                {/* Initial suggested questions */}
                {isFirstMessageOnly && !isLoading && (
                    <div className="flex flex-wrap gap-2 ml-9 mt-1">
                        {initialSuggestions.map((q, i) => (
                            <button
                                key={i}
                                onClick={() => handleSuggestionClick(q)}
                                className="text-[13px] font-medium px-3 py-1.5 rounded-full border border-[#1F2F98]/15 text-[#1F2F98] hover:bg-[#1F2F98]/5 transition-colors"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                )}

                {/* Follow-up suggestions */}
                {showFollowUps && (
                    <div className="flex flex-wrap gap-1.5 ml-9 mt-1">
                        {followUps.map((q, i) => (
                            <button
                                key={i}
                                onClick={() => handleSuggestionClick(q)}
                                className="text-[12px] font-medium px-2.5 py-1 rounded-full border border-[#1F2F98]/10 text-[#1F2F98]/70 hover:bg-[#1F2F98]/5 hover:text-[#1F2F98] transition-colors"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                )}

                {isLoading && (
                    <div className="flex items-end gap-2">
                        <Image
                            src="/diabuddy.png"
                            alt="DiaBuddy"
                            width={28}
                            height={28}
                            className="rounded-full object-cover shrink-0"
                        />
                        <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-gray-100/80">
                            <div className="flex gap-1 items-center">
                                <span className="w-1.5 h-1.5 bg-[#1F2F98]/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1.5 h-1.5 bg-[#1F2F98]/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-1.5 h-1.5 bg-[#1F2F98]/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Limit reached banner */}
            {limitReached && (
                <div className="mx-3 mb-1 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-[13px] text-amber-700 shrink-0">
                    <FiAlertCircle className="shrink-0" size={15} />
                    <span>You&apos;ve used all {DAILY_LIMIT} messages today. Come back tomorrow!</span>
                </div>
            )}

            {/* Input */}
            <div className="border-t border-gray-200/80 bg-white px-3 py-2 shrink-0">
                <div className="flex items-end gap-2">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder={limitReached ? 'Daily limit reached' : 'Ask about your glucose, meals, or diabetes...'}
                        rows={1}
                        className="flex-1 resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-[15px] font-[450] focus:outline-none focus:ring-2 focus:ring-[#1F2F98]/15 focus:border-[#1F2F98]/30 focus:bg-white placeholder-gray-400 transition-all"
                        disabled={isLoading || limitReached}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!input.trim() || isLoading || limitReached}
                        className="p-2.5 rounded-2xl bg-[#1F2F98] text-white disabled:opacity-30 hover:bg-[#1a2880] transition-all active:scale-95 shrink-0"
                    >
                        <FiSend size={18} />
                    </button>
                </div>
                <p className="text-[10px] text-gray-400 text-center mt-1">
                    General wellness info only — not medical advice.
                </p>
            </div>
        </div>
    );
}
