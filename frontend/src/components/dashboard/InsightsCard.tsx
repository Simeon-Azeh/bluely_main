'use client';

import React, { useState } from 'react';
import { Card, CardContent, Button } from '@/components/ui';
import { FiX, FiHeart, FiSend, FiCheck } from 'react-icons/fi';
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
        <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.06)] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
            <CardContent>
                {/* Dismiss button */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <FiX className="w-4 h-4" />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#1F2F98] to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-[#1F2F98]/20">
                        <FiHeart className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Personalize Your Insights</h3>
                        <p className="text-xs text-gray-500">Quick 3-question survey</p>
                    </div>
                </div>

                {/* Activity Level + Typical Meals — side by side */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* Activity Level */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Activity Level</label>
                        <div className="space-y-2">
                            {[
                                { value: 'low', label: 'Low', icon: IoWalkOutline, desc: 'Sedentary' },
                                { value: 'medium', label: 'Medium', icon: IoFitnessOutline, desc: 'Some exercise' },
                                { value: 'high', label: 'High', icon: IoBarbellOutline, desc: 'Very active' },
                            ].map((opt) => {
                                const Icon = opt.icon;
                                return (
                                    <button
                                        key={opt.value}
                                        onClick={() => setActivityLevel(opt.value)}
                                        className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border-2 text-left transition-all ${activityLevel === opt.value
                                            ? 'border-[#1F2F98] bg-blue-50 shadow-[0_4px_20px_rgba(0,0,0,0.06)]'
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activityLevel === opt.value ? 'bg-[#1F2F98] text-white' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <span className="text-sm font-medium text-gray-800 block">{opt.label}</span>
                                            <span className="text-[10px] text-gray-400">{opt.desc}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Meal Preference */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Typical Meals</label>
                        <div className="space-y-2">
                            {[
                                { value: 'home_cooked', label: 'Home-cooked', icon: IoHomeOutline },
                                { value: 'processed', label: 'Processed', icon: IoFastFoodOutline },
                                { value: 'mixed', label: 'Mixed', icon: IoRestaurantOutline },
                            ].map((opt) => {
                                const Icon = opt.icon;
                                return (
                                    <button
                                        key={opt.value}
                                        onClick={() => setMealPreference(opt.value)}
                                        className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border-2 text-left transition-all ${mealPreference === opt.value
                                            ? 'border-[#1F2F98] bg-blue-50 shadow-[0_4px_20px_rgba(0,0,0,0.06)]'
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${mealPreference === opt.value ? 'bg-[#1F2F98] text-white' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-800">{opt.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Medication — full width, inline */}
                <div className="mb-5">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Are you on any medication?</label>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { value: true, label: 'Yes', icon: TbPill },
                            { value: false, label: 'No', icon: TbPillOff },
                        ].map((opt) => {
                            const Icon = opt.icon;
                            return (
                                <button
                                    key={String(opt.value)}
                                    onClick={() => setOnMedication(opt.value)}
                                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${onMedication === opt.value
                                        ? 'border-[#1F2F98] bg-blue-50 shadow-[0_4px_20px_rgba(0,0,0,0.06)]'
                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                        }`}
                                >
                                    <Icon className={`w-5 h-5 ${onMedication === opt.value ? 'text-[#1F2F98]' : 'text-gray-400'}`} />
                                    <span className="text-sm font-medium text-gray-700">{opt.label}</span>
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
