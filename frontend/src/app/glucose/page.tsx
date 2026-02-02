'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select } from '@/components/ui';
import { FiDroplet, FiCheck, FiClock } from 'react-icons/fi';
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
    value: z.coerce.number().min(20, 'Value must be at least 20').max(600, 'Value must be at most 600'),
    readingType: z.string().min(1, 'Please select a reading type'),
    mealContext: z.string().optional(),
    activityContext: z.string().optional(),
    notes: z.string().optional(),
    recordedAt: z.string().optional(),
});

type GlucoseFormData = z.infer<typeof glucoseSchema>;

export default function GlucosePage() {
    const { user } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<GlucoseFormData>({
        resolver: zodResolver(glucoseSchema),
        defaultValues: {
            readingType: 'random',
            recordedAt: new Date().toISOString().slice(0, 16),
        },
    });

    const onSubmit = async (data: GlucoseFormData) => {
        if (!user) return;

        try {
            setIsLoading(true);
            setError(null);

            await api.createGlucoseReading({
                firebaseUid: user.uid,
                value: data.value,
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
            return { text: 'Low', color: 'text-red-600', bg: 'bg-red-50' };
        }
        if (numValue <= 180) {
            return { text: 'In Range', color: 'text-green-600', bg: 'bg-green-50' };
        }
        return { text: 'High', color: 'text-orange-600', bg: 'bg-orange-50' };
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Log Blood Glucose</h1>
                <p className="text-gray-600 mt-1">
                    Record your current blood glucose reading
                </p>
            </div>

            {isSuccess && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
                    <FiCheck className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-green-700">Reading saved successfully!</span>
                </div>
            )}

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <FiDroplet className="w-5 h-5 mr-2 text-blue-600" />
                        New Reading
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Glucose Value */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Blood Glucose Level
                            </label>
                            <div className="flex items-center space-x-4">
                                <div className="flex-1 relative">
                                    <Input
                                        type="number"
                                        placeholder="Enter value"
                                        className="text-2xl font-bold text-center py-4"
                                        error={errors.value?.message}
                                        {...register('value')}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                                        mg/dL
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Reading Type */}
                        <Select
                            label="When was this reading taken?"
                            options={readingTypes}
                            error={errors.readingType?.message}
                            {...register('readingType')}
                        />

                        {/* Date/Time */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <FiClock className="w-4 h-4 inline mr-1" />
                                Date & Time
                            </label>
                            <Input
                                type="datetime-local"
                                {...register('recordedAt')}
                            />
                        </div>

                        {/* Context */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                rows={3}
                                placeholder="Add any additional notes..."
                                {...register('notes')}
                            />
                        </div>

                        {/* Submit buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
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

            {/* Quick tips */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Tips for Accurate Readings</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li>• Wash and dry your hands before testing</li>
                        <li>• Use the side of your fingertip for less pain</li>
                        <li>• Wait 2 hours after eating for post-meal readings</li>
                        <li>• Log readings consistently at similar times each day</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
