'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select } from '@/components/ui';
import { FiDroplet, FiCheck, FiClock, FiAlertTriangle, FiTrendingUp, FiTrendingDown, FiThumbsUp, FiInfo, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { TbPill, TbVaccine, TbTargetArrow } from 'react-icons/tb';
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
    medicationTaken: z.boolean().optional(),
    medicationName: z.string().optional(),
    medicationType: z.string().optional(),
    medicationDose: z.string().optional(),
    medicationDoseUnit: z.string().optional(),
    injectionSite: z.string().optional(),
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
            title: 'Very Low Reading Detected',
            message: `${name}, this reading is significantly below the target range. Very low glucose may need immediate attention — please follow your provider's guidance for low readings and recheck in 15 minutes.`,
            icon: FiAlertTriangle,
            gradient: 'from-red-50 to-rose-50',
            textColor: 'text-red-700',
            borderColor: 'border-red-200',
        };
    }
    if (value < 70) {
        return {
            title: 'Below Target Range',
            message: `${name}, this reading is below the typical target range. Logging follow-up readings can help you and your provider identify if this is a recurring pattern.`,
            icon: FiTrendingDown,
            gradient: 'from-orange-50 to-amber-50',
            textColor: 'text-orange-700',
            borderColor: 'border-orange-200',
        };
    }
    if (value <= 140) {
        return {
            title: 'Within Target Range',
            message: `${name}, this reading falls within the typical target range. Consistent logging helps build a clearer picture of your patterns over time.`,
            icon: FiThumbsUp,
            gradient: 'from-green-50 to-emerald-50',
            textColor: 'text-green-700',
            borderColor: 'border-green-200',
        };
    }
    if (value <= 180) {
        return {
            title: 'Slightly Above Target',
            message: `${name}, this reading is slightly above the target range. This can vary based on meals, activity, and timing — logging context alongside readings helps identify patterns.`,
            icon: FiTrendingUp,
            gradient: 'from-yellow-50 to-amber-50',
            textColor: 'text-yellow-700',
            borderColor: 'border-yellow-200',
        };
    }
    if (value <= 250) {
        return {
            title: 'Above Target Range',
            message: `${name}, this reading is above the target range. Continued monitoring and noting any contributing factors (meals, stress, timing) can provide useful context for your provider.`,
            icon: FiTrendingUp,
            gradient: 'from-orange-50 to-red-50',
            textColor: 'text-orange-700',
            borderColor: 'border-orange-200',
        };
    }
    return {
        title: 'Significantly Elevated Reading',
        message: `${name}, this reading is significantly above target. If elevated readings persist, consider discussing them with your healthcare provider. Logging follow-up readings helps track the trend.`,
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
    const [showMedication, setShowMedication] = useState(false);
    const [medications, setMedications] = useState<Array<{ _id: string; medicationName: string; medicationType: string; dosage: number; doseUnit: string; isInjectable: boolean }>>([]);
    const [injectionRec, setInjectionRec] = useState<{ recommendedSite: string } | null>(null);

    const {
        register,
        handleSubmit,
        watch,
        reset,
        setValue,
        formState: { errors },
    } = useForm<GlucoseFormData>({
        resolver: zodResolver(glucoseSchema),
        defaultValues: {
            readingType: 'random',
            recordedAt: new Date().toISOString().slice(0, 16),
            medicationTaken: false,
            medicationDoseUnit: 'units',
        },
    });

    const watchedValue = watch('value');
    const watchedMedTaken = watch('medicationTaken');
    const watchedMedType = watch('medicationType');
    const glucoseNum = watchedValue ? parseFloat(watchedValue) : null;
    const glucoseMessage = glucoseNum && !isNaN(glucoseNum) && glucoseNum >= 20 && glucoseNum <= 600
        ? getGlucoseMessage(glucoseNum, user?.displayName || undefined)
        : null;
    const isInsulinType = watchedMedType?.startsWith('insulin');

    // Load user's medications for quick-select
    useEffect(() => {
        const loadMeds = async () => {
            if (!user) return;
            try {
                const data = await api.getMedications(user.uid, true);
                setMedications(data.medications);
                if (data.medications.length > 0) {
                    setShowMedication(true);
                }
            } catch (err) {
                console.error('Error loading medications:', err);
            }
            try {
                const rec = await api.getInjectionSiteRecommendation(user.uid);
                setInjectionRec(rec);
            } catch (err) {
                console.error('Error loading injection rec:', err);
            }
        };
        loadMeds();
    }, [user]);

    const handleMedSelect = (med: typeof medications[0]) => {
        setValue('medicationName', med.medicationName);
        setValue('medicationType', med.medicationType);
        setValue('medicationDose', med.dosage.toString());
        setValue('medicationDoseUnit', med.doseUnit);
        setValue('medicationTaken', true);
        if (med.isInjectable && injectionRec) {
            setValue('injectionSite', injectionRec.recommendedSite);
        }
    };

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
                medicationTaken: data.medicationTaken,
                medicationName: data.medicationTaken ? data.medicationName : undefined,
                medicationType: data.medicationTaken ? data.medicationType : undefined,
                medicationDose: data.medicationTaken && data.medicationDose ? parseFloat(data.medicationDose) : undefined,
                medicationDoseUnit: data.medicationTaken ? data.medicationDoseUnit : undefined,
                injectionSite: data.medicationTaken ? data.injectionSite : undefined,
            });

            // Also log medication if taken
            if (data.medicationTaken && data.medicationName && data.medicationDose) {
                try {
                    await api.logMedication({
                        firebaseUid: user.uid,
                        medicationName: data.medicationName,
                        medicationType: data.medicationType || 'other',
                        dosage: parseFloat(data.medicationDose),
                        doseUnit: data.medicationDoseUnit || 'units',
                        injectionSite: data.injectionSite,
                        takenAt: data.recordedAt ? new Date(data.recordedAt).toISOString() : new Date().toISOString(),
                    });
                } catch (medErr) {
                    console.warn('Medication log failed (non-critical):', medErr);
                }
            }

            setIsSuccess(true);
            reset({
                readingType: 'random',
                recordedAt: new Date().toISOString().slice(0, 16),
                medicationTaken: false,
                medicationDoseUnit: 'units',
            });

            // Trigger a new 30-min forecast in the background after logging
            try {
                await api.getGlucose30(user.uid, 'glucose_log');
            } catch (forecastErr) {
                console.warn('Forecast refresh after glucose log failed (non-critical):', forecastErr);
            }

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

                        {/* Medication Section */}
                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setShowMedication(!showMedication)}
                                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <TbPill className="w-4 h-4 text-[#1F2F98]" />
                                    <span className="text-sm font-medium text-gray-700">Medication with this reading</span>
                                </div>
                                {showMedication ? (
                                    <FiChevronUp className="w-4 h-4 text-gray-400" />
                                ) : (
                                    <FiChevronDown className="w-4 h-4 text-gray-400" />
                                )}
                            </button>

                            {showMedication && (
                                <div className="p-4 space-y-4">
                                    {/* Toggle */}
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded border-gray-300 text-[#1F2F98] focus:ring-[#1F2F98]"
                                            {...register('medicationTaken')}
                                        />
                                        <span className="text-sm text-gray-700">I took medication with this reading</span>
                                    </label>

                                    {watchedMedTaken && (
                                        <>
                                            {/* Quick-select from user's medications */}
                                            {medications.length > 0 && (
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-2">Quick Select</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {medications.map((med) => (
                                                            <button
                                                                key={med._id}
                                                                type="button"
                                                                onClick={() => handleMedSelect(med)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:border-[#1F2F98] hover:bg-blue-50 transition-colors text-sm"
                                                            >
                                                                {med.isInjectable ? (
                                                                    <TbVaccine className="w-3.5 h-3.5 text-violet-500" />
                                                                ) : (
                                                                    <TbPill className="w-3.5 h-3.5 text-blue-500" />
                                                                )}
                                                                {med.medicationName}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <Input
                                                    label="Medication Name"
                                                    placeholder="e.g., Humalog"
                                                    {...register('medicationName')}
                                                />
                                                <Select
                                                    label="Type"
                                                    options={[
                                                        { value: 'insulin_rapid', label: 'Insulin (Rapid)' },
                                                        { value: 'insulin_long', label: 'Insulin (Long)' },
                                                        { value: 'insulin_mixed', label: 'Insulin (Mixed)' },
                                                        { value: 'metformin', label: 'Metformin' },
                                                        { value: 'other_oral', label: 'Other Oral' },
                                                        { value: 'other', label: 'Other' },
                                                    ]}
                                                    {...register('medicationType')}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <Input
                                                    label="Dose"
                                                    type="number"
                                                    placeholder="e.g., 10"
                                                    {...register('medicationDose')}
                                                />
                                                <Select
                                                    label="Unit"
                                                    options={[
                                                        { value: 'units', label: 'Units' },
                                                        { value: 'mg', label: 'mg' },
                                                        { value: 'mcg', label: 'mcg' },
                                                    ]}
                                                    {...register('medicationDoseUnit')}
                                                />
                                            </div>

                                            {/* Injection Site — only for insulin */}
                                            {isInsulinType && (
                                                <div>
                                                    <Select
                                                        label={
                                                            injectionRec
                                                                ? `Injection Site (Recommended: ${injectionRec.recommendedSite.replace(/_/g, ' ')})`
                                                                : 'Injection Site'
                                                        }
                                                        options={[
                                                            { value: '', label: 'Select site...' },
                                                            { value: 'abdomen_left', label: 'Abdomen (Left)' },
                                                            { value: 'abdomen_right', label: 'Abdomen (Right)' },
                                                            { value: 'thigh_left', label: 'Thigh (Left)' },
                                                            { value: 'thigh_right', label: 'Thigh (Right)' },
                                                            { value: 'arm_left', label: 'Arm (Left)' },
                                                            { value: 'arm_right', label: 'Arm (Right)' },
                                                            { value: 'buttock_left', label: 'Buttock (Left)' },
                                                            { value: 'buttock_right', label: 'Buttock (Right)' },
                                                        ]}
                                                        {...register('injectionSite')}
                                                    />
                                                    {injectionRec && (
                                                        <div className="flex items-center gap-2 mt-1.5 text-xs text-violet-600">
                                                            <TbTargetArrow className="w-3.5 h-3.5" />
                                                            Rotate sites to prevent lipohypertrophy
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
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
                    <p className="text-[10px] text-gray-400 mt-3 text-center">
                        Insights are based on logged data patterns and are not medical instructions.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
