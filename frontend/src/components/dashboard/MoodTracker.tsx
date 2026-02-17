'use client';

import React, { useState } from 'react';
import { Card, CardContent, Button } from '@/components/ui';

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

interface MoodTrackerProps {
    onMoodSelect?: (mood: Mood) => void;
}

export default function MoodTracker({ onMoodSelect }: MoodTrackerProps) {
    const [selectedMood, setSelectedMood] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleMoodSelect = (mood: Mood) => {
        setSelectedMood(mood.label);
        onMoodSelect?.(mood);
    };

    const handleSave = async () => {
        if (!selectedMood) return;

        setIsSaving(true);
        // TODO: Save mood to backend
        await new Promise(resolve => setTimeout(resolve, 500));
        setIsSaving(false);
        setSaved(true);

        setTimeout(() => {
            setSaved(false);
            setSelectedMood(null);
        }, 2000);
    };

    return (
        <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.06)] bg-gradient-to-br from-pink-50/50 via-purple-50/50 to-blue-50/50">
            <CardContent>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="font-semibold text-gray-900">How are you feeling?</h3>
                        <p className="text-sm text-gray-500">Track your mood throughout the day</p>
                    </div>
                    {saved && (
                        <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                            ✓ Saved!
                        </span>
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

                {selectedMood && !saved && (
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
