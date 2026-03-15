'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui';
import { FiCheck, FiArrowLeft, FiMoon, FiZap, FiMessageSquare, FiCalendar, FiTrendingUp } from 'react-icons/fi';
import { TbMoodHappy, TbMoodSmile, TbMoodNeutral, TbMoodSad, TbMoodCry } from 'react-icons/tb';
import { format, isToday, isYesterday } from 'date-fns';

// ── Types ──────────────────────────────────────────────────────────────────

type MoodValue = 'Great' | 'Good' | 'Okay' | 'Low' | 'Rough';
type Period = 'morning' | 'afternoon' | 'evening';

interface MoodLogEntry {
    _id: string;
    mood: MoodValue;
    period: Period;
    note?: string;
    createdAt: string;
}

// ── Constants ─────────────────────────────────────────────────────────────

const moodOptions: {
    value: MoodValue;
    label: string;
    emoji: React.ReactNode;
    bg: string;
    border: string;
    text: string;
    selectedBg: string;
    tip: string;
}[] = [
        {
            value: 'Great',
            label: 'Great',
            emoji: <TbMoodHappy className="w-8 h-8" />,
            bg: 'bg-emerald-50',
            border: 'border-emerald-200',
            text: 'text-emerald-700',
            selectedBg: 'bg-emerald-100 border-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.25)]',
            tip: 'Positive mood is linked to better insulin sensitivity.',
        },
        {
            value: 'Good',
            label: 'Good',
            emoji: <TbMoodSmile className="w-8 h-8" />,
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            text: 'text-blue-700',
            selectedBg: 'bg-blue-100 border-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.25)]',
            tip: 'On a good day, your body tends to respond better to medication.',
        },
        {
            value: 'Okay',
            label: 'Okay',
            emoji: <TbMoodNeutral className="w-8 h-8" />,
            bg: 'bg-yellow-50',
            border: 'border-yellow-200',
            text: 'text-yellow-700',
            selectedBg: 'bg-yellow-100 border-yellow-500 shadow-[0_0_0_2px_rgba(234,179,8,0.25)]',
            tip: 'Neutral days are steady — keep up your usual routine.',
        },
        {
            value: 'Low',
            label: 'Low',
            emoji: <TbMoodSad className="w-8 h-8" />,
            bg: 'bg-orange-50',
            border: 'border-orange-200',
            text: 'text-orange-700',
            selectedBg: 'bg-orange-100 border-orange-500 shadow-[0_0_0_2px_rgba(249,115,22,0.25)]',
            tip: 'Low mood can raise cortisol, which may affect glucose. Gentle movement helps.',
        },
        {
            value: 'Rough',
            label: 'Rough',
            emoji: <TbMoodCry className="w-8 h-8" />,
            bg: 'bg-rose-50',
            border: 'border-rose-200',
            text: 'text-rose-700',
            selectedBg: 'bg-rose-100 border-rose-500 shadow-[0_0_0_2px_rgba(244,63,94,0.25)]',
            tip: "Tough days are temporary. Logging them helps you spot patterns.",
        },
    ];

const stressLabels = ['None', 'Little', 'Some', 'High', 'Very high'];
const sleepTags = [4, 5, 6, 7, 8, 9];

function getTimePeriod(): Period {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
}

function formatLogDate(dateStr: string): string {
    const d = new Date(dateStr);
    if (isToday(d)) return `Today · ${format(d, 'h:mm a')}`;
    if (isYesterday(d)) return `Yesterday · ${format(d, 'h:mm a')}`;
    return format(d, 'MMM d · h:mm a');
}

const moodColors: Record<MoodValue, { dot: string; badge: string; text: string }> = {
    Great: { dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-700' },
    Good: { dot: 'bg-blue-400', badge: 'bg-blue-50 text-blue-700 border-blue-200', text: 'text-blue-700' },
    Okay: { dot: 'bg-yellow-400', badge: 'bg-yellow-50 text-yellow-700 border-yellow-200', text: 'text-yellow-700' },
    Low: { dot: 'bg-orange-400', badge: 'bg-orange-50 text-orange-700 border-orange-200', text: 'text-orange-700' },
    Rough: { dot: 'bg-rose-400', badge: 'bg-rose-50 text-rose-700 border-rose-200', text: 'text-rose-700' },
};

const moodSmallIcons: Record<MoodValue, React.ReactNode> = {
    Great: <TbMoodHappy className="w-4 h-4" />,
    Good: <TbMoodSmile className="w-4 h-4" />,
    Okay: <TbMoodNeutral className="w-4 h-4" />,
    Low: <TbMoodSad className="w-4 h-4" />,
    Rough: <TbMoodCry className="w-4 h-4" />,
};

// ── Component ─────────────────────────────────────────────────────────────

export default function MoodPage() {
    const { user } = useAuth();
    const router = useRouter();

    // Form state
    const [selectedMood, setSelectedMood] = useState<MoodValue | null>(null);
    const [sleepHours, setSleepHours] = useState<number | null>(null);
    const [stressLevel, setStressLevel] = useState<number | null>(null);
    const [note, setNote] = useState('');
    const [period] = useState<Period>(getTimePeriod());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Recent logs
    const [recentLogs, setRecentLogs] = useState<MoodLogEntry[]>([]);
    const [logsLoading, setLogsLoading] = useState(true);

    // Selected mood tip animation flag
    const [tipVisible, setTipVisible] = useState(false);

    const loadRecentLogs = useCallback(async () => {
        if (!user) return;
        try {
            const data = await api.getMoodLogs(user.uid, 14);
            setRecentLogs(data.logs as MoodLogEntry[]);
        } catch {
            // non-critical
        } finally {
            setLogsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadRecentLogs();
    }, [loadRecentLogs]);

    const handleMoodSelect = (mood: MoodValue) => {
        setSelectedMood(mood);
        setTipVisible(false);
        setTimeout(() => setTipVisible(true), 50);
    };

    const handleSubmit = async () => {
        if (!user || !selectedMood) return;
        setIsSubmitting(true);
        try {
            await api.logMood({
                firebaseUid: user.uid,
                mood: selectedMood,
                period,
                note: note.trim() || undefined,
            });

            // Also log lifestyle if sleep/stress were filled in
            if (sleepHours !== null && stressLevel !== null) {
                try {
                    await api.logLifestyle({
                        firebaseUid: user.uid,
                        exerciseFrequency: 'moderate',
                        sleepQuality: sleepHours,
                        stressLevel,
                    });
                } catch {
                    // non-critical
                }
            }

            setIsSuccess(true);
            await loadRecentLogs();
        } catch {
            // show success anyway — UI is optimistic
            setIsSuccess(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogAnother = () => {
        setSelectedMood(null);
        setSleepHours(null);
        setStressLevel(null);
        setNote('');
        setIsSuccess(false);
        setTipVisible(false);
    };

    // Compute streak (consecutive days with a log)
    const streak = (() => {
        if (recentLogs.length === 0) return 0;
        const days = new Set(recentLogs.map(l => new Date(l.createdAt).toDateString()));
        let count = 0;
        const d = new Date();
        for (let i = 0; i < 14; i++) {
            if (days.has(d.toDateString())) count++;
            else if (i > 0) break;
            d.setDate(d.getDate() - 1);
        }
        return count;
    })();

    const periodLabel = { morning: 'morning', afternoon: 'afternoon', evening: 'evening' }[period];

    // ── Success State ────────────────────────────────────────────────────

    if (isSuccess && selectedMood) {
        const m = moodOptions.find(o => o.value === selectedMood)!;
        return (
            <div className="space-y-5 pb-8">
                <div className="flex items-center gap-3 pt-1">
                    <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                        <FiArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">Mood Log</h1>
                </div>

                <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden">
                    <div className="h-1.5 w-full" style={{ background: 'linear-gradient(135deg, #1F2F98, #4338ca, #7c3aed)' }} />
                    <CardContent className="text-center py-10 px-6">
                        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${m.bg} border-2 ${m.border} mb-4 animate-bounce`}>
                            <span className={m.text}>{moodOptions.find(o => o.value === selectedMood)?.emoji}</span>
                        </div>
                        <div className="w-10 h-10 bg-emerald-100 border-2 border-emerald-300 rounded-full flex items-center justify-center mx-auto -mt-4 mb-4">
                            <FiCheck className="w-5 h-5 text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">Logged!</h2>
                        <p className="text-gray-500 text-sm mb-1">
                            You&apos;re feeling <span className={`font-semibold ${m.text}`}>{selectedMood}</span> this {periodLabel}.
                        </p>
                        <p className="text-xs text-gray-400 mb-6">{m.tip}</p>

                        {streak > 1 && (
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full text-sm text-amber-700 font-medium mb-5">
                                <FiZap className="w-4 h-4" />
                                {streak}-day logging streak!
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 *:w-full sm:*:w-auto">
                            <button
                                onClick={handleLogAnother}
                                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Log Another
                            </button>
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="flex-1 py-3 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
                                style={{ background: 'linear-gradient(135deg, #1F2F98, #4338ca, #7c3aed)' }}
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent history after success */}
                {recentLogs.length > 0 && <RecentMoodHistory logs={recentLogs} />}
            </div>
        );
    }

    // ── Form ─────────────────────────────────────────────────────────────

    const selectedOption = moodOptions.find(o => o.value === selectedMood);
    const canSubmit = !!selectedMood;

    return (
        <div className="space-y-5 pb-8">
            {/* Header */}
            <div className="flex items-center gap-3 pt-1">
                <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                    <FiArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Mood Log</h1>
                    <p className="text-xs text-gray-500 capitalize">{periodLabel} check-in</p>
                </div>
                {streak > 0 && (
                    <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-xs text-amber-700 font-semibold">
                        <FiZap className="w-3 h-3" />
                        {streak}d streak
                    </div>
                )}
            </div>

            {/* Mood selector */}
            <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
                <CardContent>
                    <p className="text-sm font-semibold text-gray-700 mb-4">How are you feeling right now?</p>
                    <div className="grid grid-cols-5 gap-2">
                        {moodOptions.map(option => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleMoodSelect(option.value)}
                                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-200 hover:scale-105 active:scale-95 ${selectedMood === option.value
                                    ? option.selectedBg
                                    : `${option.bg} ${option.border} hover:border-gray-300`
                                    }`}
                            >
                                <span className={`${option.text} transition-transform duration-200 ${selectedMood === option.value ? 'scale-110' : ''}`}>
                                    {option.emoji}
                                </span>
                                <span className={`text-[10px] font-semibold ${selectedMood === option.value ? option.text : 'text-gray-500'}`}>
                                    {option.label}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Animated tip */}
                    {selectedOption && tipVisible && (
                        <div
                            className={`mt-4 px-4 py-3 rounded-xl border ${selectedOption.border} ${selectedOption.bg} transition-all duration-300`}
                            style={{ animation: 'fadeSlideUp 0.25s ease-out' }}
                        >
                            <p className={`text-xs leading-relaxed ${selectedOption.text}`}>
                                💡 {selectedOption.tip}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Sleep & Stress (optional enrichment) */}
            <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
                <CardContent>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Sleep & Stress <span className="text-xs font-normal text-gray-400">(optional — improves predictions)</span></p>

                    {/* Sleep */}
                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                            <FiMoon className="w-4 h-4 text-indigo-500" />
                            <p className="text-xs font-medium text-gray-600">Hours slept last night</p>
                            {sleepHours !== null && (
                                <span className="ml-auto text-xs font-bold text-indigo-600">{sleepHours}h</span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {sleepTags.map(h => (
                                <button
                                    key={h}
                                    type="button"
                                    onClick={() => setSleepHours(sleepHours === h ? null : h)}
                                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${sleepHours === h
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-[0_2px_8px_rgba(99,102,241,0.3)]'
                                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-indigo-300'
                                        }`}
                                >
                                    {h}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stress */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <FiZap className="w-4 h-4 text-amber-500" />
                            <p className="text-xs font-medium text-gray-600">Stress level today</p>
                            {stressLevel !== null && (
                                <span className="ml-auto text-xs font-bold text-amber-600">{stressLabels[stressLevel]}</span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {stressLabels.map((label, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setStressLevel(stressLevel === i ? null : i)}
                                    className={`flex-1 py-2 rounded-xl text-[10px] font-semibold border transition-all ${stressLevel === i
                                        ? 'bg-amber-500 border-amber-500 text-white shadow-[0_2px_8px_rgba(245,158,11,0.3)]'
                                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-amber-300'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Note */}
            <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
                <CardContent>
                    <div className="flex items-center gap-2 mb-2">
                        <FiMessageSquare className="w-4 h-4 text-gray-400" />
                        <p className="text-sm font-semibold text-gray-700">Add a note <span className="text-xs font-normal text-gray-400">(optional)</span></p>
                    </div>
                    <textarea
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder="What's on your mind? A few words or more..."
                        maxLength={300}
                        rows={3}
                        className="w-full px-4 py-3 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#1F2F98]/30 focus:border-[#1F2F98]/50 transition-all placeholder:text-gray-400"
                    />
                    <p className="text-right text-[10px] text-gray-400 mt-1">{note.length}/300</p>
                </CardContent>
            </Card>

            {/* Insight blurb */}
            <div className="px-1">
                <div className="rounded-2xl overflow-hidden border border-indigo-100 shadow-[0_2px_12px_rgba(99,102,241,0.08)]">
                    <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #1F2F98, #4338ca, #7c3aed)' }}>
                        <FiTrendingUp className="w-4 h-4 text-white/80" />
                        <p className="text-xs font-semibold text-white">Why mood logging matters</p>
                    </div>
                    <div className="px-4 py-3 bg-gradient-to-br from-indigo-50/80 via-violet-50/60 to-purple-50/40">
                        <p className="text-xs text-indigo-900 leading-relaxed">
                            Emotional state affects cortisol and adrenaline, both of which raise glucose.
                            Logging your mood helps the AI model spot stress-driven spikes and give more personalised advice.
                        </p>
                    </div>
                </div>
            </div>

            {/* Submit */}
            <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                className="w-full py-4 rounded-2xl text-white font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 hover:shadow-lg active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #1F2F98, #4338ca, #7c3aed)' }}
            >
                {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                    </span>
                ) : (
                    <span className="flex items-center justify-center gap-2">
                        <FiCheck className="w-4 h-4" />
                        Log Mood
                    </span>
                )}
            </button>

            {/* Recent logs */}
            {!logsLoading && recentLogs.length > 0 && <RecentMoodHistory logs={recentLogs} />}
        </div>
    );
}

// ── Recent Mood History sub-component ─────────────────────────────────────

function RecentMoodHistory({ logs }: { logs: MoodLogEntry[] }) {
    return (
        <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
            <CardContent>
                <div className="flex items-center gap-2 mb-4">
                    <FiCalendar className="w-4 h-4 text-gray-400" />
                    <h3 className="text-sm font-semibold text-gray-700">Recent Logs</h3>
                </div>
                <div className="space-y-3">
                    {logs.slice(0, 7).map(log => {
                        const colors = moodColors[log.mood as MoodValue] ?? moodColors.Okay;
                        const icon = moodSmallIcons[log.mood as MoodValue];
                        return (
                            <div key={log._id} className="flex items-start gap-3">
                                <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${colors.badge}`}>
                                            {icon}
                                            {log.mood}
                                        </span>
                                        <span className="text-[10px] text-gray-400 capitalize">{log.period}</span>
                                    </div>
                                    {log.note && (
                                        <p className="text-xs text-gray-500 mt-1 truncate">{log.note}</p>
                                    )}
                                </div>
                                <span className="text-[10px] text-gray-400 shrink-0">{formatLogDate(log.createdAt)}</span>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
