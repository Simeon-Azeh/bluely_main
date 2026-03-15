'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui';
import {
    FiTrendingUp, FiSun, FiMoon, FiActivity, FiTarget, FiDroplet,
    FiArrowRight, FiHeart, FiBarChart2, FiCalendar, FiInfo, FiClock,
    FiAward, FiZap
} from 'react-icons/fi';
import api from '@/lib/api';
import { DiaBuddyCard } from '@/components/dashboard';

interface Reading {
    _id: string;
    value: number;
    unit: string;
    readingType: string;
    recordedAt: string;
    mealContext?: string;
    activityContext?: string;
    notes?: string;
}

interface ReadingsResponse {
    readings: Reading[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

interface Insight {
    id: string;
    title: string;
    description: string;
    detail?: string;
    icon: React.ComponentType<{ className?: string }>;
    borderColor: string;
    tagColor: string;
    tag: string;
}

const TARGET_MIN = 70;
const TARGET_MAX = 180;
const MINIMUM_READINGS = 7;
const HBA1C_MIN_READINGS = 14;

function computeStats(readings: Reading[]) {
    if (readings.length === 0) return null;
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const recentReadings = readings.filter(r => new Date(r.recordedAt).getTime() > sevenDaysAgo);
    const avg = Math.round(readings.reduce((s, r) => s + r.value, 0) / readings.length);
    const inRange = readings.filter(r => r.value >= TARGET_MIN && r.value <= TARGET_MAX).length;
    const inRangePercent = Math.round((inRange / readings.length) * 100);
    const weekAvg = recentReadings.length > 0 ? Math.round(recentReadings.reduce((s, r) => s + r.value, 0) / recentReadings.length) : null;
    const uniqueDays = new Set(readings.map(r => new Date(r.recordedAt).toDateString())).size;
    const high = readings.filter(r => r.value > TARGET_MAX).length;
    const low = readings.filter(r => r.value < TARGET_MIN).length;
    return { avg, inRangePercent, inRange, weekAvg, uniqueDays, recentCount: recentReadings.length, high, low };
}

function estimateHbA1c(readingValues: number[]): { hba1c: number; category: string; color: string; bgColor: string; borderColor: string } | null {
    if (readingValues.length < HBA1C_MIN_READINGS) return null;
    const avgGlucose = readingValues.reduce((a, b) => a + b, 0) / readingValues.length;
    const hba1c = Math.round(((avgGlucose + 46.7) / 28.7) * 10) / 10;
    if (hba1c >= 6.5) return { hba1c, category: 'Diabetic Range', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
    if (hba1c >= 5.7) return { hba1c, category: 'Prediabetic Range', color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' };
    return { hba1c, category: 'Normal Range', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
}

function generateInsights(readings: Reading[]): Insight[] {
    const insightsList: Insight[] = [];

    const morningReadings = readings.filter(r => { const h = new Date(r.recordedAt).getHours(); return h >= 5 && h < 12; });
    const eveningReadings = readings.filter(r => { const h = new Date(r.recordedAt).getHours(); return h >= 17 && h < 22; });

    if (morningReadings.length >= 3 && eveningReadings.length >= 3) {
        const morningAvg = Math.round(morningReadings.reduce((s, r) => s + r.value, 0) / morningReadings.length);
        const eveningAvg = Math.round(eveningReadings.reduce((s, r) => s + r.value, 0) / eveningReadings.length);

        if (eveningAvg > morningAvg + 15) {
            insightsList.push({
                id: 'evening-pattern',
                title: 'Evening Glucose Tends Higher',
                description: 'Your glucose levels are noticeably higher in the evenings compared to mornings.',
                detail: `Evening average: ${eveningAvg} mg/dL vs. morning average: ${morningAvg} mg/dL. This pattern often relates to evening meal choices or reduced activity later in the day.`,
                icon: FiMoon,
                borderColor: 'border-l-blue-500',
                tagColor: 'bg-blue-100 text-blue-700',
                tag: 'Time Pattern',
            });
        } else if (morningAvg > eveningAvg + 15) {
            insightsList.push({
                id: 'morning-pattern',
                title: 'Morning Glucose Runs Higher',
                description: 'Your morning readings tend to be higher than your evening readings — this is sometimes called the dawn phenomenon.',
                detail: `Morning average: ${morningAvg} mg/dL vs. evening average: ${eveningAvg} mg/dL. Hormonal changes in the early morning can cause natural glucose rises, especially for people with diabetes.`,
                icon: FiSun,
                borderColor: 'border-l-orange-500',
                tagColor: 'bg-orange-100 text-orange-700',
                tag: 'Time Pattern',
            });
        } else {
            insightsList.push({
                id: 'stable-pattern',
                title: 'Consistent Throughout the Day',
                description: 'Your glucose levels are relatively stable between morning and evening — a good sign your routine is working.',
                detail: `Morning average: ${morningAvg} mg/dL, evening average: ${eveningAvg} mg/dL. Consistent patterns are easier to manage and understand.`,
                icon: FiTarget,
                borderColor: 'border-l-green-500',
                tagColor: 'bg-green-100 text-green-700',
                tag: 'Time Pattern',
            });
        }
    }

    const activityReadings = readings.filter(r => r.activityContext && r.activityContext.toLowerCase().includes('exercise'));
    const nonActivityReadings = readings.filter(r => !r.activityContext);

    if (activityReadings.length >= 3 && nonActivityReadings.length >= 5) {
        const activityAvg = Math.round(activityReadings.reduce((s, r) => s + r.value, 0) / activityReadings.length);
        const nonActivityAvg = Math.round(nonActivityReadings.reduce((s, r) => s + r.value, 0) / nonActivityReadings.length);

        if (activityAvg < nonActivityAvg - 10) {
            insightsList.push({
                id: 'activity-impact',
                title: 'Exercise Is Lowering Your Glucose',
                description: 'On active days, your average glucose is meaningfully lower — exercise is working in your favour.',
                detail: `With activity: ${activityAvg} mg/dL vs. without: ${nonActivityAvg} mg/dL. That is a ${nonActivityAvg - activityAvg} mg/dL difference, showing real impact from movement.`,
                icon: FiActivity,
                borderColor: 'border-l-green-500',
                tagColor: 'bg-green-100 text-green-700',
                tag: 'Activity',
            });
        }
    }

    const afterMealReadings = readings.filter(r => r.readingType === 'after_meal' || (r.mealContext && r.mealContext.toLowerCase().includes('after')));
    const beforeMealReadings = readings.filter(r => r.readingType === 'before_meal' || r.readingType === 'fasting');

    if (afterMealReadings.length >= 3 && beforeMealReadings.length >= 3) {
        const afterMealAvg = Math.round(afterMealReadings.reduce((s, r) => s + r.value, 0) / afterMealReadings.length);
        const beforeMealAvg = Math.round(beforeMealReadings.reduce((s, r) => s + r.value, 0) / beforeMealReadings.length);

        if (afterMealAvg > beforeMealAvg + 30) {
            insightsList.push({
                id: 'meal-impact',
                title: 'Noticeable Post-Meal Rise',
                description: 'Your glucose rises significantly after meals — typical, but worth understanding.',
                detail: `Pre-meal average: ${beforeMealAvg} mg/dL, post-meal average: ${afterMealAvg} mg/dL. A rise over 50–60 mg/dL may indicate high-carb meals. Smaller, balanced portions can help.`,
                icon: FiTrendingUp,
                borderColor: 'border-l-amber-500',
                tagColor: 'bg-amber-100 text-amber-700',
                tag: 'Meal Impact',
            });
        }
    }

    if (insightsList.length === 0) {
        insightsList.push({
            id: 'general-insight',
            title: 'Keep Building Your Picture',
            description: 'Specific patterns have not emerged yet — Bluely is watching for them as you log more readings.',
            detail: 'Try logging at different times: before meals, after meals, and in the morning. The more varied your data, the richer your insights.',
            icon: FiDroplet,
            borderColor: 'border-l-[#1F2F98]',
            tagColor: 'bg-blue-100 text-[#1F2F98]',
            tag: 'General',
        });
    }

    return insightsList;
}

function buildDistributionGradient(low: number, inRange: number, high: number, total: number): string {
    if (total === 0) return '#e5e7eb';
    const p1 = (low / total) * 100;
    const p2 = ((low + inRange) / total) * 100;
    const blend = Math.min(4, low > 0 ? p1 / 2 : 100, high > 0 ? (100 - p2) / 2 : 100);
    if (low === 0 && high === 0) {
        return 'linear-gradient(to right, #34d399, #10b981)';
    }
    if (low === 0) {
        return `linear-gradient(to right, #34d399 0%, #34d399 ${p2 - blend}%, #fcd34d ${p2}%, #f59e0b 100%)`;
    }
    if (high === 0) {
        return `linear-gradient(to right, #60a5fa 0%, #60a5fa ${p1}%, #34d399 ${p1 + blend}%, #10b981 100%)`;
    }
    return `linear-gradient(to right, #60a5fa 0%, #60a5fa ${Math.max(0, p1 - blend)}%, #34d399 ${p1 + blend}%, #34d399 ${p2 - blend}%, #fcd34d ${p2}%, #f59e0b 100%)`;
}

export default function InsightsPage() {
    const { user } = useAuth();
    const [readings, setReadings] = useState<Reading[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [insights, setInsights] = useState<Insight[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                const readingsData: ReadingsResponse = await api.getGlucoseReadings({ firebaseUid: user.uid, limit: 200 });
                setReadings(readingsData.readings);
                if (readingsData.readings.length >= MINIMUM_READINGS) {
                    setInsights(generateInsights(readingsData.readings));
                }
            } catch (error) {
                console.error('Error fetching readings:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [user]);

    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse">
                {/* Header skeleton */}
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="h-7 bg-gray-100 rounded-lg w-28" />
                        <div className="h-4 bg-gray-100 rounded-lg w-44" />
                    </div>
                    <div className="h-9 bg-gray-100 rounded-xl w-28" />
                </div>
                {/* Stats row skeleton */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[...Array(4)].map((_, i) => <div key={i} className="rounded-2xl bg-gray-100 h-24" />)}
                </div>
                {/* Insight cards skeleton */}
                {[...Array(3)].map((_, i) => <div key={i} className="rounded-2xl bg-gray-100 h-28 w-full" />)}
                {/* HbA1c card skeleton */}
                <div className="rounded-2xl bg-gray-100 h-36 w-full" />
            </div>
        );
    }

    const totalReadings = readings.length;
    const hasEnoughData = totalReadings >= MINIMUM_READINGS;
    const remainingReadings = Math.max(0, MINIMUM_READINGS - totalReadings);
    const progressPercentage = Math.min((totalReadings / MINIMUM_READINGS) * 100, 100);
    const readingValues = readings.map(r => r.value);
    const hba1cResult = estimateHbA1c(readingValues);
    const hba1cProgress = Math.min((totalReadings / HBA1C_MIN_READINGS) * 100, 100);
    const hba1cRemaining = Math.max(0, HBA1C_MIN_READINGS - totalReadings);
    const stats = computeStats(readings);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Insights</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {totalReadings > 0 ? `${totalReadings} readings analysed` : 'Start logging to unlock insights'}
                    </p>
                </div>
                <Link href="/glucose">
                    <Button size="sm" className="bg-[#1F2F98] hover:bg-[#1F2F98]/90 text-white">
                        <FiDroplet className="w-3.5 h-3.5 mr-1.5" />
                        Log Reading
                    </Button>
                </Link>
            </div>

            {/* Stats Row */}
            {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 bg-[#1F2F98]/10 rounded-lg flex items-center justify-center">
                                <FiDroplet className="w-3.5 h-3.5 text-[#1F2F98]" />
                            </div>
                            <span className="text-xs text-gray-500 font-medium">Avg Glucose</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{stats.avg}</p>
                        <p className="text-xs text-gray-400 mt-0.5">mg/dL overall</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${stats.inRangePercent >= 70 ? 'bg-green-100' : stats.inRangePercent >= 50 ? 'bg-amber-100' : 'bg-red-100'}`}>
                                <FiTarget className={`w-3.5 h-3.5 ${stats.inRangePercent >= 70 ? 'text-green-600' : stats.inRangePercent >= 50 ? 'text-amber-600' : 'text-red-600'}`} />
                            </div>
                            <span className="text-xs text-gray-500 font-medium">In Range</span>
                        </div>
                        <p className={`text-2xl font-bold ${stats.inRangePercent >= 70 ? 'text-green-600' : stats.inRangePercent >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{stats.inRangePercent}%</p>
                        <p className="text-xs text-gray-400 mt-0.5">70–180 mg/dL</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
                                <FiBarChart2 className="w-3.5 h-3.5 text-purple-600" />
                            </div>
                            <span className="text-xs text-gray-500 font-medium">Total Readings</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{totalReadings}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{stats.recentCount} this week</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center">
                                <FiCalendar className="w-3.5 h-3.5 text-orange-600" />
                            </div>
                            <span className="text-xs text-gray-500 font-medium">Active Days</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{stats.uniqueDays}</p>
                        <p className="text-xs text-gray-400 mt-0.5">days with readings</p>
                    </div>
                </div>
            )}

            {/* Glucose Distribution Bar */}
            {stats && totalReadings >= 5 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <FiBarChart2 className="w-4 h-4 text-gray-500" />
                        <h3 className="text-sm font-semibold text-gray-700">Glucose Distribution</h3>
                        <span className="text-xs text-gray-400 ml-auto">{totalReadings} readings</span>
                    </div>
                    <div
                        className="h-4 rounded-full mb-3 transition-all duration-700 shadow-inner"
                        style={{ background: buildDistributionGradient(stats.low, stats.inRange, stats.high, totalReadings) }}
                    />
                    <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                        {stats.low > 0 && (
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" />
                                Low (&lt;70): {stats.low}
                            </span>
                        )}
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" />
                            In range: {stats.inRange}
                        </span>
                        {stats.high > 0 && (
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                                High (&gt;180): {stats.high}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Pattern Insights or "Not Enough Data" */}
            {!hasEnoughData ? (
                <div className="bg-gradient-to-br from-[#1F2F98]/5 to-blue-50 rounded-2xl border border-[#1F2F98]/15 p-6">
                    <div className="flex items-start gap-4 mb-5">
                        <div className="w-10 h-10 bg-[#1F2F98]/10 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                            <FiZap className="w-5 h-5 text-[#1F2F98]" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">Pattern Insights Unlocking Soon</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Log {remainingReadings} more reading{remainingReadings !== 1 ? 's' : ''} to unlock your first pattern insights.
                                Bluely analyses time-of-day trends, meal impact, and activity effects.
                            </p>
                        </div>
                    </div>
                    <div className="space-y-1 mb-4">
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>Pattern insights</span>
                            <span className="font-semibold text-[#1F2F98]">{totalReadings} / {MINIMUM_READINGS}</span>
                        </div>
                        <div className="w-full bg-white/70 rounded-full h-2.5 border border-[#1F2F98]/10">
                            <div className="bg-[#1F2F98] h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
                        </div>
                    </div>
                    <Link href="/glucose">
                        <Button size="sm" className="bg-[#1F2F98] hover:bg-[#1F2F98]/90 text-white">
                            <FiDroplet className="w-3.5 h-3.5 mr-1.5" />
                            Log a Reading
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <FiTrendingUp className="w-4 h-4 text-gray-500" />
                        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Your Patterns</h2>
                    </div>
                    {insights.map((insight) => {
                        const Icon = insight.icon;
                        return (
                            <div key={insight.id} className={`bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border-l-4 ${insight.borderColor} p-5`}>
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <div className="flex items-center gap-2.5">
                                        <Icon className="w-4 h-4 text-gray-600 shrink-0" />
                                        <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                                    </div>
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${insight.tagColor}`}>
                                        {insight.tag}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed">{insight.description}</p>
                                {insight.detail && (
                                    <div className="mt-3 pt-3 border-t border-gray-50">
                                        <div className="flex items-start gap-1.5">
                                            <FiInfo className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                                            <p className="text-xs text-gray-500 leading-relaxed">{insight.detail}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* DiaBuddy AI Summary */}
            {hasEnoughData && <DiaBuddyCard />}

            {/* Estimated HbA1c */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <FiHeart className="w-4 h-4 text-gray-500" />
                    <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Estimated HbA1c</h2>
                </div>

                {hba1cResult ? (
                    <div className={`bg-white rounded-2xl border shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden ${hba1cResult.borderColor}`}>
                        <div className={`px-5 py-4 ${hba1cResult.bgColor} border-b ${hba1cResult.borderColor}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-500 mb-0.5">Estimated Level</p>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-4xl font-bold text-gray-900">{hba1cResult.hba1c}</span>
                                        <span className="text-lg text-gray-400">%</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2 ${hba1cResult.color === 'text-green-600' ? 'bg-green-100 text-green-700' : hba1cResult.color === 'text-amber-600' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                        {hba1cResult.category}
                                    </span>
                                    <p className="text-xs text-gray-400">Based on {totalReadings} readings</p>
                                </div>
                            </div>
                        </div>
                        <div className="px-5 py-4">
                            <div className="mb-4">
                                <div className="relative h-2.5 rounded-full overflow-hidden bg-gradient-to-r from-green-400 via-amber-400 to-red-500">
                                    <div
                                        className="absolute top-0 w-3 h-3 bg-white border-2 border-gray-700 rounded-full shadow -translate-y-[1px]"
                                        style={{ left: `${Math.min(Math.max((hba1cResult.hba1c - 4) / 6 * 100, 0), 97)}%` }}
                                    />
                                </div>
                                <div className="flex justify-between mt-1.5 text-[10px] text-gray-400">
                                    <span>Normal &lt;5.7%</span>
                                    <span>Prediabetes 5.7–6.4%</span>
                                    <span>Diabetes 6.5%+</span>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                {hba1cResult.hba1c < 5.7
                                    ? 'Your estimated HbA1c is in the normal range. Your average glucose levels are well-managed — keep it up.'
                                    : hba1cResult.hba1c < 6.5
                                        ? 'Your estimated HbA1c is in the prediabetic range. Small lifestyle adjustments — diet, exercise, and consistent monitoring — can make a meaningful difference. Speak with your doctor.'
                                        : 'Your estimated HbA1c is in the diabetic range. Consistent monitoring and working closely with your healthcare provider are important for managing your levels.'}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-3 flex items-center gap-1">
                                <FiInfo className="w-3 h-3" />
                                Estimated using the ADAG formula. This is not a lab result — always confirm with your doctor.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                                <FiBarChart2 className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">HbA1c Estimate Unlocking</h3>
                                <p className="text-xs text-gray-500">{hba1cRemaining > 0 ? `${hba1cRemaining} more readings needed` : 'Calculating now...'}</p>
                            </div>
                        </div>
                        <div className="space-y-1 mb-3">
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>Progress</span>
                                <span className="font-semibold">{totalReadings} / {HBA1C_MIN_READINGS}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                                    style={{ width: `${hba1cProgress}%` }}
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500">
                            The HbA1c estimate uses the ADAG formula. More readings improve accuracy.
                        </p>
                    </div>
                )}
            </div>

            {/* Logging Tips */}
            {hasEnoughData && (
                <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <FiAward className="w-4 h-4 text-[#1F2F98]" />
                        <h3 className="text-sm font-semibold text-gray-700">Improve Your Insights</h3>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2">
                        {[
                            { icon: FiClock, tip: 'Log at consistent times daily for stronger patterns' },
                            { icon: FiDroplet, tip: 'Record before and after meals for meal impact data' },
                            { icon: FiActivity, tip: 'Tag activity when logging to see exercise effects' },
                            { icon: FiBarChart2, tip: 'Aim for 3+ readings per day for the best estimates' },
                        ].map(({ icon: Icon, tip }, i) => (
                            <div key={i} className="flex items-start gap-2.5 bg-white rounded-xl p-3 border border-gray-100">
                                <Icon className="w-3.5 h-3.5 text-[#1F2F98] mt-0.5 shrink-0" />
                                <p className="text-xs text-gray-600 leading-relaxed">{tip}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* View History Link */}
            <Link href="/history">
                <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.08)] px-5 py-4 hover:border-[#1F2F98]/30 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#1F2F98]/10 rounded-xl flex items-center justify-center">
                            <FiBarChart2 className="w-4 h-4 text-[#1F2F98]" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 text-sm">View Full History</p>
                            <p className="text-xs text-gray-400">All {totalReadings} readings with filters and export</p>
                        </div>
                    </div>
                    <FiArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#1F2F98] transition-colors" />
                </div>
            </Link>
        </div>
    );
}
