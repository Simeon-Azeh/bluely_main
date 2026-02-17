'use client';

import React, { useState } from 'react';
import { Card, CardContent, Button } from '@/components/ui';
import { FiX, FiSend, FiSun, FiCheck } from 'react-icons/fi';
import { IoTvOutline, IoWalkOutline, IoBarbellOutline } from 'react-icons/io5';
import { TbMoon, TbMoodSmile, TbMoodNeutral, TbMoodSad, TbStars, TbMoodCrazyHappy } from 'react-icons/tb';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

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
            await api.upsertHealthProfile(user.uid, {
                exerciseFrequency,
                sleepQuality,
                stressLevel,
            });
            setSubmitted(true);
            setTimeout(() => onComplete?.(), 1500);
        } catch (error) {
            console.error('Error saving lifestyle check-in:', error);
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
                        <p className="font-semibold text-green-700">Lifestyle check-in complete!</p>
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
                        <p className="text-xs text-gray-500">Quick weekly update</p>
                    </div>
                </div>

                {/* Exercise Frequency — horizontal */}
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

                {/* Sleep Quality + Stress Level — side by side */}
                <div className="grid grid-cols-2 gap-4 mb-5">
                    {/* Sleep Quality */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Sleep <span className="text-gray-400 text-xs">({sleepQuality ? sleepLabels[sleepQuality - 1] : '—'})</span>
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

                    {/* Stress Level */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Stress <span className="text-gray-400 text-xs">({stressLevel ? stressLabels[stressLevel - 1] : '—'})</span>
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
