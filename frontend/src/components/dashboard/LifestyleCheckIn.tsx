'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, Button } from '@/components/ui';
import { FiX, FiSend, FiSun, FiCheck, FiCalendar } from 'react-icons/fi';
import { IoTvOutline, IoWalkOutline, IoBarbellOutline } from 'react-icons/io5';
import { TbMoon, TbMoodSmile, TbMoodNeutral, TbMoodSad, TbStars, TbMoodCrazyHappy } from 'react-icons/tb';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

const COOLDOWN_KEY = 'bluely-checkin-last';
const HISTORY_KEY = 'bluely-checkin-history';
const COOLDOWN_HOURS = 12;

interface CheckInRecord {
    date: string;
    exercise: string;
    sleep: number;
    stress: number;
}

function getCooldownRemaining(): number {
    const last = localStorage.getItem(COOLDOWN_KEY);
    if (!last) return 0;
    const elapsed = Date.now() - parseInt(last, 10);
    return Math.max(0, COOLDOWN_HOURS * 60 * 60 * 1000 - elapsed);
}

function getHistory(): CheckInRecord[] {
    try {
        const raw = localStorage.getItem(HISTORY_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveToHistory(record: CheckInRecord) {
    const history = getHistory();
    history.unshift(record);
    // Keep last 10
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 10)));
}

interface LifestyleCheckInProps {
    onComplete?: () => void;
    onDismiss?: () => void;
}

export default function LifestyleCheckIn({ onComplete, onDismiss }: LifestyleCheckInProps) {
    const { user } = useAuth();
    const [exerciseFrequency, setExerciseFrequency] = useState('');
    const [sleepQuality, setSleepQuality] = useState<number>(0);
    const [stressLevel, setStressLevel] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [onCooldown, setOnCooldown] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState<CheckInRecord[]>([]);

    useEffect(() => {
        const remaining = getCooldownRemaining();
        if (remaining > 0) {
            setOnCooldown(true);
        }
        // Try fetching from backend first, fallback to localStorage
        if (user) {
            api.getLifestyleLogs(user.uid, 10).then((res) => {
                setHistory(res.logs.map((l) => ({
                    date: l.createdAt,
                    exercise: l.exerciseFrequency,
                    sleep: l.sleepQuality,
                    stress: l.stressLevel,
                })));
            }).catch(() => {
                setHistory(getHistory());
            });
        } else {
            setHistory(getHistory());
        }
    }, [user]);

    const handleDismiss = async () => {
        if (!user) return;
        try {
            await api.dismissHealthPrompt(user.uid);
        } catch (e) {
            console.error('Failed to dismiss:', e);
        }
        onDismiss?.();
    };

    const handleSubmit = async () => {
        if (!user || !exerciseFrequency || !sleepQuality || !stressLevel) return;

        setIsSubmitting(true);
        try {
            // Update the aggregate health profile
            await api.upsertHealthProfile(user.uid, {
                exerciseFrequency,
                sleepQuality,
                stressLevel,
            });

            // Also save an individual lifestyle log for daily trend tracking
            await api.logLifestyle({
                firebaseUid: user.uid,
                exerciseFrequency,
                sleepQuality,
                stressLevel,
            });

            // Store cooldown
            localStorage.setItem(COOLDOWN_KEY, Date.now().toString());

            // Fetch fresh history from backend
            try {
                const res = await api.getLifestyleLogs(user.uid, 10);
                setHistory(res.logs.map((l) => ({
                    date: l.createdAt,
                    exercise: l.exerciseFrequency,
                    sleep: l.sleepQuality,
                    stress: l.stressLevel,
                })));
            } catch {
                // Fallback to local history
                const record: CheckInRecord = {
                    date: new Date().toISOString(),
                    exercise: exerciseFrequency,
                    sleep: sleepQuality,
                    stress: stressLevel,
                };
                saveToHistory(record);
                setHistory(getHistory());
            }

            setSubmitted(true);
        } catch (error) {
            console.error('Error saving lifestyle check-in:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Don't render if on cooldown
    if (onCooldown) return null;

    if (submitted) {
        const sleepLabels = ['Poor', 'Fair', 'Okay', 'Good', 'Great'];
        const stressLabels = ['Low', 'Mild', 'Medium', 'High', 'V.High'];
        const recentHistory = history.slice(0, 5);

        return (
            <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.06)] bg-gradient-to-br from-green-50 to-emerald-50">
                <CardContent>
                    <div className="text-center py-3">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <FiCheck className="w-6 h-6 text-green-600" />
                        </div>
                        <p className="font-semibold text-green-700 mb-1">Lifestyle check-in complete!</p>
                        <p className="text-sm text-gray-500 mb-4">Your data is being used to improve your forecasts.</p>

                        {recentHistory.length > 0 && (
                            <div className="text-left">
                                <button
                                    onClick={() => setShowHistory(!showHistory)}
                                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 mx-auto mb-2"
                                >
                                    <FiCalendar className="w-3 h-3" />
                                    {showHistory ? 'Hide' : 'View'} recent check-ins ({recentHistory.length})
                                </button>
                                {showHistory && (
                                    <div className="space-y-2 mt-2">
                                        {recentHistory.map((r, i) => (
                                            <div key={i} className="flex items-center justify-between bg-white/70 rounded-lg px-3 py-2 text-xs text-gray-600">
                                                <span>{new Date(r.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                                <div className="flex gap-3">
                                                    <span className="capitalize">{r.exercise}</span>
                                                    <span>Sleep: {sleepLabels[r.sleep - 1]}</span>
                                                    <span>Stress: {stressLabels[r.stress - 1]}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            onClick={() => onComplete?.()}
                            className="mt-4 text-xs text-gray-400 hover:text-gray-600"
                        >
                            Dismiss
                        </button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const isValid = exerciseFrequency && sleepQuality > 0 && stressLevel > 0;

    const sleepIcons = [TbMoon, TbMoodSad, TbMoodNeutral, TbMoodSmile, TbStars];
    const sleepLabels = ['Poor', 'Fair', 'Okay', 'Good', 'Great'];
    const stressIcons = [TbMoodCrazyHappy, TbMoodSmile, TbMoodNeutral, TbMoodSad, TbMoodSad];
    const stressLabels = ['Low', 'Mild', 'Medium', 'High', 'V.High'];

    return (
        <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.06)] bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 relative overflow-hidden">
            <CardContent>
                <button
                    onClick={handleDismiss}
                    className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <FiX className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <FiSun className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Lifestyle Check-In</h3>
                        <p className="text-xs text-gray-500">Quick update to improve your forecasts</p>
                    </div>
                </div>

                {/* Exercise Frequency */}
                <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Exercise Frequency</label>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { value: 'rare', label: 'Rare', icon: IoTvOutline },
                            { value: 'moderate', label: 'Moderate', icon: IoWalkOutline },
                            { value: 'frequent', label: 'Frequent', icon: IoBarbellOutline },
                        ].map((opt) => {
                            const Icon = opt.icon;
                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => setExerciseFrequency(opt.value)}
                                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${exerciseFrequency === opt.value
                                        ? 'border-amber-500 bg-amber-50 shadow-[0_4px_20px_rgba(0,0,0,0.06)]'
                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${exerciseFrequency === opt.value ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-medium text-gray-700">{opt.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Sleep Quality + Stress Level */}
                <div className="grid grid-cols-2 gap-4 mb-5">
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Sleep <span className="text-gray-400 text-xs">({sleepQuality ? sleepLabels[sleepQuality - 1] : '---'})</span>
                        </label>
                        <div className="flex gap-1.5">
                            {[1, 2, 3, 4, 5].map((val) => {
                                const Icon = sleepIcons[val - 1];
                                return (
                                    <button
                                        key={val}
                                        onClick={() => setSleepQuality(val)}
                                        className={`flex-1 py-2.5 rounded-xl border-2 flex flex-col items-center transition-all ${sleepQuality === val
                                            ? 'border-amber-500 bg-amber-50 shadow-[0_4px_20px_rgba(0,0,0,0.06)]'
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                            }`}
                                    >
                                        <Icon className={`w-4 h-4 ${sleepQuality === val ? 'text-amber-600' : 'text-gray-400'}`} />
                                        <span className="text-[10px] text-gray-400 mt-0.5">{val}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Stress <span className="text-gray-400 text-xs">({stressLevel ? stressLabels[stressLevel - 1] : '---'})</span>
                        </label>
                        <div className="flex gap-1.5">
                            {[1, 2, 3, 4, 5].map((val) => {
                                const Icon = stressIcons[val - 1];
                                return (
                                    <button
                                        key={val}
                                        onClick={() => setStressLevel(val)}
                                        className={`flex-1 py-2.5 rounded-xl border-2 flex flex-col items-center transition-all ${stressLevel === val
                                            ? 'border-amber-500 bg-amber-50 shadow-[0_4px_20px_rgba(0,0,0,0.06)]'
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                            }`}
                                    >
                                        <Icon className={`w-4 h-4 ${stressLevel === val ? 'text-amber-600' : 'text-gray-400'}`} />
                                        <span className="text-[10px] text-gray-400 mt-0.5">{val}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <Button
                    onClick={handleSubmit}
                    disabled={!isValid}
                    isLoading={isSubmitting}
                    className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50"
                >
                    <FiSend className="w-4 h-4 mr-2" />
                    Save Check-In
                </Button>
            </CardContent>
        </Card>
    );
}
