'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select } from '@/components/ui';
import { FiDroplet, FiCheck, FiClock, FiAlertTriangle, FiTrendingUp, FiTrendingDown, FiThumbsUp, FiInfo } from 'react-icons/fi';
import api from '@/lib/api';

const readingTypes = [
    { value: 'fasting', label: 'Fasting (before eating)' },
    { value: 'before_meal', label: 'Before meal' },
    { value: 'after_meal', label: 'After meal' },
    { value: 'bedtime', label: 'Bedtime' },
    { value: 'random', label: 'Random' },
    { value: 'other', label: 'Other' },
];

const glucoseSchema = z.object({
    value: z.string().min(1, 'Value is required'),
    readingType: z.string().min(1, 'Please select a reading type'),
    mealContext: z.string().optional(),
    activityContext: z.string().optional(),
    notes: z.string().optional(),
    recordedAt: z.string().optional(),
});

type GlucoseFormData = z.infer<typeof glucoseSchema>;

// Personalized messages based on glucose level
function getGlucoseMessage(value: number, userName?: string): {
    title: string;
    message: string;
    icon: React.ComponentType<{ className?: string }>;
    gradient: string;
    textColor: string;
    borderColor: string;
} | null {
    const name = userName?.split(' ')[0] || 'there';

    if (value < 54) {
        return {
            title: 'Very Low — Take Action',
            message: `Hey ${name}, this is quite low. Please have some fast-acting glucose (juice, candy) right away and retest in 15 minutes. Your safety comes first.`,
            icon: FiAlertTriangle,
            gradient: 'from-red-50 to-rose-50',
            textColor: 'text-red-700',
            borderColor: 'border-red-200',
        };
    }
    if (value < 70) {
        return {
            title: 'Below Range',
            message: `${name}, this is a bit low. Consider having a small snack to bring your levels up. A piece of fruit or some crackers can help. You've got this!`,
            icon: FiTrendingDown,
            gradient: 'from-orange-50 to-amber-50',
            textColor: 'text-orange-700',
            borderColor: 'border-orange-200',
        };
    }
    if (value <= 140) {
        return {
            title: 'In Target Range',
            message: `Great job, ${name}! Your glucose is right where it should be. Whatever you're doing — keep it up! Your consistency is paying off.`,
            icon: FiThumbsUp,
            gradient: 'from-green-50 to-emerald-50',
            textColor: 'text-green-700',
            borderColor: 'border-green-200',
        };
    }
    if (value <= 180) {
        return {
            title: 'Slightly Elevated',
            message: `Hey ${name}, your levels are a little above target but nothing to worry about. A short walk or some water can help bring things down. You're doing well overall!`,
            icon: FiTrendingUp,
            gradient: 'from-yellow-50 to-amber-50',
            textColor: 'text-yellow-700',
            borderColor: 'border-yellow-200',
        };
    }
    if (value <= 250) {
        return {
            title: 'High — Monitor Closely',
            message: `${name}, your glucose is running high. Stay hydrated, avoid extra carbs for now, and consider checking again in an hour. Remember, one high reading doesn't define your journey.`,
            icon: FiTrendingUp,
            gradient: 'from-orange-50 to-red-50',
            textColor: 'text-orange-700',
            borderColor: 'border-orange-200',
        };
    }
    return {
        title: 'Very High — Seek Guidance',
        message: `Hey ${name}, this reading is quite high. Please drink water, rest, and consider reaching out to your healthcare provider if it stays elevated. We're here to support you.`,
        icon: FiAlertTriangle,
        gradient: 'from-red-50 to-rose-50',
        textColor: 'text-red-800',
        borderColor: 'border-red-300',
    };
}

export default function GlucosePage() {
    const { user } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm<GlucoseFormData>({
        resolver: zodResolver(glucoseSchema),
        defaultValues: {
            readingType: 'random',
            recordedAt: new Date().toISOString().slice(0, 16),
        },
    });

    const watchedValue = watch('value');
    const glucoseNum = watchedValue ? parseFloat(watchedValue) : null;
    const glucoseMessage = glucoseNum && !isNaN(glucoseNum) && glucoseNum >= 20 && glucoseNum <= 600
        ? getGlucoseMessage(glucoseNum, user?.displayName || undefined)
        : null;

    const onSubmit = async (data: GlucoseFormData) => {
        if (!user) return;

        const glucoseValue = parseFloat(data.value);
        if (isNaN(glucoseValue) || glucoseValue < 20 || glucoseValue > 600) {
            setError('Glucose value must be between 20 and 600');
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            await api.createGlucoseReading({
                firebaseUid: user.uid,
                value: glucoseValue,
                unit: 'mg/dL',
                readingType: data.readingType,
                mealContext: data.mealContext,
                activityContext: data.activityContext,
                notes: data.notes,
                recordedAt: data.recordedAt ? new Date(data.recordedAt).toISOString() : new Date().toISOString(),
            });

            setIsSuccess(true);
            reset({
                readingType: 'random',
                recordedAt: new Date().toISOString().slice(0, 16),
            });

            setTimeout(() => {
                setIsSuccess(false);
            }, 3000);
        } catch (err) {
            console.error('Error saving reading:', err);
            setError('Failed to save reading. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const getGlucoseIndicator = (value: string) => {
        const numValue = parseInt(value, 10);
        if (isNaN(numValue)) return null;

        if (numValue < 70) {
            return { text: 'Low', color: 'text-red-600', bg: 'bg-red-50', ring: 'ring-red-200' };
        }
        if (numValue <= 180) {
            return { text: 'In Range', color: 'text-green-600', bg: 'bg-green-50', ring: 'ring-green-200' };
        }
        return { text: 'High', color: 'text-orange-600', bg: 'bg-orange-50', ring: 'ring-orange-200' };
    };

    const indicator = watchedValue ? getGlucoseIndicator(watchedValue) : null;

    return (
        <div className="max-w-2xl mx-auto space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gradient-to-br from-[#1F2F98] to-[#3B4CC0] rounded-xl flex items-center justify-center shadow-lg shadow-[#1F2F98]/20">
                    <FiDroplet className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Log Blood Glucose</h1>
                    <p className="text-sm text-gray-500">Record your current reading</p>
                </div>
            </div>

            {/* Success Message */}
            {isSuccess && (
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl flex items-center shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 shrink-0">
                        <FiCheck className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-green-700 font-medium">Reading saved successfully!</span>
                </div>
            )}

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    {error}
                </div>
            )}

            <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Glucose Value — prominent input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Blood Glucose Level
                            </label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    placeholder="Enter value"
                                    className={`text-3xl font-bold text-center py-5 ${indicator ? `${indicator.ring} ring-2` : ''}`}
                                    error={errors.value?.message}
                                    {...register('value')}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                                    mg/dL
                                </span>
                                {indicator && (
                                    <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-xs font-semibold px-2 py-1 rounded-full ${indicator.bg} ${indicator.color}`}>
                                        {indicator.text}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Personalized Glucose Message */}
                        {glucoseMessage && (
                            <div className={`p-4 bg-gradient-to-r ${glucoseMessage.gradient} border ${glucoseMessage.borderColor} rounded-xl`}>
                                <div className="flex items-start gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${glucoseMessage.textColor} bg-white/60`}>
                                        <glucoseMessage.icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className={`text-sm font-semibold ${glucoseMessage.textColor} mb-1`}>{glucoseMessage.title}</p>
                                        <p className={`text-sm ${glucoseMessage.textColor} opacity-80`}>{glucoseMessage.message}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Reading Type + Date/Time — side by side */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Select
                                label="When was this taken?"
                                options={readingTypes}
                                error={errors.readingType?.message}
                                {...register('readingType')}
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <FiClock className="w-3.5 h-3.5 inline mr-1" />
                                    Date & Time
                                </label>
                                <Input
                                    type="datetime-local"
                                    {...register('recordedAt')}
                                />
                            </div>
                        </div>

                        {/* Context — side by side */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                                label="Meal context (optional)"
                                placeholder="e.g., After breakfast"
                                {...register('mealContext')}
                            />
                            <Input
                                label="Activity context (optional)"
                                placeholder="e.g., After exercise"
                                {...register('activityContext')}
                            />
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notes (optional)
                            </label>
                            <textarea
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1F2F98]/50 focus:border-[#1F2F98] transition-all text-sm"
                                rows={2}
                                placeholder="Add any additional notes..."
                                {...register('notes')}
                            />
                        </div>

                        {/* Submit buttons */}
                        <div className="flex gap-3">
                            <Button type="submit" className="flex-1" isLoading={isLoading}>
                                <FiCheck className="w-4 h-4 mr-2" />
                                Save Reading
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push('/dashboard')}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Tips — compact */}
            <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
                <CardContent>
                    <div className="flex items-center gap-2 mb-3">
                        <FiInfo className="w-4 h-4 text-[#1F2F98]" />
                        <h3 className="font-semibold text-gray-900 text-sm">Tips for Accurate Readings</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            'Wash and dry your hands first',
                            'Use the side of your fingertip',
                            'Wait 2hrs after eating for post-meal',
                            'Log consistently at similar times',
                        ].map((tip, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-gray-500">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#1F2F98]/30 mt-1.5 shrink-0" />
                                {tip}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
