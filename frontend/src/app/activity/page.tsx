'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui';
import {
    FiArrowLeft, FiCheck, FiClock, FiZap, FiTrendingDown, FiCalendar, FiX,
} from 'react-icons/fi';
import {
    TbWalk, TbBike, TbRun, TbSwimming, TbBarbell, TbYoga, TbBallFootball,
} from 'react-icons/tb';
import { format, isToday, isYesterday } from 'date-fns';

// ── Types ──────────────────────────────────────────────────────────────────

type ActivityLevel = 'low' | 'medium' | 'high';
type ActivityType = 'walking' | 'running' | 'gym' | 'sports' | 'other';

interface ActivityEntry {
    _id: string;
    activityLevel: ActivityLevel;
    activityType?: ActivityType;
    durationMinutes?: number;
    timestamp: string;
    createdAt?: string;
}

interface ExerciseOption {
    id: ActivityType;
    label: string;
    icon: React.ReactNode;
    level: ActivityLevel;
    effect: string;
    description: string;
}

// ── Exercise catalogue ─────────────────────────────────────────────────────

const exerciseOptions: ExerciseOption[] = [
    {
        id: 'walking',
        label: 'Walking',
        icon: <TbWalk className="w-7 h-7" />,
        level: 'low',
        effect: '↓ Mild',
        description: 'Gentle & steady. Great after meals.',
    },
    {
        id: 'other',  // yoga
        label: 'Yoga / Stretch',
        icon: <TbYoga className="w-7 h-7" />,
        level: 'low',
        effect: '↓ Mild',
        description: 'Reduces stress hormones that raise glucose.',
    },
    {
        id: 'sports',
        label: 'Cycling',
        icon: <TbBike className="w-7 h-7" />,
        level: 'medium',
        effect: '↓ Moderate',
        description: 'Sustained aerobic — steady glucose drop.',
    },
    {
        id: 'sports',
        label: 'Swimming',
        icon: <TbSwimming className="w-7 h-7" />,
        level: 'medium',
        effect: '↓ Moderate',
        description: 'Full-body cardio, gradual glucose use.',
    },
    {
        id: 'running',
        label: 'Running',
        icon: <TbRun className="w-7 h-7" />,
        level: 'high',
        effect: '↓↑ Strong',
        description: 'Fast drop at first, adrenaline may spike briefly.',
    },
    {
        id: 'gym',
        label: 'Weights / Gym',
        icon: <TbBarbell className="w-7 h-7" />,
        level: 'high',
        effect: '↑ then ↓',
        description: 'Short spike during set, then sustained drop.',
    },
    {
        id: 'sports',
        label: 'Sports / HIIT',
        icon: <TbBallFootball className="w-7 h-7" />,
        level: 'high',
        effect: '↓↑ Variable',
        description: 'Intense bursts can temporarily raise glucose.',
    },
];

// Deduplicated for rendering — keyed by label
const levelConfig: Record<ActivityLevel, { label: string; color: string; bg: string; border: string; selectedBorder: string; glow: string }> = {
    low: { label: 'Easy', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', selectedBorder: 'border-emerald-500', glow: 'shadow-[0_0_0_2px_rgba(16,185,129,0.25)]' },
    medium: { label: 'Moderate', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', selectedBorder: 'border-blue-500', glow: 'shadow-[0_0_0_2px_rgba(59,130,246,0.25)]' },
    high: { label: 'Intense', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', selectedBorder: 'border-rose-500', glow: 'shadow-[0_0_0_2px_rgba(244,63,94,0.25)]' },
};

const durationPresets = [10, 20, 30, 45, 60, 90];

function formatActivityDate(dateStr: string): string {
    const d = new Date(dateStr);
    if (isToday(d)) return `Today · ${format(d, 'h:mm a')}`;
    if (isYesterday(d)) return `Yesterday · ${format(d, 'h:mm a')}`;
    return format(d, 'MMM d · h:mm a');
}

const levelColors: Record<ActivityLevel, { dot: string; badge: string }> = {
    low: { dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    medium: { dot: 'bg-blue-400', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
    high: { dot: 'bg-rose-400', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
};

// ── Component ─────────────────────────────────────────────────────────────

export default function ActivityPage() {
    const { user } = useAuth();
    const router = useRouter();

    // Form state
    const [selectedExerciseIdx, setSelectedExerciseIdx] = useState<number | null>(null);
    const [duration, setDuration] = useState<number | null>(null);
    const [customDuration, setCustomDuration] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Recent logs
    const [recentLogs, setRecentLogs] = useState<ActivityEntry[]>([]);
    const [logsLoading, setLogsLoading] = useState(true);

    const loadRecentLogs = useCallback(async () => {
        if (!user) return;
        try {
            const data = await api.getActivities(user.uid, 14);
            setRecentLogs((data.activities ?? []) as ActivityEntry[]);
        } catch {
            // non-critical
        } finally {
            setLogsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadRecentLogs();
    }, [loadRecentLogs]);

    const selectedExercise = selectedExerciseIdx !== null ? exerciseOptions[selectedExerciseIdx] : null;
    const effectiveDuration = customDuration ? parseInt(customDuration) : duration;

    const handleSubmit = async () => {
        if (!user || !selectedExercise) return;
        setIsSubmitting(true);
        try {
            await api.createActivity({
                firebaseUid: user.uid,
                activityLevel: selectedExercise.level,
                activityType: selectedExercise.id,
                durationMinutes: effectiveDuration ?? undefined,
            });
            // Also trigger a glucose-30 forecast refresh
            try { await api.getGlucose30(user.uid, 'activity_log'); } catch { /* non-critical */ }
            setIsSuccess(true);
            await loadRecentLogs();
        } catch {
            setIsSuccess(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogAnother = () => {
        setSelectedExerciseIdx(null);
        setDuration(null);
        setCustomDuration('');
        setIsSuccess(false);
    };

    // ── Success State ────────────────────────────────────────────────────

    if (isSuccess && selectedExercise) {
        const lc = levelConfig[selectedExercise.level];
        return (
            <div className="space-y-5 pb-8">
                <div className="flex items-center gap-3 pt-1">
                    <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                        <FiArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">Activity Log</h1>
                </div>

                <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden">
                    <div className="h-1.5 w-full" style={{ background: 'linear-gradient(135deg, #1F2F98, #4338ca, #7c3aed)' }} />
                    <CardContent className="text-center py-10 px-6">
                        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${lc.bg} border-2 ${lc.border} mb-4 animate-bounce`}>
                            <span className={lc.color}>{selectedExercise.icon}</span>
                        </div>
                        <div className="w-10 h-10 bg-emerald-100 border-2 border-emerald-300 rounded-full flex items-center justify-center mx-auto -mt-4 mb-4">
                            <FiCheck className="w-5 h-5 text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">Activity Logged!</h2>
                        <p className="text-gray-500 text-sm mb-1">
                            {selectedExercise.label}
                            {effectiveDuration ? ` · ${effectiveDuration} min` : ''}
                        </p>
                        <p className="text-xs text-gray-400 mb-6">{selectedExercise.description}</p>

                        <div className="px-4 py-3 mb-5 rounded-xl bg-indigo-50 border border-indigo-100 text-left">
                            <p className="text-xs text-indigo-800 leading-relaxed">
                                <span className="font-semibold">Forecast updated.</span> Your 30-minute glucose forecast has been refreshed to account for this activity.
                            </p>
                        </div>

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
                                Dashboard
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {recentLogs.length > 0 && <RecentActivityHistory logs={recentLogs} />}
            </div>
        );
    }

    // ── Form ─────────────────────────────────────────────────────────────

    return (
        <div className="space-y-5 pb-8">
            {/* Header */}
            <div className="flex items-center gap-3 pt-1">
                <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                    <FiArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Log Activity</h1>
                    <p className="text-xs text-gray-500">Exercise affects glucose for 2–3 hours</p>
                </div>
            </div>

            {/* Category groups */}
            {(['low', 'medium', 'high'] as ActivityLevel[]).map(level => {
                const lc = levelConfig[level];
                const options = exerciseOptions
                    .map((ex, i) => ({ ex, i }))
                    .filter(({ ex }) => ex.level === level);

                return (
                    <Card key={level} className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
                        <CardContent>
                            <div className="flex items-center gap-2 mb-3">
                                <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${lc.bg} ${lc.border} ${lc.color}`}>
                                    {lc.label}
                                </span>
                                <FiTrendingDown className={`w-4 h-4 ${lc.color} opacity-60`} />
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                {options.map(({ ex, i }) => {
                                    const isSelected = selectedExerciseIdx === i;
                                    return (
                                        <button
                                            key={`${ex.label}-${i}`}
                                            type="button"
                                            onClick={() => setSelectedExerciseIdx(isSelected ? null : i)}
                                            className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] ${isSelected
                                                ? `${lc.bg} ${lc.selectedBorder} ${lc.glow}`
                                                : `bg-gray-50 border-gray-200 hover:border-gray-300`
                                                }`}
                                        >
                                            <span className={`${isSelected ? lc.color : 'text-gray-500'} transition-colors`}>
                                                {ex.icon}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-semibold ${isSelected ? lc.color : 'text-gray-800'}`}>
                                                    {ex.label}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">{ex.description}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className={`text-xs font-bold ${isSelected ? lc.color : 'text-gray-400'}`}>
                                                    {ex.effect}
                                                </span>
                                                <p className="text-[10px] text-gray-400">glucose</p>
                                            </div>
                                            {isSelected && (
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${lc.bg} border ${lc.selectedBorder}`}>
                                                    <FiCheck className={`w-3 h-3 ${lc.color}`} />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}

            {/* Duration — shown once an exercise is selected */}
            {selectedExercise && (
                <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
                    <CardContent>
                        <div className="flex items-center gap-2 mb-3">
                            <FiClock className="w-4 h-4 text-gray-400" />
                            <p className="text-sm font-semibold text-gray-700">Duration <span className="text-xs font-normal text-gray-400">(optional)</span></p>
                            {effectiveDuration && (
                                <span className="ml-auto text-xs font-bold text-[#1F2F98]">{effectiveDuration} min</span>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {durationPresets.map(min => (
                                <button
                                    key={min}
                                    type="button"
                                    onClick={() => { setDuration(duration === min ? null : min); setCustomDuration(''); }}
                                    className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${duration === min && !customDuration
                                        ? 'bg-[#1F2F98] border-[#1F2F98] text-white shadow-[0_2px_8px_rgba(31,47,152,0.3)]'
                                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-[#1F2F98]/40'
                                        }`}
                                >
                                    {min} min
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min={1}
                                max={480}
                                value={customDuration}
                                onChange={e => { setCustomDuration(e.target.value); setDuration(null); }}
                                placeholder="Custom (minutes)"
                                className="flex-1 px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1F2F98]/30 focus:border-[#1F2F98]/50 transition-all"
                            />
                            {customDuration && (
                                <button
                                    type="button"
                                    onClick={() => setCustomDuration('')}
                                    className="p-2 text-gray-400 hover:text-gray-600"
                                >
                                    <FiX className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Science blurb */}
            <div className="px-1">
                <div className="rounded-2xl overflow-hidden border border-indigo-100 shadow-[0_2px_12px_rgba(99,102,241,0.08)]">
                    <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #1F2F98, #4338ca, #7c3aed)' }}>
                        <FiZap className="w-4 h-4 text-white/80" />
                        <p className="text-xs font-semibold text-white">How exercise affects glucose</p>
                    </div>
                    <div className="px-4 py-3 bg-gradient-to-br from-indigo-50/80 via-violet-50/60 to-purple-50/40">
                        <p className="text-xs text-indigo-900 leading-relaxed">
                            Exercise activates GLUT4 transporters, which push glucose from your bloodstream into muscles without needing insulin.
                            The effect persists for 2–3 hours after moderate activity. Intense short bursts can briefly raise glucose via adrenaline before the drop.
                        </p>
                    </div>
                </div>
            </div>

            {/* Submit */}
            <button
                type="button"
                onClick={handleSubmit}
                disabled={!selectedExercise || isSubmitting}
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
                        {selectedExercise
                            ? `Log ${selectedExercise.label}${effectiveDuration ? ` · ${effectiveDuration} min` : ''}`
                            : 'Select an Activity'}
                    </span>
                )}
            </button>

            {/* Recent logs */}
            {!logsLoading && recentLogs.length > 0 && <RecentActivityHistory logs={recentLogs} />}
        </div>
    );
}

// ── Recent Activity History sub-component ─────────────────────────────────

function RecentActivityHistory({ logs }: { logs: ActivityEntry[] }) {
    return (
        <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
            <CardContent>
                <div className="flex items-center gap-2 mb-4">
                    <FiCalendar className="w-4 h-4 text-gray-400" />
                    <h3 className="text-sm font-semibold text-gray-700">Recent Activity</h3>
                </div>
                <div className="space-y-3">
                    {logs.slice(0, 7).map(log => {
                        const lc = levelColors[log.activityLevel] ?? levelColors.medium;
                        const label = log.activityType
                            ? log.activityType.charAt(0).toUpperCase() + log.activityType.slice(1)
                            : levelConfig[log.activityLevel]?.label ?? log.activityLevel;
                        return (
                            <div key={log._id} className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full shrink-0 ${lc.dot}`} />
                                <div className="flex-1 min-w-0 flex items-center gap-2">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-semibold ${lc.badge}`}>
                                        {label}
                                    </span>
                                    {log.durationMinutes && (
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                            <FiClock className="w-3 h-3" />{log.durationMinutes} min
                                        </span>
                                    )}
                                </div>
                                <span className="text-[10px] text-gray-400 shrink-0">
                                    {formatActivityDate(log.timestamp || log.createdAt || new Date().toISOString())}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
