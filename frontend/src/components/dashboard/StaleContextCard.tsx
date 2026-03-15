'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
    FiClock, FiDroplet, FiCoffee, FiActivity, FiZap,
    FiArrowRight, FiRefreshCw, FiCheck, FiChevronDown, FiChevronUp,
} from 'react-icons/fi';
import { TbPill } from 'react-icons/tb';
import { QuickLogData } from './MissingInputsCard';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// ── Types ──────────────────────────────────────────────────────────────────

export interface CachedContextEntry {
    meal: { carbsEstimate: number; mealType: string; minutesAgo: number; timestamp: string } | null;
    medication: { dose: number; medicationType: string; medicationName: string; minutesAgo: number; takenAt: string } | null;
    activity: { intensity: string; durationMinutes: number; minutesAgo: number; timestamp: string } | null;
    wellness: { sleepQuality: number; stressLevel: number; mood: string; minutesAgo: number } | null;
}

interface StaleContextCardProps {
    cachedContext: CachedContextEntry | null;
    trulyMissingInputs?: { field: string }[];
    onSubmit: (data: QuickLogData) => Promise<void>;
    onLogEverythingFresh: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatTimeAgo(minutesAgo: number): string {
    if (minutesAgo < 60) return `${minutesAgo}m ago`;
    const h = Math.floor(minutesAgo / 60);
    const m = minutesAgo % 60;
    return m === 0 ? `${h}h ago` : `${h}h ${m}m ago`;
}

const mealTypeLabels: Record<string, string> = {
    breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack',
};

const activityLabels: Record<string, string> = {
    low: 'Light activity', medium: 'Moderate activity', high: 'Intense activity',
};

const MOODS = ['Great', 'Good', 'Okay', 'Low', 'Rough'] as const;
type Mood = typeof MOODS[number];

const readingTypes = [
    { value: 'fasting', label: 'Fasting' },
    { value: 'before_meal', label: 'Pre-meal' },
    { value: 'after_meal', label: 'Post-meal' },
    { value: 'random', label: 'Random' },
    { value: 'bedtime', label: 'Bedtime' },
    { value: 'wakeup', label: 'Wake-up' },
];

// ── Row component ──────────────────────────────────────────────────────────

function ContextRow({
    icon, label, summary, children,
}: {
    icon: React.ReactNode;
    label: string;
    summary: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-xl border border-gray-100 bg-white/60 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-[#1F2F98]/10 flex items-center justify-center shrink-0 text-[#1F2F98]">
                    {icon}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
                    <div className="text-sm text-gray-800 font-medium">{summary}</div>
                </div>
            </div>
            <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/60">
                {children}
            </div>
        </div>
    );
}

// ── Radio choice helpers ───────────────────────────────────────────────────

function RadioGroup<T extends string>({
    options, value, onChange,
}: {
    options: { value: T; label: string }[];
    value: T;
    onChange: (v: T) => void;
}) {
    return (
        <div className="flex flex-wrap gap-2">
            {options.map(opt => (
                <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange(opt.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${value === opt.value
                        ? 'bg-[#1F2F98] text-white border-[#1F2F98]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#1F2F98]/40'
                        }`}
                >
                    {value === opt.value && <FiCheck className="w-3 h-3" />}
                    {opt.label}
                </button>
            ))}
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function StaleContextCard({
    cachedContext,
    trulyMissingInputs = [],
    onSubmit,
    onLogEverythingFresh,
}: StaleContextCardProps) {
    const { user } = useAuth();

    // ── Glucose (always required fresh) ───────────────────────────────────
    const [glucoseValue, setGlucoseValue] = useState('');
    const [glucoseType, setGlucoseType] = useState('random');

    // ── Meal ──────────────────────────────────────────────────────────────
    type MealChoice = 'keep' | 'update';
    const [mealChoice, setMealChoice] = useState<MealChoice>(cachedContext?.meal ? 'keep' : 'update');
    const [mealType, setMealType] = useState(cachedContext?.meal?.mealType || 'snack');
    const [acceptedCarbs, setAcceptedCarbs] = useState<number | null>(
        cachedContext?.meal ? cachedContext.meal.carbsEstimate : null
    );
    // DiaBuddy estimator
    const [mealDescription, setMealDescription] = useState('');
    const [estimatingMeal, setEstimatingMeal] = useState(false);
    type MealQuestion = { text: string; itemIdx: number; basePerServing: number; unitHint: string };
    const [mealEstimate, setMealEstimate] = useState<{
        carbs: number; confidence: string;
        breakdown: { item: string; carbs: number }[];
        questions: MealQuestion[];
    } | null>(null);
    const [adjustedBreakdown, setAdjustedBreakdown] = useState<{ item: string; carbs: number }[]>([]);

    // ── Medication ────────────────────────────────────────────────────────
    type MedChoice = 'keep' | 'update' | 'none';
    const [medChoice, setMedChoice] = useState<MedChoice>(cachedContext?.medication ? 'keep' : 'update');
    const [medDose, setMedDose] = useState(cachedContext?.medication ? String(cachedContext.medication.dose) : '');
    const [medType, setMedType] = useState(cachedContext?.medication?.medicationType || 'insulin_rapid');
    const [medTakenAt, setMedTakenAt] = useState('0');
    const [existingMedications, setExistingMedications] = useState<any[]>([]);
    const [fetchingMeds, setFetchingMeds] = useState(false);

    // ── Activity ─────────────────────────────────────────────────────────
    type ActivityChoice = 'keep' | 'update' | 'none';
    const [activityChoice, setActivityChoice] = useState<ActivityChoice>(cachedContext?.activity ? 'keep' : 'update');
    const [activityLevel, setActivityLevel] = useState<'low' | 'medium' | 'high'>('low');

    // ── Wellness ──────────────────────────────────────────────────────────
    type WellnessChoice = 'keep' | 'update';
    const [wellnessChoice, setWellnessChoice] = useState<WellnessChoice>(cachedContext?.wellness ? 'keep' : 'update');
    const [mood, setMood] = useState<Mood>((cachedContext?.wellness?.mood as Mood) || 'Okay');

    // ── Submission ────────────────────────────────────────────────────────
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Fetch saved medications when user switches to update mode
    useEffect(() => {
        if (medChoice !== 'update' || existingMedications.length > 0 || fetchingMeds || !user?.uid) return;
        setFetchingMeds(true);
        fetch(`${API_URL.replace('/api', '')}/api/medications?firebaseUid=${user.uid}`)
            .then(r => r.ok ? r.json() : null)
            .then(data => { if (data?.medications) setExistingMedications(data.medications); })
            .catch(() => { })
            .finally(() => setFetchingMeds(false));
    }, [medChoice, user?.uid]);

    // ── DiaBuddy meal estimator ───────────────────────────────────────────
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
                setAcceptedCarbs(null);
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
                soup: { carbs: 5 }, stew: { carbs: 8 }, egg: { carbs: 1 }, eggs: { carbs: 1, canonicalKey: 'egg' },
                fish: { carbs: 0 }, meat: { carbs: 0 }, vegetables: { carbs: 5 }, salad: { carbs: 5 },
            };
            const seen = new Set<string>();
            let totalCarbs = 0; let hasCarbs = false;
            for (const [food, data] of Object.entries(foodItems)) {
                if (!lower.includes(food)) continue;
                const key = data.canonicalKey || food;
                if (seen.has(key)) continue;
                seen.add(key);
                const itemIdx = breakdown.length;
                breakdown.push({ item: key.charAt(0).toUpperCase() + key.slice(1), carbs: data.carbs });
                totalCarbs += data.carbs;
                if (data.carbs > 0) hasCarbs = true;
                if (data.question) questions.push({ text: data.question.text, itemIdx, basePerServing: data.question.basePerServing, unitHint: data.question.unitHint });
            }
            if (breakdown.length === 0) {
                breakdown.push({ item: 'Mixed meal', carbs: 40 });
                questions.push({ text: 'How many servings?', itemIdx: 0, basePerServing: 40, unitHint: 'serving(s)' });
                totalCarbs = 40;
            }
            const est = { carbs: totalCarbs, confidence: hasCarbs ? 'medium' : 'high', breakdown, questions };
            setMealEstimate(est);
            setAdjustedBreakdown(breakdown.map(i => ({ ...i })));
        } catch { /* ignore */ } finally { setEstimatingMeal(false); }
    };

    const handleAdjustCarb = (itemIdx: number, newCarbs: number) => {
        setAdjustedBreakdown(prev => {
            const updated = [...prev];
            updated[itemIdx] = { ...updated[itemIdx], carbs: Math.max(0, newCarbs) };
            return updated;
        });
    };

    // ── Build & submit QuickLogData ────────────────────────────────────────
    const handleSubmit = async () => {
        setError('');
        const glc = parseFloat(glucoseValue);
        if (!glucoseValue || isNaN(glc) || glc < 20 || glc > 600) {
            setError('Please enter a valid glucose value (20–600 mg/dL).');
            return;
        }
        if (mealChoice === 'update' && acceptedCarbs === null) {
            setError('Please accept a carb estimate or enter your meal carbs before continuing.');
            return;
        }
        if (medChoice === 'update' && (medDose === '' || parseFloat(medDose) < 0)) {
            setError('Please enter your medication dose (0 if none taken).');
            return;
        }

        const data: QuickLogData = { glucose: { value: glc, readingType: glucoseType } };

        if (mealChoice === 'update' && acceptedCarbs !== null) {
            data.meal = { carbsEstimate: acceptedCarbs, mealType };
        }

        if (medChoice === 'update') {
            data.medication = { dose: parseFloat(medDose) || 0, medicationType: medType, takenAt: medTakenAt };
        } else if (medChoice === 'none') {
            data.medication = { dose: 0, medicationType: 'none' };
        }

        if (activityChoice === 'update') {
            data.activity = { activityLevel };
        } else if (activityChoice === 'none') {
            data.activity = { activityLevel: 'low' };
        }

        if (wellnessChoice === 'update') {
            data.wellness = { mood };
        }

        setSubmitting(true);
        try {
            await onSubmit(data);
        } catch {
            setError('Failed to save. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Shared input classes ───────────────────────────────────────────────
    const inputCls = 'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#1F2F98]/25 focus:border-[#1F2F98]/60 transition-all placeholder:text-gray-400';
    const selectCls = 'px-2.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#1F2F98]/25 focus:border-[#1F2F98]/60 cursor-pointer transition-all';

    return (
        <div className="rounded-2xl border border-amber-200 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.07)] overflow-hidden">

            {/* Header */}
            <div className="flex items-start gap-3 px-5 pt-5 pb-4 bg-linear-to-r from-amber-50 to-orange-50/40 border-b border-amber-100">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <FiClock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 text-base tracking-tight">Fresh Reading Required</h3>
                    <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">
                        Your glucose is outdated. Log a new reading, then confirm or update anything that&apos;s changed.
                    </p>
                </div>
            </div>

            <div className="px-5 pb-5 space-y-4 pt-4">

                {/* ── Glucose (mandatory) ─────────────────────────────── */}
                <div className="rounded-xl border-2 border-amber-300 bg-amber-50/60 p-4 shadow-[0_2px_8px_rgba(245,158,11,0.12)]">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
                            <FiDroplet className="w-3.5 h-3.5 text-amber-600" />
                        </div>
                        <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                            New Glucose Reading <span className="text-amber-500 font-semibold normal-case tracking-normal">— required to proceed</span>
                        </p>
                    </div>
                    <div className="space-y-2.5">
                        <div className="grid grid-cols-3 gap-1.5">
                            {readingTypes.map(t => (
                                <button
                                    key={t.value}
                                    type="button"
                                    onClick={() => setGlucoseType(t.value)}
                                    className={`py-2 px-1 rounded-xl border text-[11px] font-semibold transition-all ${glucoseType === t.value
                                        ? 'bg-[#1F2F98] text-white border-[#1F2F98] shadow-sm'
                                        : 'bg-white text-gray-600 border-amber-200 hover:border-[#1F2F98]/40 hover:bg-[#1F2F98]/5'
                                        }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="number"
                                    placeholder="Enter value"
                                    value={glucoseValue}
                                    onChange={e => setGlucoseValue(e.target.value)}
                                    min={20}
                                    max={600}
                                    className="w-full px-3 py-2.5 text-sm border-2 border-amber-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all placeholder:text-gray-400 pr-16"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">mg/dL</span>
                            </div>
                        </div>
                        {glucoseValue && (parseFloat(glucoseValue) < 70) && (
                            <p className="text-[11px] text-amber-700 bg-amber-100 rounded-lg px-3 py-1.5">⚠ Reading below 70 mg/dL — monitor closely.</p>
                        )}
                        {glucoseValue && (parseFloat(glucoseValue) > 250) && (
                            <p className="text-[11px] text-red-600 bg-red-50 rounded-lg px-3 py-1.5">⚠ Reading above 250 mg/dL — consider consulting your healthcare provider.</p>
                        )}
                    </div>
                </div>

                {/* ── Context Review header ────────────────────────────── */}
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-gray-100" />
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-2">Your Recent Context</p>
                    <div className="flex-1 h-px bg-gray-100" />
                </div>

                {/* ── Meal ─────────────────────────────────────────────── */}
                <ContextRow
                    icon={<FiCoffee className="w-4 h-4" />}
                    label="Meal"
                    summary={
                        cachedContext?.meal
                            ? <>{mealTypeLabels[cachedContext.meal.mealType] || cachedContext.meal.mealType} &middot; {cachedContext.meal.carbsEstimate}g carbs &middot; <span className="text-gray-400 font-normal">{formatTimeAgo(cachedContext.meal.minutesAgo)}</span></>
                            : <span className="text-amber-600 font-normal text-xs">No recent meal logged</span>
                    }
                >
                    {cachedContext?.meal && (
                        <RadioGroup
                            options={[
                                { value: 'keep' as MealChoice, label: '✓ Use this log' },
                                { value: 'update' as MealChoice, label: 'Just ate — update' },
                            ]}
                            value={mealChoice}
                            onChange={v => { setMealChoice(v); if (v === 'keep') { setAcceptedCarbs(cachedContext!.meal!.carbsEstimate); setMealEstimate(null); } else { setAcceptedCarbs(null); } }}
                        />
                    )}

                    {(mealChoice === 'update' || !cachedContext?.meal) && (
                        <div className={`space-y-3 ${cachedContext?.meal ? 'mt-3 pt-3 border-t border-gray-100' : ''}`}>
                            {/* DiaBuddy estimator */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-700">Describe your meal — Bluely will estimate carbs:</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={mealDescription}
                                        onChange={e => setMealDescription(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleMealEstimate()}
                                        placeholder="e.g. Rice, stew and fried plantain"
                                        disabled={estimatingMeal}
                                        className={`${inputCls} flex-1`}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleMealEstimate}
                                        disabled={!mealDescription.trim() || estimatingMeal}
                                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-[1.02] hover:shadow-[0_4px_16px_rgba(79,70,229,0.4)] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 shrink-0"
                                        style={{ background: 'linear-gradient(135deg, #1F2F98, #4338ca, #7c3aed)' }}
                                    >
                                        <FiZap className={`w-3.5 h-3.5 ${!estimatingMeal && mealDescription.trim() ? 'animate-pulse' : ''}`} />
                                        {estimatingMeal ? 'Analysing…' : 'AI Estimate'}
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setMealEstimate({ carbs: 0, confidence: 'high', breakdown: [{ item: "Haven't eaten", carbs: 0 }], questions: [] }); setAdjustedBreakdown([{ item: "Haven't eaten", carbs: 0 }]); setAcceptedCarbs(0); }}
                                    className="w-full py-2 px-3 text-xs text-gray-500 border border-dashed border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 hover:text-gray-700 transition-all"
                                >
                                    I haven&apos;t eaten — log 0 carbs
                                </button>
                            </div>

                            {/* DiaBuddy thinking animation */}
                            {estimatingMeal && (
                                <div className="p-4 bg-linear-to-br from-[#1F2F98]/5 via-indigo-50/60 to-purple-50/40 rounded-xl border border-indigo-100">
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

                            {/* Estimate result */}
                            {mealEstimate && !estimatingMeal && (() => {
                                const adjustedTotal = adjustedBreakdown.reduce((s, i) => s + i.carbs, 0);
                                return (
                                    <div className="space-y-3">
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
                                                            <button type="button" onClick={() => handleAdjustCarb(idx, item.carbs - 5)} className="w-6 h-6 rounded-lg flex items-center justify-center bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm font-bold">−</button>
                                                            <span className="font-bold text-[#1F2F98] min-w-10 text-center">{item.carbs}g</span>
                                                            <button type="button" onClick={() => handleAdjustCarb(idx, item.carbs + 5)} className="w-6 h-6 rounded-lg flex items-center justify-center bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm font-bold">+</button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="border-t border-blue-200 pt-2 mt-2 flex items-center justify-between">
                                                <span className="text-xs font-semibold text-gray-700">Total</span>
                                                <span className={`text-base font-bold ${adjustedTotal !== mealEstimate.carbs ? 'text-indigo-600' : 'text-[#1F2F98]'}`}>{adjustedTotal}g</span>
                                            </div>
                                        </div>

                                        {mealEstimate.questions.length > 0 && (
                                            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-3">
                                                <p className="text-[11px] font-bold text-[#1F2F98] uppercase tracking-wide">Refine portions</p>
                                                {mealEstimate.questions.map((q, idx) => {
                                                    const currentCarbs = adjustedBreakdown[q.itemIdx]?.carbs ?? q.basePerServing;
                                                    const currentServings = Math.round(currentCarbs / q.basePerServing * 10) / 10;
                                                    return (
                                                        <div key={idx} className="space-y-1.5">
                                                            <p className="text-xs text-gray-700">{q.text} <span className="text-gray-400">({q.basePerServing}g per {q.unitHint})</span></p>
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex items-center rounded-xl border border-indigo-200 overflow-hidden bg-white shadow-sm">
                                                                    <button type="button" onClick={() => handleAdjustCarb(q.itemIdx, Math.max(0, currentCarbs - q.basePerServing))} className="w-8 h-8 flex items-center justify-center text-[#1F2F98] hover:bg-indigo-50 text-base font-bold">−</button>
                                                                    <span className="px-3 text-sm font-bold text-[#1F2F98] min-w-10 text-center">{currentServings}</span>
                                                                    <button type="button" onClick={() => handleAdjustCarb(q.itemIdx, currentCarbs + q.basePerServing)} className="w-8 h-8 flex items-center justify-center text-[#1F2F98] hover:bg-indigo-50 text-base font-bold">+</button>
                                                                </div>
                                                                <span className="text-xs text-gray-500">{q.unitHint} = <span className="font-semibold text-gray-700">{currentCarbs}g</span></span>
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

                                        {adjustedTotal === 0 && (
                                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                                <p className="text-xs font-semibold text-amber-700">Heads-up</p>
                                                <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">Skipping meals can lead to low blood glucose. Consider a small snack if readings trend low.</p>
                                            </div>
                                        )}

                                        {acceptedCarbs !== null && acceptedCarbs === adjustedTotal ? (
                                            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                                                <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                                                    <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                </div>
                                                <span className="text-xs text-emerald-700 font-semibold">{acceptedCarbs}g carbs accepted</span>
                                                <button type="button" onClick={() => setAcceptedCarbs(null)} className="ml-auto text-[10px] text-emerald-500 hover:text-emerald-700 underline">change</button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => { setAcceptedCarbs(adjustedTotal); setMealType(mealType); setMealDescription(''); setMealEstimate(null); setAdjustedBreakdown([]); }}
                                                className="w-full px-3 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors shadow-sm"
                                            >
                                                Accept {adjustedTotal}g carbs
                                            </button>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Manual fallback if no estimate yet */}
                            {!mealEstimate && (
                                <div className="space-y-2">
                                    <p className="text-xs text-gray-500 font-medium">Or enter carbs manually:</p>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                type="number"
                                                placeholder="Carbs (g)"
                                                value={acceptedCarbs !== null ? acceptedCarbs : ''}
                                                onChange={e => setAcceptedCarbs(parseFloat(e.target.value) || 0)}
                                                min={0} max={500}
                                                className={inputCls}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">g</span>
                                        </div>
                                        <select value={mealType} onChange={e => setMealType(e.target.value)} className={selectCls}>
                                            {Object.entries(mealTypeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Meal type selector when estimate accepted */}
                            {mealEstimate && acceptedCarbs !== null && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500 shrink-0">Meal type:</span>
                                    <select value={mealType} onChange={e => setMealType(e.target.value)} className={`${selectCls} flex-1`}>
                                        {Object.entries(mealTypeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                    )}
                </ContextRow>

                {/* ── Medication ───────────────────────────────────────── */}
                <ContextRow
                    icon={<TbPill className="w-4 h-4" />}
                    label="Medication / Insulin"
                    summary={
                        cachedContext?.medication
                            ? <>{cachedContext.medication.medicationName} &middot; {cachedContext.medication.dose > 0 ? `${cachedContext.medication.dose} units` : 'logged'} &middot; <span className="text-gray-400 font-normal">{formatTimeAgo(cachedContext.medication.minutesAgo)}</span></>
                            : <span className="text-amber-600 font-normal text-xs">No recent medication logged</span>
                    }
                >
                    <RadioGroup
                        options={[
                            ...(cachedContext?.medication ? [{ value: 'keep' as MedChoice, label: '✓ Use this log' }] : []),
                            { value: 'update' as MedChoice, label: cachedContext?.medication ? 'Just took — update' : 'Log medication' },
                            { value: 'none' as MedChoice, label: "Didn't take any" },
                        ]}
                        value={medChoice}
                        onChange={setMedChoice}
                    />

                    {medChoice === 'update' && (
                        <div className={`space-y-3 ${cachedContext?.medication ? 'mt-3 pt-3 border-t border-gray-100' : 'mt-3'}`}>
                            {/* Saved medications */}
                            {fetchingMeds ? (
                                <div className="flex items-center gap-2 text-xs text-gray-500 py-1">
                                    <div className="w-4 h-4 border-2 border-[#1F2F98]/30 border-t-[#1F2F98] rounded-full animate-spin" />
                                    Loading your medications...
                                </div>
                            ) : existingMedications.length > 0 ? (
                                <div className="space-y-1.5">
                                    <p className="text-xs font-semibold text-gray-700">Your saved medications:</p>
                                    {existingMedications.map(med => (
                                        <button
                                            key={med._id}
                                            type="button"
                                            onClick={() => { setMedDose(String(med.dosage || 0)); setMedType(med.medicationType || 'insulin_rapid'); }}
                                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-all ${medDose === String(med.dosage || 0) && medType === (med.medicationType || 'insulin_rapid')
                                                ? 'bg-[#1F2F98]/5 border-[#1F2F98]/40 text-[#1F2F98]'
                                                : 'bg-white border-gray-200 text-gray-700 hover:border-[#1F2F98]/30 hover:bg-[#1F2F98]/2'
                                                }`}
                                        >
                                            <span className="font-semibold">{med.medicationName}</span>
                                            <span className="text-xs text-gray-400">{med.dosage} {med.doseUnit || 'units'}</span>
                                        </button>
                                    ))}
                                    <p className="text-[10px] text-gray-400 pt-1">Or enter a different dose manually:</p>
                                </div>
                            ) : (
                                <p className="text-xs text-gray-500">No saved medications found. Enter manually:</p>
                            )}

                            {/* Manual dose entry */}
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type="number"
                                        placeholder="Dose"
                                        value={medDose}
                                        onChange={e => setMedDose(e.target.value)}
                                        min={0}
                                        className={inputCls}
                                    />
                                </div>
                                <select value={medType} onChange={e => setMedType(e.target.value)} className={selectCls}>
                                    <option value="insulin_rapid">Rapid Insulin</option>
                                    <option value="insulin_long">Long-acting</option>
                                    <option value="insulin_mixed">Mixed Insulin</option>
                                    <option value="metformin">Metformin</option>
                                    <option value="glipizide">Glipizide</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            {/* When was it taken */}
                            {parseFloat(medDose) > 0 && (
                                <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 space-y-2">
                                    <p className="text-[11px] font-bold text-[#1F2F98] uppercase tracking-wide">When was it taken?</p>
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
                                                onClick={() => setMedTakenAt(opt.value)}
                                                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${medTakenAt === opt.value
                                                    ? 'bg-[#1F2F98] text-white border-[#1F2F98] shadow-sm'
                                                    : 'bg-white text-gray-600 border-indigo-200 hover:border-[#1F2F98]/40 hover:bg-indigo-50'
                                                    }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {medChoice === 'none' && (
                        <p className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                            Prediction will use no-medication context (dose = 0). Only select this if you genuinely haven&apos;t taken any medication.
                        </p>
                    )}
                </ContextRow>

                {/* ── Activity ─────────────────────────────────────────── */}
                <ContextRow
                    icon={<FiActivity className="w-4 h-4" />}
                    label="Physical Activity"
                    summary={
                        cachedContext?.activity
                            ? <>{activityLabels[cachedContext.activity.intensity] || cachedContext.activity.intensity} &middot; {cachedContext.activity.durationMinutes}min &middot; <span className="text-gray-400 font-normal">{formatTimeAgo(cachedContext.activity.minutesAgo)}</span></>
                            : <span className="text-amber-600 font-normal text-xs">No recent activity logged</span>
                    }
                >
                    <RadioGroup
                        options={[
                            ...(cachedContext?.activity ? [{ value: 'keep' as ActivityChoice, label: '✓ Use this log' }] : []),
                            { value: 'update' as ActivityChoice, label: cachedContext?.activity ? 'New activity' : 'Log activity' },
                            { value: 'none' as ActivityChoice, label: 'No exercise today' },
                        ]}
                        value={activityChoice}
                        onChange={setActivityChoice}
                    />
                    {activityChoice === 'update' && (
                        <div className={`grid grid-cols-3 gap-2 ${cachedContext?.activity ? 'mt-3 pt-3 border-t border-gray-100' : 'mt-3'}`}>
                            {(['low', 'medium', 'high'] as const).map(level => (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => setActivityLevel(level)}
                                    className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${activityLevel === level
                                        ? 'bg-[#1F2F98] text-white border-[#1F2F98] shadow-sm'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#1F2F98]/40'
                                        }`}
                                >
                                    {level.charAt(0).toUpperCase() + level.slice(1)}
                                </button>
                            ))}
                        </div>
                    )}
                    {activityChoice === 'none' && (
                        <p className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                            Sedentary context will be used (low activity, 0 min). This is accurate for resting periods.
                        </p>
                    )}
                </ContextRow>

                {/* ── Wellness ─────────────────────────────────────────── */}
                <ContextRow
                    icon={<FiZap className="w-4 h-4" />}
                    label="Mood & Wellness"
                    summary={
                        cachedContext?.wellness
                            ? <>{cachedContext.wellness.mood} &middot; Sleep {cachedContext.wellness.sleepQuality}/5 &middot; <span className="text-gray-400 font-normal">{formatTimeAgo(cachedContext.wellness.minutesAgo)}</span></>
                            : <span className="text-amber-600 font-normal text-xs">No wellness data logged</span>
                    }
                >
                    {cachedContext?.wellness && (
                        <RadioGroup
                            options={[
                                { value: 'keep' as WellnessChoice, label: '✓ Use this log' },
                                { value: 'update' as WellnessChoice, label: 'Update mood' },
                            ]}
                            value={wellnessChoice}
                            onChange={setWellnessChoice}
                        />
                    )}
                    {(wellnessChoice === 'update' || !cachedContext?.wellness) && (
                        <div className={`flex flex-wrap gap-2 ${cachedContext?.wellness ? 'mt-3 pt-3 border-t border-gray-100' : 'mt-1'}`}>
                            {MOODS.map(m => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => setMood(m)}
                                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${mood === m
                                        ? 'bg-[#1F2F98] text-white border-[#1F2F98] shadow-sm'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#1F2F98]/40'
                                        }`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    )}
                </ContextRow>

                {/* ── Error ───────────────────────────────────────────── */}
                {error && (
                    <div className="flex items-start gap-2.5 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl">
                        <div className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                            <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none"><path d="M6 4v4M6 9.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                        </div>
                        <p className="text-xs text-red-600">{error}</p>
                    </div>
                )}

                {/* ── Submit ──────────────────────────────────────────── */}
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full py-3.5 bg-[#1F2F98] text-white rounded-xl font-bold text-sm hover:bg-[#1F2F98]/90 transition-all hover:shadow-lg hover:shadow-[#1F2F98]/25 flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {submitting ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            Saving & Generating Forecast…
                        </>
                    ) : (
                        <>
                            Log Reading & Generate Forecast
                            <FiArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-150" />
                        </>
                    )}
                </button>

                <button
                    onClick={onLogEverythingFresh}
                    disabled={submitting}
                    className="w-full py-2.5 text-gray-500 rounded-xl font-medium text-sm hover:text-gray-700 hover:bg-gray-50 border border-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <FiRefreshCw className="w-3.5 h-3.5" />
                    Log Everything Fresh Instead
                </button>
            </div>
        </div>
    );
}
