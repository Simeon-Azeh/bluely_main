'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, Button } from '@/components/ui';
import { FiCheck, FiClock } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

interface Mood {
    emoji: string;
    label: string;
    color: string;
    bgColor: string;
}

const moods: Mood[] = [
    { emoji: '😊', label: 'Great', color: 'text-green-600', bgColor: 'bg-green-100 hover:bg-green-200 border-green-200' },
    { emoji: '🙂', label: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100 hover:bg-blue-200 border-blue-200' },
    { emoji: '😐', label: 'Okay', color: 'text-yellow-600', bgColor: 'bg-yellow-100 hover:bg-yellow-200 border-yellow-200' },
    { emoji: '😔', label: 'Low', color: 'text-orange-600', bgColor: 'bg-orange-100 hover:bg-orange-200 border-orange-200' },
    { emoji: '😣', label: 'Rough', color: 'text-red-600', bgColor: 'bg-red-100 hover:bg-red-200 border-red-200' },
];

const moodEmojis: Record<string, string> = {
    Great: '😊', Good: '🙂', Okay: '😐', Low: '😔', Rough: '😣',
};

const moodMessages: Record<string, { title: string; message: string; tip: string }> = {
    Great: {
        title: "That's wonderful!",
        message: "You're radiating positive energy today. Keep that momentum going!",
        tip: 'Tip: Note what made today great so you can recreate it.',
    },
    Good: {
        title: 'Glad to hear it!',
        message: "A good day is a win. Your consistent effort is paying off.",
        tip: 'Tip: Stay hydrated and keep up the great habits.',
    },
    Okay: {
        title: "That's perfectly fine.",
        message: "Not every day needs to be amazing. Steady days build strong foundations.",
        tip: 'Tip: A short walk or stretch can give you a small boost.',
    },
    Low: {
        title: 'Thanks for sharing.',
        message: "It takes courage to check in when you're not at your best. You're still showing up.",
        tip: 'Tip: Be gentle with yourself. Rest if you need to.',
    },
    Rough: {
        title: "We hear you.",
        message: "Tough days happen, and they don't define you. Tomorrow is a fresh start.",
        tip: 'Tip: Reach out to someone you trust if things feel heavy.',
    },
};

function getTimePeriod(): 'morning' | 'afternoon' | 'evening' {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
}

function getCooldownKey(): string {
    const today = new Date().toISOString().slice(0, 10);
    const period = getTimePeriod();
    return `bluely-mood-${today}-${period}`;
}

function formatRelativeTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

interface MoodTrackerProps {
    onMoodSelect?: (mood: Mood) => void;
}

export default function MoodTracker({ onMoodSelect }: MoodTrackerProps) {
    const { user } = useAuth();
    const [selectedMood, setSelectedMood] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [savedMood, setSavedMood] = useState<string | null>(null);
    const [hidden, setHidden] = useState(false);
    const [lastMood, setLastMood] = useState<{ mood: string; time: string } | null>(null);

    // Check cooldown + fetch latest mood on mount
    useEffect(() => {
        const key = getCooldownKey();
        const saved = localStorage.getItem(key);
        if (saved) {
            setHidden(true);
        }

        // Fetch latest mood from backend
        if (user) {
            api.getLatestMood(user.uid).then((res) => {
                if (res.exists && res.moodLog) {
                    setLastMood({ mood: res.moodLog.mood, time: res.moodLog.createdAt });
                }
            }).catch(() => { });
        }
    }, [user]);

    const handleMoodSelect = (mood: Mood) => {
        setSelectedMood(mood.label);
        onMoodSelect?.(mood);
    };

    const handleSave = useCallback(async () => {
        if (!selectedMood || !user) return;

        setIsSaving(true);
        try {
            const period = getTimePeriod();
            const result = await api.logMood({
                firebaseUid: user.uid,
                mood: selectedMood,
                period,
            });
            setSavedMood(selectedMood);
            setLastMood({ mood: selectedMood, time: result.moodLog.createdAt });

            // Set cooldown in localStorage
            const key = getCooldownKey();
            localStorage.setItem(key, JSON.stringify({ mood: selectedMood, time: new Date().toISOString() }));
        } catch (err) {
            console.error('Failed to save mood:', err);
            // Still show feedback on error
            setSavedMood(selectedMood);
        } finally {
            setIsSaving(false);
        }
    }, [selectedMood, user]);

    // Don't render if already completed this period
    if (hidden) return null;

    const periodLabel = getTimePeriod();
    const feedback = savedMood ? moodMessages[savedMood] : null;

    // Show personalized feedback after saving
    if (savedMood && feedback) {
        return (
            <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.06)] bg-gradient-to-br from-pink-50/50 via-purple-50/50 to-blue-50/50">
                <CardContent>
                    <div className="text-center py-2">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <FiCheck className="w-6 h-6 text-green-600" />
                        </div>
                        <p className="text-lg font-semibold text-gray-900 mb-1">{feedback.title}</p>
                        <p className="text-sm text-gray-600 mb-3">{feedback.message}</p>
                        <p className="text-xs text-gray-400 italic">{feedback.tip}</p>
                        <p className="text-[10px] text-gray-400 mt-3">
                            Mood logged for this {periodLabel}. Check back later!
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.06)] bg-gradient-to-br from-pink-50/50 via-purple-50/50 to-blue-50/50">
            <CardContent>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="font-semibold text-gray-900">How are you feeling?</h3>
                        <p className="text-sm text-gray-500">
                            {periodLabel === 'morning' && 'Good morning! Start your day with a check-in.'}
                            {periodLabel === 'afternoon' && 'Afternoon check-in. How are things going?'}
                            {periodLabel === 'evening' && 'Evening wind-down. How was your day?'}
                        </p>
                    </div>
                    {lastMood && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-xs text-gray-500">
                            <span>{moodEmojis[lastMood.mood] || '😐'}</span>
                            <FiClock className="w-3 h-3" />
                            <span>{formatRelativeTime(lastMood.time)}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between gap-2 mb-4">
                    {moods.map((mood) => (
                        <button
                            key={mood.label}
                            onClick={() => handleMoodSelect(mood)}
                            className={`flex-1 flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-200 ${selectedMood === mood.label
                                ? `${mood.bgColor} border-current ${mood.color} scale-105 shadow-md`
                                : 'bg-white border-gray-100 hover:border-gray-200'
                                }`}
                        >
                            <span className="text-3xl mb-1">{mood.emoji}</span>
                            <span className={`text-xs font-medium ${selectedMood === mood.label ? mood.color : 'text-gray-600'}`}>
                                {mood.label}
                            </span>
                        </button>
                    ))}
                </div>

                {selectedMood && (
                    <Button
                        onClick={handleSave}
                        isLoading={isSaving}
                        className="w-full bg-[#1F2F98] hover:bg-[#1F2F98]/90"
                    >
                        Log Mood
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
