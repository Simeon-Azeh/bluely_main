'use client';

import React, { useState } from 'react';
import { Card, CardContent, Button } from '@/components/ui';
import { FiX, FiSend, FiCheck } from 'react-icons/fi';
import { IoWalkOutline, IoFitnessOutline, IoBarbellOutline, IoHomeOutline, IoFastFoodOutline, IoRestaurantOutline } from 'react-icons/io5';
import { TbPill, TbPillOff } from 'react-icons/tb';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

interface InsightsCardProps {
    onComplete?: () => void;
    onDismiss?: () => void;
}

export default function InsightsCard({ onComplete, onDismiss }: InsightsCardProps) {
    const { user } = useAuth();
    const [activityLevel, setActivityLevel] = useState('');
    const [mealPreference, setMealPreference] = useState('');
    const [onMedication, setOnMedication] = useState<boolean | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleDismiss = async () => {
        if (!user) return;
        try {
            await api.dismissHealthPrompt(user.uid);
        } catch (e) {
            console.error('Failed to dismiss prompt:', e);
        }
        onDismiss?.();
    };

    const handleSubmit = async () => {
        if (!user || !activityLevel || !mealPreference || onMedication === null) return;

        setIsSubmitting(true);
        try {
            await api.upsertHealthProfile(user.uid, {
                activityLevel,
                mealPreference,
                onMedication,
            });
            setSubmitted(true);
            setTimeout(() => onComplete?.(), 1500);
        } catch (error) {
            console.error('Error saving insights:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.06)] bg-gradient-to-br from-green-50 to-emerald-50">
                <CardContent>
                    <div className="text-center py-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <FiCheck className="w-6 h-6 text-green-600" />
                        </div>
                        <p className="font-semibold text-green-700">Thanks! Your insights are saved.</p>
                        <p className="text-sm text-green-600 mt-1">We&apos;ll use this to personalize your experience.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const isValid = activityLevel && mealPreference && onMedication !== null;

    return (
        <Card className="relative overflow-hidden rounded-[20px] border border-[#e3e7f0] bg-white shadow-none dark:border-white/10 dark:bg-[#1a1a1a]">
            <CardContent>
                {/* Dismiss button */}
                <button
                    onClick={handleDismiss}
                    aria-label="Dismiss personal context questions"
                    className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10"
                >
                    <FiX className="w-4 h-4" />
                </button>

                {/* Header */}
                <div className="mb-6 pr-10">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5365b2] dark:text-[#aebdff]">Add context</p>
                    <h3 className="mt-1 text-lg font-semibold text-[#101b4b] dark:text-white">Make your insights more relevant</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">A few details about everyday life can help put your readings in context.</p>
                </div>

                {/* Activity Level + Typical Meals — side by side */}
                <div className="grid gap-6 mb-6 md:grid-cols-2">
                    {/* Activity Level */}
                    <div>
                        <p className="text-sm font-semibold text-[#101b4b] mb-2 dark:text-white">Activity level</p>
                        <div className="space-y-2" role="group" aria-label="Activity level">
                            {[
                                { value: 'low', label: 'Low', icon: IoWalkOutline, desc: 'Sedentary' },
                                { value: 'medium', label: 'Medium', icon: IoFitnessOutline, desc: 'Some exercise' },
                                { value: 'high', label: 'High', icon: IoBarbellOutline, desc: 'Very active' },
                            ].map((opt) => {
                                const Icon = opt.icon;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setActivityLevel(opt.value)}
                                        aria-pressed={activityLevel === opt.value}
                                        className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-colors ${activityLevel === opt.value
                                            ? 'border-[#1F2F98] bg-[#f3f5ff] dark:bg-[#1F2F98]/20'
                                            : 'border-[#e3e7f0] bg-white hover:border-[#aab7e8] dark:border-white/10 dark:bg-[#1a1a1a]'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activityLevel === opt.value ? 'bg-[#1F2F98] text-white' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <span className="text-sm font-medium text-gray-800 dark:text-white block">{opt.label}</span>
                                            <span className="text-[10px] text-gray-400">{opt.desc}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Meal Preference */}
                    <div>
                        <p className="text-sm font-semibold text-[#101b4b] mb-2 dark:text-white">Typical meals</p>
                        <div className="space-y-2" role="group" aria-label="Typical meals">
                            {[
                                { value: 'home_cooked', label: 'Home-cooked', icon: IoHomeOutline },
                                { value: 'processed', label: 'Processed', icon: IoFastFoodOutline },
                                { value: 'mixed', label: 'Mixed', icon: IoRestaurantOutline },
                            ].map((opt) => {
                                const Icon = opt.icon;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setMealPreference(opt.value)}
                                        aria-pressed={mealPreference === opt.value}
                                        className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-colors ${mealPreference === opt.value
                                            ? 'border-[#1F2F98] bg-[#f3f5ff] dark:bg-[#1F2F98]/20'
                                            : 'border-[#e3e7f0] bg-white hover:border-[#aab7e8] dark:border-white/10 dark:bg-[#1a1a1a]'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${mealPreference === opt.value ? 'bg-[#1F2F98] text-white' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-800 dark:text-white">{opt.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Medication — full width, inline */}
                <div className="mb-5">
                    <p className="text-sm font-semibold text-[#101b4b] mb-2 dark:text-white">Are you on any medication?</p>
                    <div className="grid grid-cols-2 gap-2" role="group" aria-label="Medication use">
                        {[
                            { value: true, label: 'Yes', icon: TbPill },
                            { value: false, label: 'No', icon: TbPillOff },
                        ].map((opt) => {
                            const Icon = opt.icon;
                            return (
                                <button
                                    key={String(opt.value)}
                                    type="button"
                                    onClick={() => setOnMedication(opt.value)}
                                    aria-pressed={onMedication === opt.value}
                                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-colors ${onMedication === opt.value
                                        ? 'border-[#1F2F98] bg-[#f3f5ff] dark:bg-[#1F2F98]/20'
                                        : 'border-[#e3e7f0] bg-white hover:border-[#aab7e8] dark:border-white/10 dark:bg-[#1a1a1a]'
                                        }`}
                                >
                                    <Icon className={`w-5 h-5 ${onMedication === opt.value ? 'text-[#1F2F98]' : 'text-gray-400'}`} />
                                    <span className="text-sm font-medium text-gray-700 dark:text-white">{opt.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Submit */}
                <Button
                    onClick={handleSubmit}
                    disabled={!isValid}
                    isLoading={isSubmitting}
                    className="w-full bg-[#1F2F98] hover:bg-[#1F2F98]/90 disabled:opacity-50"
                >
                    <FiSend className="w-4 h-4 mr-2" />
                    Save Insights
                </Button>
            </CardContent>
        </Card>
    );
}
