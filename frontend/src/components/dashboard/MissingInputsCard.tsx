'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, Button, Input } from '@/components/ui';
import { FiAlertCircle, FiX, FiArrowRight, FiDroplet, FiCoffee, FiTrendingDown, FiActivity, FiZap } from 'react-icons/fi';
import { TbPill } from 'react-icons/tb';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

export interface MissingInput {
    field: string;
    label: string;
    reason: string;
    href: string;
    icon: string;
    importance: 'critical' | 'high' | 'medium';
}

interface MissingInputsCardProps {
    missingInputs: MissingInput[];
    onQuickLog?: (data: QuickLogData) => Promise<void>;
    onNavigate?: (href: string) => void;
    isLoading?: boolean;
}

export interface QuickLogData {
    glucose?: { value: number; readingType?: string };
    meal?: { carbsEstimate: number; mealType: string };
    medication?: { dose: number; medicationType: string; takenAt?: string };
    activity?: { activityLevel: 'low' | 'medium' | 'high' };
    wellness?: { mood?: string; sleepHours?: number };
}

const iconMap: Record<string, React.ReactNode> = {
    glucose: <FiDroplet className="w-5 h-5" />,
    meal: <FiCoffee className="w-5 h-5" />,
    medication: <TbPill className="w-5 h-5" />,
    activity: <FiActivity className="w-5 h-5" />,
    wellness: <FiZap className="w-5 h-5" />,
    history: <FiTrendingDown className="w-5 h-5" />,
};

const importanceColors = {
    critical: 'border-amber-200 bg-amber-50/50',
    high: 'border-[#1F2F98]/20 bg-[#1F2F98]/5',
    medium: 'border-blue-200 bg-blue-50',
};

const importanceBadge = {
    critical: 'bg-amber-500 text-white',
    high: 'bg-[#1F2F98] text-white',
    medium: 'bg-blue-100 text-blue-700',
};

export default function MissingInputsCard({
    missingInputs,
    onQuickLog,
    onNavigate,
    isLoading = false,
}: MissingInputsCardProps) {
    const { user } = useAuth();
    const [quickLogData, setQuickLogData] = useState<QuickLogData>({});
    const [fieldsToLog, setFieldsToLog] = useState<Set<string>>(new Set());
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [mealDescription, setMealDescription] = useState('');
    const [estimatingMeal, setEstimatingMeal] = useState(false);
    type MealQuestion = { text: string; itemIdx: number; basePerServing: number; unitHint: string };
    const [mealEstimate, setMealEstimate] = useState<{
        carbs: number;
        confidence: string;
        breakdown: { item: string; carbs: number }[];
        questions: MealQuestion[];
    } | null>(null);
    const [adjustedBreakdown, setAdjustedBreakdown] = useState<{ item: string; carbs: number }[]>([]);
    const [existingMedications, setExistingMedications] = useState<any[]>([]);
    const [fetchingMeds, setFetchingMeds] = useState(false);
    const [showWellnessLog, setShowWellnessLog] = useState(false);

    const handleQuickInputChange = (field: string, value: string | number) => {
        setQuickLogData(prev => {
            if (field === 'glucoseValue') {
                return {
                    ...prev,
                    glucose: { ...(prev.glucose || { value: 0 }), value: parseFloat(String(value)) || 0 },
                };
            }
            if (field === 'glucoseType') {
                return {
                    ...prev,
                    glucose: { ...(prev.glucose || { value: 0 }), readingType: String(value) },
                };
            }
            if (field === 'mealCarbs') {
                return {
                    ...prev,
                    meal: {
                        ...(prev.meal || { carbsEstimate: 0, mealType: 'snack' }),
                        carbsEstimate: parseFloat(String(value)) || 0,
                    },
                };
            }
            if (field === 'mealType') {
                return {
                    ...prev,
                    meal: {
                        ...(prev.meal || { carbsEstimate: 0, mealType: 'snack' }),
                        mealType: String(value),
                    },
                };
            }
            if (field === 'medicationDose') {
                return {
                    ...prev,
                    medication: {
                        ...(prev.medication || { dose: 0, medicationType: 'insulin_rapid' }),
                        dose: parseFloat(String(value)) || 0,
                    },
                };
            }
            if (field === 'medicationType') {
                return {
                    ...prev,
                    medication: {
                        ...(prev.medication || { dose: 0, medicationType: 'insulin_rapid' }),
                        medicationType: String(value),
                    },
                };
            }
            if (field === 'medicationTakenAt') {
                return {
                    ...prev,
                    medication: {
                        ...(prev.medication || { dose: 0, medicationType: 'insulin_rapid' }),
                        takenAt: String(value),
                    },
                };
            }
            if (field === 'mood') {
                return { ...prev, wellness: { ...(prev.wellness || {}), mood: String(value) } };
            }
            if (field === 'sleepHours') {
                return { ...prev, wellness: { ...(prev.wellness || {}), sleepHours: parseFloat(String(value)) || 0 } };
            }
            if (field === 'activityLevel') {
                return {
                    ...prev,
                    activity: { activityLevel: String(value) as 'low' | 'medium' | 'high' },
                };
            }
            return prev;
        });
    };

    const toggleFieldLogging = (fieldKey: string) => {
        const newFields = new Set(fieldsToLog);
        if (newFields.has(fieldKey)) {
            newFields.delete(fieldKey);
        } else {
            newFields.add(fieldKey);
        }
        setFieldsToLog(newFields);
    };

    const handleQuickLogSubmit = async () => {
        if (!onQuickLog) return;

        setSubmitting(true);
        try {
            await onQuickLog(quickLogData);
            setSubmitted(true);
            setFieldsToLog(new Set());
            setQuickLogData({});

            // Auto-hide after 2 seconds
            setTimeout(() => setSubmitted(false), 2000);
        } catch (error) {
            console.error('Quick log failed:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const criticalInputs = missingInputs.filter(m =>
        typeof m === 'object' && m !== null && m.importance === 'critical'
    );
    const highInputs = missingInputs.filter(m =>
        typeof m === 'object' && m !== null && m.importance === 'high'
    );
    const mediumInputs = missingInputs.filter(m =>
        typeof m === 'object' && m !== null && m.importance === 'medium'
    );

    const handleMealEstimate = async () => {
        if (!mealDescription.trim()) return;
        setEstimatingMeal(true);
        setMealEstimate(null);
        setAdjustedBreakdown([]);
        try {
            const lower = mealDescription.toLowerCase();

            if (lower.match(/haven't eaten|have not eaten|no meal|nothing|fasting|not eaten|skipped|empty stomach/)) {
                const est = { carbs: 0, confidence: 'high', breakdown: [{ item: 'No meal', carbs: 0 }], questions: [] };
                setMealEstimate(est);
                setAdjustedBreakdown(est.breakdown.map(i => ({ ...i })));
                setQuickLogData(prev => ({ ...prev, meal: { ...(prev.meal || { carbsEstimate: 0, mealType: 'snack' }), carbsEstimate: 0, mealType: 'snack' } }));
                setEstimatingMeal(false);
                return;
            }

            await new Promise(r => setTimeout(r, 2000));

            const breakdown: { item: string; carbs: number }[] = [];
            const questions: MealQuestion[] = [];

            type FoodDef = { carbs: number; canonicalKey?: string; question?: { text: string; basePerServing: number; unitHint: string } };
            const foodItems: Record<string, FoodDef> = {
                rice: { carbs: 45, question: { text: 'How many cups of rice?', basePerServing: 45, unitHint: 'cup(s)' } },
                potato: { carbs: 26, question: { text: 'How many potatoes?', basePerServing: 26, unitHint: 'potato(es)' } },
                potatoes: { carbs: 26, canonicalKey: 'potato' },
                beans: { carbs: 20, question: { text: 'How much beans?', basePerServing: 20, unitHint: 'cup(s)' } },
                plantain: { carbs: 35, question: { text: 'How many plantain pieces?', basePerServing: 12, unitHint: 'piece(s)' } },
                yam: { carbs: 28, question: { text: 'What size portion of yam?', basePerServing: 28, unitHint: 'cup(s) boiled' } },
                fufu: { carbs: 50, question: { text: 'How many balls of fufu?', basePerServing: 50, unitHint: 'ball(s)' } },
                corn: { carbs: 17, question: { text: 'How many corns?', basePerServing: 17, unitHint: 'cob(s)' } },
                bread: { carbs: 14, question: { text: 'How many slices of bread?', basePerServing: 14, unitHint: 'slice(s)' } },
                pasta: { carbs: 43, question: { text: 'How much pasta?', basePerServing: 43, unitHint: 'cup(s) cooked' } },
                garri: { carbs: 35, question: { text: 'How much garri?', basePerServing: 35, unitHint: 'cup(s)' } },
                cassava: { carbs: 33, question: { text: 'How much cassava?', basePerServing: 33, unitHint: 'cup(s)' } },
                noodles: { carbs: 40, question: { text: 'How many packs of noodles?', basePerServing: 40, unitHint: 'pack(s)' } },
                soup: { carbs: 5 },
                stew: { carbs: 8 },
                egg: { carbs: 1 },
                eggs: { carbs: 1, canonicalKey: 'egg' },
                fish: { carbs: 0 },
                meat: { carbs: 0 },
                vegetables: { carbs: 5 },
                salad: { carbs: 5 },
            };

            const seen = new Set<string>();
            let totalCarbs = 0;
            let hasCarbs = false;

            for (const [food, data] of Object.entries(foodItems)) {
                if (!lower.includes(food)) continue;
                const key = data.canonicalKey || food;
                if (seen.has(key)) continue;
                seen.add(key);
                const baseCarbs = data.carbs;
                const itemIdx = breakdown.length;
                breakdown.push({ item: key.charAt(0).toUpperCase() + key.slice(1), carbs: baseCarbs });
                totalCarbs += baseCarbs;
                if (baseCarbs > 0) hasCarbs = true;
                if (data.question) {
                    questions.push({ text: data.question.text, itemIdx, basePerServing: data.question.basePerServing, unitHint: data.question.unitHint });
                }
            }

            if (breakdown.length === 0) {
                breakdown.push({ item: 'Mixed meal', carbs: 40 });
                questions.push({ text: 'How many servings?', itemIdx: 0, basePerServing: 40, unitHint: 'serving(s)' });
                totalCarbs = 40;
            }

            const est = { carbs: totalCarbs, confidence: hasCarbs ? 'medium' : 'high', breakdown, questions };
            setMealEstimate(est);
            setAdjustedBreakdown(breakdown.map(i => ({ ...i })));
            setQuickLogData(prev => ({ ...prev, meal: { ...(prev.meal || { carbsEstimate: 0, mealType: 'snack' }), carbsEstimate: totalCarbs } }));
        } catch (error) {
            console.error('Meal estimate failed:', error);
        } finally {
            setEstimatingMeal(false);
        }
    };

    const handleAdjustCarb = (itemIdx: number, newCarbs: number) => {
        setAdjustedBreakdown(prev => {
            const updated = [...prev];
            updated[itemIdx] = { ...updated[itemIdx], carbs: Math.max(0, newCarbs) };
            return updated;
        });
    };

    // Fetch existing medications when medication needs to be selected
    const fetchExistingMedications = async () => {
        if (!user?.uid) return;
        setFetchingMeds(true);
        try {
            const response = await fetch(`/api/medications?firebaseUid=${user.uid}`);
            if (response.ok) {
                const data = await response.json();
                setExistingMedications(data.medications || []);
            }
        } catch (error) {
            console.error('Failed to fetch medications:', error);
        } finally {
            setFetchingMeds(false);
        }
    };

    // Reset on prop change
    useEffect(() => {
        setQuickLogData({});
        setFieldsToLog(new Set());
        setSubmitted(false);
        setMealDescription('');
        setMealEstimate(null);
        setAdjustedBreakdown([]);
        setShowWellnessLog(false);
    }, [missingInputs]);

    // Fetch existing medications when medication needs to be selected
    useEffect(() => {
        if (
            missingInputs.some(m => typeof m === 'object' && m !== null && (m as MissingInput).field.includes('medication')) &&
            !existingMedications.length &&
            !fetchingMeds
        ) {
            fetchExistingMedications();
        }
    }, [missingInputs, user?.uid]);

    return (
        <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.08)] bg-linear-to-br from-[#1F2F98]/5 via-white to-white overflow-hidden">
            <CardContent className="pt-6">
                {/* Success Message */}
                {submitted && (
                    <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 space-y-1">
                        <div className="flex items-center gap-2 font-semibold text-sm">
                            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </div>
                            Data logged successfully
                        </div>
                        <p className="text-xs text-emerald-700 leading-relaxed pl-7">
                            This reading has been added to your history and will count toward your HbA1c estimate.
                        </p>
                        <p className="text-xs text-emerald-600 pl-7">Re-checking forecast readiness...</p>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-start gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                        <FiAlertCircle className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Missing Data for Accurate Forecast</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            The model needs these inputs to generate reliable predictions. Each one impacts glucose prediction accuracy.
                        </p>
                    </div>
                </div>

                {/* Critical Inputs */}
                {criticalInputs.length > 0 && (
                    <div className="mb-6 space-y-3">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Critical — Required for Prediction</p>
                        </div>
                        {criticalInputs.map(input => (
                            <div
                                key={input.field}
                                className={`p-4 border rounded-2xl transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.05)] ${importanceColors[input.importance]}`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="text-[#1F2F98] shrink-0 mt-1">
                                        {iconMap[input.icon] || <FiDroplet className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <label className="font-medium text-gray-900">{input.label}</label>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${importanceBadge[input.importance]}`}>
                                                CRITICAL
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">{input.reason}</p>

                                        {/* Quick Input Section */}
                                        {fieldsToLog.has(input.field) && (
                                            <div className="mt-3 pt-3 border-t border-amber-100 space-y-2">
                                                {input.field === 'glucose' && (
                                                    <div className="space-y-3">
                                                        <div>
                                                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Reading Type</p>
                                                            <div className="grid grid-cols-3 gap-1.5">
                                                                {[
                                                                    { value: 'fasting', label: 'Fasting' },
                                                                    { value: 'before_meal', label: 'Pre-meal' },
                                                                    { value: 'after_meal', label: 'Post-meal' },
                                                                    { value: 'random', label: 'Random' },
                                                                    { value: 'bedtime', label: 'Bedtime' },
                                                                    { value: 'wakeup', label: 'Wake-up' },
                                                                ].map(type => (
                                                                    <button
                                                                        key={type.value}
                                                                        type="button"
                                                                        onClick={() => handleQuickInputChange('glucoseType', type.value)}
                                                                        className={`py-1.5 px-1 rounded-lg border text-[11px] font-medium transition-all ${quickLogData.glucose?.readingType === type.value
                                                                            ? 'bg-[#1F2F98] text-white border-[#1F2F98] shadow-sm'
                                                                            : 'bg-white text-gray-600 border-gray-200 hover:border-[#1F2F98]/40 hover:bg-[#1F2F98]/5'
                                                                            }`}
                                                                    >
                                                                        {type.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                            {quickLogData.glucose?.readingType === 'fasting' && (
                                                                <p className="text-[10px] text-gray-400 mt-1.5">Taken after 8+ hours without food</p>
                                                            )}
                                                            {quickLogData.glucose?.readingType === 'after_meal' && (
                                                                <p className="text-[10px] text-gray-400 mt-1.5">Taken ~2 hours after eating</p>
                                                            )}
                                                            {quickLogData.glucose?.readingType === 'random' && (
                                                                <p className="text-[10px] text-gray-400 mt-1.5">Taken at any time regardless of meals</p>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="number"
                                                                placeholder="Enter value"
                                                                min={20}
                                                                max={600}
                                                                value={quickLogData.glucose?.value || ''}
                                                                onChange={e => handleQuickInputChange('glucoseValue', e.target.value)}
                                                                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1F2F98]/20 focus:border-[#1F2F98] bg-white"
                                                            />
                                                            <span className="text-sm font-medium text-gray-500 shrink-0">mg/dL</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {input.field === 'meal' && (
                                                    <div className="space-y-3 bg-white p-3 rounded-lg border border-gray-100">
                                                        {/* Bluely meal description */}
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-medium text-gray-700">Describe your meal (Bluely will estimate carbs):</label>
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="text"
                                                                    value={mealDescription}
                                                                    onChange={(e) => setMealDescription(e.target.value)}
                                                                    placeholder="e.g. Rice, stew and fried plantain"
                                                                    disabled={estimatingMeal}
                                                                    className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1F2F98]/20 focus:border-[#1F2F98]"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={handleMealEstimate}
                                                                    disabled={!mealDescription.trim() || estimatingMeal}
                                                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:scale-[1.03] hover:shadow-[0_4px_16px_rgba(79,70,229,0.4)] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
                                                                    style={{ background: 'linear-gradient(135deg, #1F2F98, #4338ca, #7c3aed)' }}
                                                                >
                                                                    <FiZap className={`w-3.5 h-3.5 ${!estimatingMeal && mealDescription.trim() ? 'animate-pulse' : ''}`} />
                                                                    {estimatingMeal ? 'Analysing...' : 'AI Estimate'}
                                                                </button>
                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setMealEstimate({ carbs: 0, confidence: 'high', breakdown: [{ item: 'No meal logged', carbs: 0 }], questions: [] });
                                                                    setAdjustedBreakdown([{ item: 'No meal logged', carbs: 0 }]);
                                                                    setQuickLogData(prev => ({ ...prev, meal: { ...(prev.meal || { carbsEstimate: 0, mealType: 'snack' }), carbsEstimate: 0, mealType: 'snack' } }));
                                                                }}
                                                                className="w-full mt-1 py-2 px-3 text-xs text-gray-500 border border-dashed border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 hover:text-gray-700 transition-all"
                                                            >
                                                                I haven&apos;t eaten — log 0 carbs
                                                            </button>

                                                            {/* DiaBuddy Thinking Animation */}
                                                            {estimatingMeal && (
                                                                <div className="mt-3 p-4 bg-linear-to-br from-[#1F2F98]/5 via-indigo-50/60 to-purple-50/40 rounded-xl border border-indigo-100">
                                                                    <div className="flex items-center gap-3 mb-3">
                                                                        <div className="relative w-9 h-9 shrink-0">
                                                                            <div className="absolute inset-0 rounded-full bg-linear-to-br from-[#1F2F98] via-indigo-500 to-purple-500 animate-pulse opacity-80" />
                                                                            <div className="absolute inset-0.5 rounded-full bg-white flex items-center justify-center">
                                                                                <Image src="/diabuddy.png" alt="" width={24} height={24} className="rounded-full" />
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-xs font-semibold text-[#1F2F98]">Estimating carbohydrate content</p>
                                                                            <p className="text-[10px] text-indigo-400 mt-0.5">Identifying foods and portions...</p>
                                                                        </div>
                                                                        <span className="flex items-center gap-0.5">
                                                                            <span className="w-1.5 h-1.5 bg-[#1F2F98] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '120ms' }} />
                                                                            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '240ms' }} />
                                                                        </span>
                                                                    </div>
                                                                    <div className="h-1 bg-indigo-100 rounded-full overflow-hidden">
                                                                        <div className="h-full w-2/3 bg-linear-to-r from-[#1F2F98] via-indigo-400 to-purple-400 rounded-full animate-pulse" />
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Meal Estimate with Breakdown */}
                                                            {mealEstimate && !estimatingMeal && (() => {
                                                                const adjustedTotal = adjustedBreakdown.reduce((s, i) => s + i.carbs, 0);
                                                                return (
                                                                    <div className="space-y-3">
                                                                        {/* Breakdown with live-editable rows */}
                                                                        <div className="p-3 bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                                                                            <div className="flex items-center gap-2 mb-2">
                                                                                <Image src="/diabuddy.png" alt="" width={18} height={18} className="rounded-full shrink-0" />
                                                                                <p className="text-xs font-semibold text-gray-800">Carb Breakdown</p>
                                                                            </div>
                                                                            <div className="space-y-1.5">
                                                                                {adjustedBreakdown.map((item, idx) => (
                                                                                    <div key={idx} className="flex items-center justify-between text-sm text-gray-700">
                                                                                        <span className="capitalize">{item.item}</span>
                                                                                        <div className="flex items-center gap-1.5">
                                                                                            <button type="button" onClick={() => handleAdjustCarb(idx, item.carbs - 5)}
                                                                                                className="w-5 h-5 rounded flex items-center justify-center bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs leading-none">−</button>
                                                                                            <span className="font-semibold text-[#1F2F98] min-w-10 text-center">{item.carbs}g</span>
                                                                                            <button type="button" onClick={() => handleAdjustCarb(idx, item.carbs + 5)}
                                                                                                className="w-5 h-5 rounded flex items-center justify-center bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs leading-none">+</button>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                            <div className="border-t border-blue-200 pt-2 mt-2 flex items-center justify-between">
                                                                                <span className="text-xs font-semibold text-gray-700">Total</span>
                                                                                <span className={`text-base font-bold transition-colors ${adjustedTotal !== mealEstimate.carbs ? 'text-indigo-600' : 'text-[#1F2F98]'}`}>{adjustedTotal}g</span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Portion clarifications — live-update the breakdown */}
                                                                        {mealEstimate.questions.length > 0 && (
                                                                            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-3">
                                                                                <p className="text-[11px] font-semibold text-[#1F2F98] uppercase tracking-wide">Refine portions — updates total instantly</p>
                                                                                {mealEstimate.questions.map((q, idx) => {
                                                                                    const currentServings = Math.round((adjustedBreakdown[q.itemIdx]?.carbs ?? q.basePerServing) / q.basePerServing * 10) / 10;
                                                                                    const currentCarbs = adjustedBreakdown[q.itemIdx]?.carbs ?? q.basePerServing;
                                                                                    return (
                                                                                        <div key={idx} className="space-y-1.5">
                                                                                            <p className="text-xs text-gray-700">{q.text} <span className="text-gray-400">({q.basePerServing}g per {q.unitHint})</span></p>
                                                                                            <div className="flex items-center gap-3">
                                                                                                <div className="flex items-center rounded-xl border border-indigo-200 overflow-hidden bg-white shadow-sm">
                                                                                                    <button type="button"
                                                                                                        onClick={() => handleAdjustCarb(q.itemIdx, Math.max(0, (adjustedBreakdown[q.itemIdx]?.carbs ?? q.basePerServing) - q.basePerServing))}
                                                                                                        className="w-8 h-8 flex items-center justify-center text-[#1F2F98] hover:bg-indigo-50 text-base font-bold transition-colors">−</button>
                                                                                                    <span className="px-3 text-sm font-bold text-[#1F2F98] min-w-10 text-center">{currentServings}</span>
                                                                                                    <button type="button"
                                                                                                        onClick={() => handleAdjustCarb(q.itemIdx, (adjustedBreakdown[q.itemIdx]?.carbs ?? q.basePerServing) + q.basePerServing)}
                                                                                                        className="w-8 h-8 flex items-center justify-center text-[#1F2F98] hover:bg-indigo-50 text-base font-bold transition-colors">+</button>
                                                                                                </div>
                                                                                                <span className="text-xs text-gray-500">{q.unitHint} = <span className="font-semibold text-gray-700">{currentCarbs}g carbs</span></span>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                                <div className="flex items-center justify-between pt-2 border-t border-indigo-200">
                                                                                    <span className="text-xs text-gray-600 font-medium">Refined total</span>
                                                                                    <span className="text-sm font-bold text-[#1F2F98]">{adjustedTotal}g carbs</span>
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* 0-carbs advisory */}
                                                                        {adjustedTotal === 0 && (
                                                                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                                                                <p className="text-xs font-semibold text-amber-700">Heads-up</p>
                                                                                <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">
                                                                                    Skipping meals can lead to low blood glucose. If your recent readings trend low, consider a small carb snack such as fruit or crackers.
                                                                                </p>
                                                                            </div>
                                                                        )}

                                                                        {/* Accept */}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                handleQuickInputChange('mealCarbs', adjustedTotal);
                                                                                setMealDescription('');
                                                                                setMealEstimate(null);
                                                                                setAdjustedBreakdown([]);
                                                                            }}
                                                                            className="w-full px-3 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-semibold hover:bg-emerald-600 transition-colors"
                                                                        >
                                                                            Accept {adjustedTotal}g carbs
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>

                                                        {/* Or manual entry */}
                                                        {!mealEstimate && (
                                                            <div className="border-t border-gray-200 pt-2 space-y-2">
                                                                {quickLogData.meal?.carbsEstimate !== undefined && (
                                                                    <div className="flex items-center gap-1.5">
                                                                        <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                                                                            <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                                        </div>
                                                                        <span className="text-xs text-emerald-700 font-medium">{quickLogData.meal.carbsEstimate}g carbs accepted</span>
                                                                    </div>
                                                                )}
                                                                <label className="text-xs font-medium text-gray-700">Or enter carbs manually:</label>
                                                                <div className="flex gap-2">
                                                                    <Input
                                                                        type="number"
                                                                        placeholder="Carbs (grams)"
                                                                        min={0}
                                                                        max={500}
                                                                        value={quickLogData.meal?.carbsEstimate ?? ''}
                                                                        onChange={e => handleQuickInputChange('mealCarbs', e.target.value)}
                                                                        className="text-sm flex-1"
                                                                    />
                                                                    <select
                                                                        value={quickLogData.meal?.mealType || 'snack'}
                                                                        onChange={e => handleQuickInputChange('mealType', e.target.value)}
                                                                        className="text-sm px-2 py-1 border border-gray-300 rounded"
                                                                    >
                                                                        <option value="breakfast">Breakfast</option>
                                                                        <option value="lunch">Lunch</option>
                                                                        <option value="dinner">Dinner</option>
                                                                        <option value="snack">Snack</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {input.field === 'mealCarbs' && (
                                                    <div className="flex gap-2">
                                                        <Input
                                                            type="number"
                                                            placeholder="Carbs (grams)"
                                                            min={0}
                                                            max={500}
                                                            value={quickLogData.meal?.carbsEstimate ?? ''}
                                                            onChange={e => handleQuickInputChange('mealCarbs', e.target.value)}
                                                            className="text-sm"
                                                        />
                                                        <span className="text-sm text-gray-500 flex items-center">g</span>
                                                    </div>
                                                )}

                                                {input.field === 'medication' && (
                                                    <div className="space-y-3">
                                                        {/* Dose + type */}
                                                        <div className="bg-white p-3 rounded-xl border border-blue-100 space-y-3">
                                                            {existingMedications.length > 0 ? (
                                                                <div>
                                                                    <label className="text-xs font-medium text-gray-700 block mb-1.5">Your Medications</label>
                                                                    <div className="flex flex-col gap-1.5">
                                                                        {existingMedications.map(med => (
                                                                            <button
                                                                                key={med._id}
                                                                                type="button"
                                                                                onClick={() => setQuickLogData(prev => ({
                                                                                    ...prev,
                                                                                    medication: {
                                                                                        dose: med.dosage || 0,
                                                                                        medicationType: med.medicationType || 'insulin_rapid',
                                                                                        takenAt: prev.medication?.takenAt,
                                                                                    },
                                                                                }))}
                                                                                className={`flex items-center justify-between px-3 py-2 rounded-xl border text-sm transition-all ${quickLogData.medication?.dose === (med.dosage || 0) && quickLogData.medication?.medicationType === (med.medicationType || 'insulin_rapid')
                                                                                    ? 'bg-[#1F2F98]/5 border-[#1F2F98]/40 text-[#1F2F98]'
                                                                                    : 'bg-white border-gray-200 text-gray-700 hover:border-[#1F2F98]/30 hover:bg-[#1F2F98]/2'
                                                                                    }`}
                                                                            >
                                                                                <span className="font-medium">{med.medicationName}</span>
                                                                                <span className="text-xs text-gray-400">{med.dosage} {med.doseUnit || 'units'}</span>
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                    <p className="text-[10px] text-gray-400 mt-2">Or manually enter:</p>
                                                                </div>
                                                            ) : fetchingMeds ? (
                                                                <div className="text-sm text-gray-500 flex items-center gap-2">
                                                                    <div className="w-4 h-4 border-2 border-[#1F2F98]/30 border-t-[#1F2F98] rounded-full animate-spin" />
                                                                    Loading medications...
                                                                </div>
                                                            ) : (
                                                                <p className="text-xs text-gray-500">No saved medications. Enter manually:</p>
                                                            )}
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="number"
                                                                    placeholder="Dose"
                                                                    min={0}
                                                                    value={quickLogData.medication?.dose || ''}
                                                                    onChange={e => handleQuickInputChange('medicationDose', e.target.value)}
                                                                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1F2F98]/20 focus:border-[#1F2F98] bg-white"
                                                                />
                                                                <select
                                                                    value={quickLogData.medication?.medicationType || 'insulin_rapid'}
                                                                    onChange={e => handleQuickInputChange('medicationType', e.target.value)}
                                                                    className="text-sm px-2 py-1.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1F2F98]/20"
                                                                >
                                                                    <option value="insulin_rapid">Rapid Insulin</option>
                                                                    <option value="insulin_long">Long-acting</option>
                                                                    <option value="insulin_mixed">Mixed Insulin</option>
                                                                    <option value="metformin">Metformin</option>
                                                                </select>
                                                            </div>
                                                        </div>

                                                        {/* When was it taken? */}
                                                        {(quickLogData.medication?.dose ?? 0) > 0 && (
                                                            <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 space-y-2">
                                                                <p className="text-[11px] font-semibold text-[#1F2F98] uppercase tracking-wide">When was it taken?</p>
                                                                <div className="grid grid-cols-2 gap-1.5">
                                                                    {[
                                                                        { value: '0', label: 'Just now' },
                                                                        { value: '30', label: '30 min ago' },
                                                                        { value: '60', label: '1 hr ago' },
                                                                        { value: '120', label: '2 hrs ago' },
                                                                    ].map(opt => (
                                                                        <button
                                                                            key={opt.value}
                                                                            type="button"
                                                                            onClick={() => handleQuickInputChange('medicationTakenAt', opt.value)}
                                                                            className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${quickLogData.medication?.takenAt === opt.value
                                                                                ? 'bg-[#1F2F98] text-white border-[#1F2F98] shadow-sm'
                                                                                : 'bg-white text-gray-600 border-indigo-200 hover:border-[#1F2F98]/40 hover:bg-indigo-50'
                                                                                }`}
                                                                        >
                                                                            {opt.label}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                                {quickLogData.medication?.takenAt && (
                                                                    <p className="text-[10px] text-indigo-400">
                                                                        {quickLogData.medication.takenAt === '0'
                                                                            ? 'Logged as taken right now'
                                                                            : `Logged as taken ${quickLogData.medication.takenAt} minutes ago`}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Optional: mood + sleep */}
                                                        {(quickLogData.medication?.dose ?? 0) > 0 && (
                                                            <div className="rounded-xl border border-dashed border-gray-200 overflow-hidden">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowWellnessLog(v => !v)}
                                                                    className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
                                                                >
                                                                    <span className="text-[11px] text-gray-500 font-medium">Also log mood &amp; sleep <span className="text-gray-400">(optional)</span></span>
                                                                    <span className="text-gray-400 text-[10px]">{showWellnessLog ? '▲' : '▼'}</span>
                                                                </button>
                                                                {showWellnessLog && (
                                                                    <div className="p-3 space-y-3 bg-white">
                                                                        <div className="space-y-1.5">
                                                                            <p className="text-xs text-gray-600 font-medium">How are you feeling?</p>
                                                                            <div className="flex gap-1.5 flex-wrap">
                                                                                {[
                                                                                    { value: 'great', label: '😊 Good' },
                                                                                    { value: 'neutral', label: '😐 Okay' },
                                                                                    { value: 'low', label: '😔 Low' },
                                                                                    { value: 'anxious', label: '😰 Anxious' },
                                                                                ].map(mood => (
                                                                                    <button key={mood.value} type="button"
                                                                                        onClick={() => handleQuickInputChange('mood', mood.value)}
                                                                                        className={`py-1.5 px-3 rounded-full border text-xs font-medium transition-all ${quickLogData.wellness?.mood === mood.value
                                                                                            ? 'bg-purple-100 border-purple-300 text-purple-700'
                                                                                            : 'bg-white border-gray-200 text-gray-500 hover:border-purple-200 hover:bg-purple-50'
                                                                                            }`}
                                                                                    >
                                                                                        {mood.label}
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-3">
                                                                            <p className="text-xs text-gray-600 font-medium shrink-0">Sleep last night</p>
                                                                            <div className="flex items-center gap-2">
                                                                                <input
                                                                                    type="number"
                                                                                    min={0}
                                                                                    max={14}
                                                                                    step={0.5}
                                                                                    value={quickLogData.wellness?.sleepHours || ''}
                                                                                    onChange={e => handleQuickInputChange('sleepHours', e.target.value)}
                                                                                    placeholder="hrs"
                                                                                    className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#1F2F98]/20"
                                                                                />
                                                                                <span className="text-xs text-gray-400">hours</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {input.field === 'activity' && (
                                                    <select
                                                        value={quickLogData.activity?.activityLevel || 'low'}
                                                        onChange={e => handleQuickInputChange('activityLevel', e.target.value)}
                                                        className="text-sm w-full px-2 py-1 border border-gray-300 rounded"
                                                    >
                                                        <option value="low">Low Intensity</option>
                                                        <option value="medium">Medium Intensity</option>
                                                        <option value="high">High Intensity</option>
                                                    </select>
                                                )}
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex gap-2 mt-3">
                                            {!fieldsToLog.has(input.field) ? (
                                                <>
                                                    <button
                                                        onClick={() => toggleFieldLogging(input.field)}
                                                        className="text-xs px-3 py-1.5 rounded font-medium transition-colors bg-[#1F2F98] text-white hover:bg-[#1F2F98]/90"
                                                    >
                                                        Quick Log
                                                    </button>
                                                    <Link href={input.href}>
                                                        <button className="text-xs px-3 py-1.5 rounded border border-[#1F2F98]/30 text-[#1F2F98] font-medium hover:bg-[#1F2F98]/5 transition-colors flex items-center gap-1">
                                                            Full Log
                                                            <FiArrowRight className="w-3 h-3" />
                                                        </button>
                                                    </Link>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => toggleFieldLogging(input.field)}
                                                    className="text-xs px-3 py-1.5 rounded bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition-colors flex items-center gap-1"
                                                >
                                                    Cancel
                                                    <FiX className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* High Priority Inputs */}
                {highInputs.length > 0 && (
                    <div className="mb-6 space-y-3">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 rounded-full bg-[#1F2F98]/70" />
                            <p className="text-xs font-semibold text-[#1F2F98] uppercase tracking-wider">High Priority</p>
                        </div>
                        {highInputs.map(input => (
                            <div
                                key={input.field}
                                className={`p-4 border rounded-2xl transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.05)] ${importanceColors[input.importance]}`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="text-[#1F2F98] shrink-0 mt-1">
                                        {iconMap[input.icon] || <FiDroplet className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <label className="font-medium text-gray-900">{input.label}</label>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">{input.reason}</p>

                                        {/* Quick Input */}
                                        {fieldsToLog.has(input.field) && (
                                            <div className="mt-3 pt-3 border-t border-[#1F2F98]/20 space-y-2">
                                                {input.field === 'glucose' && (
                                                    <div className="space-y-3">
                                                        <div>
                                                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Reading Type</p>
                                                            <div className="grid grid-cols-3 gap-1.5">
                                                                {[
                                                                    { value: 'fasting', label: 'Fasting' },
                                                                    { value: 'before_meal', label: 'Pre-meal' },
                                                                    { value: 'after_meal', label: 'Post-meal' },
                                                                    { value: 'random', label: 'Random' },
                                                                    { value: 'bedtime', label: 'Bedtime' },
                                                                    { value: 'wakeup', label: 'Wake-up' },
                                                                ].map(type => (
                                                                    <button
                                                                        key={type.value}
                                                                        type="button"
                                                                        onClick={() => handleQuickInputChange('glucoseType', type.value)}
                                                                        className={`py-1.5 px-1 rounded-lg border text-[11px] font-medium transition-all ${quickLogData.glucose?.readingType === type.value
                                                                            ? 'bg-[#1F2F98] text-white border-[#1F2F98] shadow-sm'
                                                                            : 'bg-white text-gray-600 border-gray-200 hover:border-[#1F2F98]/40 hover:bg-[#1F2F98]/5'
                                                                            }`}
                                                                    >
                                                                        {type.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="number"
                                                                placeholder="Enter value"
                                                                min={20}
                                                                max={600}
                                                                value={quickLogData.glucose?.value || ''}
                                                                onChange={e => handleQuickInputChange('glucoseValue', e.target.value)}
                                                                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1F2F98]/20 focus:border-[#1F2F98] bg-white"
                                                            />
                                                            <span className="text-sm font-medium text-gray-500 shrink-0">mg/dL</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {input.field === 'glucoseHistory' && (
                                                    <p className="text-sm text-[#1F2F98] italic">
                                                        Please visit the full glucose log to add previous readings for trend analysis.
                                                    </p>
                                                )}

                                                {input.field === 'activity' && (
                                                    <select
                                                        value={quickLogData.activity?.activityLevel || 'low'}
                                                        onChange={e => handleQuickInputChange('activityLevel', e.target.value)}
                                                        className="text-sm w-full px-2 py-1 border border-gray-300 rounded"
                                                    >
                                                        <option value="low">Low Intensity</option>
                                                        <option value="medium">Medium Exercise</option>
                                                        <option value="high">High Intensity</option>
                                                    </select>
                                                )}

                                                {input.field === 'meal' && (
                                                    <div className="space-y-2">
                                                        <div className="flex gap-2">
                                                            <Input
                                                                type="number"
                                                                placeholder="Carbs (grams)"
                                                                min={0}
                                                                max={500}
                                                                value={quickLogData.meal?.carbsEstimate ?? ''}
                                                                onChange={e => handleQuickInputChange('mealCarbs', e.target.value)}
                                                                className="text-sm flex-1"
                                                            />
                                                            <select
                                                                value={quickLogData.meal?.mealType || 'snack'}
                                                                onChange={e => handleQuickInputChange('mealType', e.target.value)}
                                                                className="text-sm px-2 py-1 border border-gray-300 rounded"
                                                            >
                                                                <option value="breakfast">Breakfast</option>
                                                                <option value="lunch">Lunch</option>
                                                                <option value="dinner">Dinner</option>
                                                                <option value="snack">Snack</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                )}

                                                {input.field === 'medication' && (
                                                    <div className="space-y-3">
                                                        {/* Dose + type */}
                                                        <div className="bg-white p-3 rounded-xl border border-blue-100 space-y-3">
                                                            {existingMedications.length > 0 ? (
                                                                <div>
                                                                    <label className="text-xs font-medium text-gray-700 block mb-1.5">Your Medications</label>
                                                                    <div className="flex flex-col gap-1.5">
                                                                        {existingMedications.map(med => (
                                                                            <button
                                                                                key={med._id}
                                                                                type="button"
                                                                                onClick={() => setQuickLogData(prev => ({
                                                                                    ...prev,
                                                                                    medication: {
                                                                                        dose: med.dosage || 0,
                                                                                        medicationType: med.medicationType || 'insulin_rapid',
                                                                                        takenAt: prev.medication?.takenAt,
                                                                                    },
                                                                                }))}
                                                                                className={`flex items-center justify-between px-3 py-2 rounded-xl border text-sm transition-all ${quickLogData.medication?.dose === (med.dosage || 0) && quickLogData.medication?.medicationType === (med.medicationType || 'insulin_rapid')
                                                                                    ? 'bg-[#1F2F98]/5 border-[#1F2F98]/40 text-[#1F2F98]'
                                                                                    : 'bg-white border-gray-200 text-gray-700 hover:border-[#1F2F98]/30 hover:bg-[#1F2F98]/2'
                                                                                    }`}
                                                                            >
                                                                                <span className="font-medium">{med.medicationName}</span>
                                                                                <span className="text-xs text-gray-400">{med.dosage} {med.doseUnit || 'units'}</span>
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                    <p className="text-[10px] text-gray-400 mt-2">Or manually enter:</p>
                                                                </div>
                                                            ) : fetchingMeds ? (
                                                                <div className="text-sm text-gray-500 flex items-center gap-2">
                                                                    <div className="w-4 h-4 border-2 border-[#1F2F98]/30 border-t-[#1F2F98] rounded-full animate-spin" />
                                                                    Loading medications...
                                                                </div>
                                                            ) : (
                                                                <p className="text-xs text-gray-500">No saved medications. Enter manually:</p>
                                                            )}
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="number"
                                                                    placeholder="Dose"
                                                                    min={0}
                                                                    value={quickLogData.medication?.dose || ''}
                                                                    onChange={e => handleQuickInputChange('medicationDose', e.target.value)}
                                                                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1F2F98]/20 focus:border-[#1F2F98] bg-white"
                                                                />
                                                                <select
                                                                    value={quickLogData.medication?.medicationType || 'insulin_rapid'}
                                                                    onChange={e => handleQuickInputChange('medicationType', e.target.value)}
                                                                    className="text-sm px-2 py-1.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1F2F98]/20"
                                                                >
                                                                    <option value="insulin_rapid">Rapid Insulin</option>
                                                                    <option value="insulin_long">Long-acting</option>
                                                                    <option value="insulin_mixed">Mixed Insulin</option>
                                                                    <option value="metformin">Metformin</option>
                                                                </select>
                                                            </div>
                                                        </div>

                                                        {/* When was it taken? */}
                                                        {(quickLogData.medication?.dose ?? 0) > 0 && (
                                                            <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 space-y-2">
                                                                <p className="text-[11px] font-semibold text-[#1F2F98] uppercase tracking-wide">When was it taken?</p>
                                                                <div className="grid grid-cols-2 gap-1.5">
                                                                    {[
                                                                        { value: '0', label: 'Just now' },
                                                                        { value: '30', label: '30 min ago' },
                                                                        { value: '60', label: '1 hr ago' },
                                                                        { value: '120', label: '2 hrs ago' },
                                                                    ].map(opt => (
                                                                        <button
                                                                            key={opt.value}
                                                                            type="button"
                                                                            onClick={() => handleQuickInputChange('medicationTakenAt', opt.value)}
                                                                            className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${quickLogData.medication?.takenAt === opt.value
                                                                                ? 'bg-[#1F2F98] text-white border-[#1F2F98] shadow-sm'
                                                                                : 'bg-white text-gray-600 border-indigo-200 hover:border-[#1F2F98]/40 hover:bg-indigo-50'
                                                                                }`}
                                                                        >
                                                                            {opt.label}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                                {quickLogData.medication?.takenAt && (
                                                                    <p className="text-[10px] text-indigo-400">
                                                                        {quickLogData.medication.takenAt === '0'
                                                                            ? 'Logged as taken right now'
                                                                            : `Logged as taken ${quickLogData.medication.takenAt} minutes ago`}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Optional: mood + sleep */}
                                                        {(quickLogData.medication?.dose ?? 0) > 0 && (
                                                            <div className="rounded-xl border border-dashed border-gray-200 overflow-hidden">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowWellnessLog(v => !v)}
                                                                    className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
                                                                >
                                                                    <span className="text-[11px] text-gray-500 font-medium">Also log mood &amp; sleep <span className="text-gray-400">(optional)</span></span>
                                                                    <span className="text-gray-400 text-[10px]">{showWellnessLog ? '▲' : '▼'}</span>
                                                                </button>
                                                                {showWellnessLog && (
                                                                    <div className="p-3 space-y-3 bg-white">
                                                                        <div className="space-y-1.5">
                                                                            <p className="text-xs text-gray-600 font-medium">How are you feeling?</p>
                                                                            <div className="flex gap-1.5 flex-wrap">
                                                                                {[
                                                                                    { value: 'great', label: '😊 Good' },
                                                                                    { value: 'neutral', label: '😐 Okay' },
                                                                                    { value: 'low', label: '😔 Low' },
                                                                                    { value: 'anxious', label: '😰 Anxious' },
                                                                                ].map(mood => (
                                                                                    <button key={mood.value} type="button"
                                                                                        onClick={() => handleQuickInputChange('mood', mood.value)}
                                                                                        className={`py-1.5 px-3 rounded-full border text-xs font-medium transition-all ${quickLogData.wellness?.mood === mood.value
                                                                                            ? 'bg-purple-100 border-purple-300 text-purple-700'
                                                                                            : 'bg-white border-gray-200 text-gray-500 hover:border-purple-200 hover:bg-purple-50'
                                                                                            }`}
                                                                                    >
                                                                                        {mood.label}
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-3">
                                                                            <p className="text-xs text-gray-600 font-medium shrink-0">Sleep last night</p>
                                                                            <div className="flex items-center gap-2">
                                                                                <input
                                                                                    type="number"
                                                                                    min={0}
                                                                                    max={14}
                                                                                    step={0.5}
                                                                                    value={quickLogData.wellness?.sleepHours || ''}
                                                                                    onChange={e => handleQuickInputChange('sleepHours', e.target.value)}
                                                                                    placeholder="hrs"
                                                                                    className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#1F2F98]/20"
                                                                                />
                                                                                <span className="text-xs text-gray-400">hours</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex gap-2 mt-3">
                                            {!fieldsToLog.has(input.field) ? (
                                                <>
                                                    <button
                                                        onClick={() => toggleFieldLogging(input.field)}
                                                        className="text-xs px-3 py-1.5 rounded bg-[#1F2F98] text-white font-medium hover:bg-[#181580] transition-colors"
                                                    >
                                                        Quick Log
                                                    </button>
                                                    <Link href={input.href}>
                                                        <button className="text-xs px-3 py-1.5 rounded border border-[#1F2F98] text-[#1F2F98] font-medium hover:bg-[#1F2F98]/5 transition-colors flex items-center gap-1">
                                                            Full Log
                                                            <FiArrowRight className="w-3 h-3" />
                                                        </button>
                                                    </Link>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => toggleFieldLogging(input.field)}
                                                    className="text-xs px-3 py-1.5 rounded bg-[#1F2F98]/20 text-[#1F2F98] font-medium hover:bg-[#1F2F98]/30 transition-colors flex items-center gap-1"
                                                >
                                                    Cancel
                                                    <FiX className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Action Bar */}
                <div className="flex gap-2 pt-4 border-t border-gray-100 mt-6">
                    <Button
                        onClick={handleQuickLogSubmit}
                        disabled={fieldsToLog.size === 0 || submitting || isLoading}
                        className="flex-1 bg-[#1F2F98] text-white hover:bg-[#181580] disabled:opacity-50"
                    >
                        {submitting ? 'Logging...' : fieldsToLog.size > 0 ? `Save Data & Re-check` : 'Select Data to Log'}
                    </Button>
                </div>

                <p className="text-xs text-gray-400 text-center mt-3">
                    Or visit the full pages in the menu for complete logging
                </p>
            </CardContent>
        </Card>
    );
}
