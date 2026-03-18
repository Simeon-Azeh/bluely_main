'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { FiClock, FiInfo, FiZap, FiRefreshCw, FiAlertCircle, FiDroplet, FiActivity, FiCoffee, FiChevronDown, FiChevronUp, FiMessageCircle } from 'react-icons/fi';
import { TbPill } from 'react-icons/tb';
import { IoArrowUp, IoArrowDown, IoArrowForward } from 'react-icons/io5';
import { MdOutlineLocalFireDepartment } from 'react-icons/md';
import Link from 'next/link';
import { useGlucoseUnit } from '@/hooks/useGlucoseUnit';

interface MissingDataAction {
    label: string;
    href: string;
    reason: string;
    icon?: string;
}

interface GlucoseForecastCardProps {
    predictedGlucose: number;
    direction: 'rising' | 'stable' | 'dropping';
    directionArrow: string;
    directionLabel: string;
    confidence: number;
    timeframe: string;
    recommendation: string;
    riskAlert?: string | null;
    factors: string[];
    modelUsed: string;
    predictionTimestamp?: string;
    onRefresh?: () => void;
    suggestions?: string[] | null;
    missingDataActions?: MissingDataAction[] | null;
    aiInsight?: string | null;
}

const directionConfig = {
    rising: {
        Icon: IoArrowUp,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        borderColor: 'border-orange-200',
        gradient: 'from-orange-50 via-amber-50/60 to-white',
        barColor: 'bg-linear-to-r from-orange-400 to-amber-500',
        badgeText: 'Rising',
        badgeBg: 'bg-orange-100 text-orange-700 border border-orange-200',
        glowColor: 'shadow-orange-200',
        pulseColor: 'bg-orange-400',
    },
    stable: {
        Icon: IoArrowForward,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        gradient: 'from-emerald-50 via-green-50/60 to-white',
        barColor: 'bg-linear-to-r from-emerald-400 to-green-500',
        badgeText: 'Stable',
        badgeBg: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
        glowColor: 'shadow-emerald-200',
        pulseColor: 'bg-emerald-400',
    },
    dropping: {
        Icon: IoArrowDown,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        gradient: 'from-blue-50 via-cyan-50/60 to-white',
        barColor: 'bg-linear-to-r from-blue-400 to-cyan-500',
        badgeText: 'Dropping',
        badgeBg: 'bg-blue-100 text-blue-700 border border-blue-200',
        glowColor: 'shadow-blue-200',
        pulseColor: 'bg-blue-400',
    },
};

function formatTimeRemaining(ms: number): string {
    if (ms <= 0) return 'now';
    const mins = Math.ceil(ms / 60000);
    if (mins === 1) return '1 min';
    return `${mins} min`;
}

function formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function GlucoseForecastCard({
    predictedGlucose,
    direction,
    directionLabel,
    confidence,
    recommendation,
    riskAlert,
    factors,
    modelUsed,
    predictionTimestamp,
    onRefresh,
    suggestions,
    missingDataActions,
    aiInsight,
}: GlucoseForecastCardProps) {
    const { user } = useAuth();
    const { format, label, convert, isMmol } = useGlucoseUnit();
    const [showTooltip, setShowTooltip] = useState(false);
    const [showFactors, setShowFactors] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState<number>(30 * 60 * 1000);
    const [isExpired, setIsExpired] = useState(false);
    const [diabuddyReply, setDiaBuddyReply] = useState<string | null>(null);
    const [diabuddyLoading, setDiaBuddyLoading] = useState(false);
    const [diabuddyError, setDiaBuddyError] = useState(false);
    const [displayedGlucose, setDisplayedGlucose] = useState(0);
    const [confidenceAnimated, setConfidenceAnimated] = useState(0);
    const animationRef = useRef<NodeJS.Timeout | null>(null);

    const config = directionConfig[direction];
    const DirectionIcon = config.Icon;
    const confidencePercent = Math.round(confidence * 100);

    // Count-up animation for the glucose number on mount
    useEffect(() => {
        const target = isMmol
            ? parseFloat(format(predictedGlucose))
            : Math.round(predictedGlucose);
        const start = isMmol ? Math.max(0, target - 2) : Math.max(0, target - 40);
        const duration = 700;
        const steps = 28;
        const increment = (target - start) / steps;
        let current = start;
        let step = 0;
        if (animationRef.current) clearInterval(animationRef.current);
        animationRef.current = setInterval(() => {
            step++;
            current = step >= steps ? target : start + increment * step;
            setDisplayedGlucose(isMmol
                ? parseFloat(current.toFixed(1))
                : Math.round(current));
            if (step >= steps) clearInterval(animationRef.current!);
        }, duration / steps);
        return () => { if (animationRef.current) clearInterval(animationRef.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [predictedGlucose, isMmol]);

    // Confidence bar animation on mount
    useEffect(() => {
        const timeout = setTimeout(() => setConfidenceAnimated(confidencePercent), 80);
        return () => clearTimeout(timeout);
    }, [confidencePercent]);

    const handleAskDiaBuddy = useCallback(async () => {
        if (!user) return;
        setDiaBuddyLoading(true);
        setDiaBuddyError(false);
        try {
            const prompt = `My 30-minute glucose forecast shows my glucose is ${direction} and expected to be ~${format(predictedGlucose)} ${label} (${confidencePercent}% model confidence). The system note says: "${recommendation}". In 2-3 sentences, explain what this means for me right now and give 1-2 specific, practical things I can do to manage this.`;
            const result = await api.chatWithDiaBuddy(user.uid, prompt, [], user.displayName ?? undefined);
            setDiaBuddyReply(result.reply);
        } catch {
            setDiaBuddyError(true);
        } finally {
            setDiaBuddyLoading(false);
        }
    }, [user, direction, predictedGlucose, confidencePercent, recommendation]);

    const predictionMade = useMemo(
        () => (predictionTimestamp ? new Date(predictionTimestamp) : new Date()),
        [predictionTimestamp]
    );
    const targetTime = useMemo(
        () => new Date(predictionMade.getTime() + 30 * 60 * 1000),
        [predictionMade]
    );

    useEffect(() => {
        const target = targetTime.getTime();
        const updateCountdown = () => {
            const remaining = target - Date.now();
            setTimeRemaining(Math.max(0, remaining));
            if (remaining <= 0 && !isExpired) {
                setIsExpired(true);
                if ('Notification' in window && Notification.permission === 'granted') {
                    try {
                        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                            navigator.serviceWorker.ready.then((reg) => {
                                reg.showNotification('Bluely: Time to check!', {
                                    body: 'Your 30-minute forecast window has ended. Log a new reading to see how you did!',
                                    icon: '/icons/android-chrome-192x192.png',
                                    tag: 'forecast-check',
                                });
                            });
                        } else {
                            new Notification('Bluely: Time to check!', {
                                body: 'Your 30-minute forecast window has ended. Log a new reading to see how you did!',
                                icon: '/icons/android-chrome-192x192.png',
                            });
                        }
                    } catch (err) { console.warn('Notification failed:', err); }
                }
            }
        };
        updateCountdown();
        const interval = setInterval(updateCountdown, 10000);
        return () => clearInterval(interval);
    }, [targetTime, isExpired]);

    const handleRefresh = useCallback(() => {
        setIsExpired(false);
        onRefresh?.();
    }, [onRefresh]);

    // Factor icon mapping
    const getFactorIcon = (factor: string): React.ReactNode => {
        const f = factor.toLowerCase();
        if (f.includes('meal') || f.includes('carb') || f.includes('absorption')) return <FiCoffee className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />;
        if (f.includes('insulin') || f.includes('medication') || f.includes('metformin') || f.includes('pharmacokinetic')) return <TbPill className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />;
        if (f.includes('activity') || f.includes('exercise') || f.includes('hypoglycemia window')) return <FiActivity className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />;
        if (f.includes('stress') || f.includes('cortisol')) return <MdOutlineLocalFireDepartment className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />;
        if (f.includes('sleep')) return <FiClock className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />;
        if (f.includes('dawn') || f.includes('morning')) return <FiZap className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />;
        if (f.includes('glucose') || f.includes('reading') || f.includes('personalized')) return <FiDroplet className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />;
        return <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0 mt-1.5" />;
    };

    const confidenceColor =
        confidencePercent >= 70 ? config.barColor :
            confidencePercent >= 50 ? 'bg-linear-to-r from-amber-400 to-yellow-500' :
                'bg-linear-to-r from-red-400 to-rose-500';

    const confidenceLabel =
        confidencePercent >= 80 ? 'High confidence' :
            confidencePercent >= 60 ? 'Moderate confidence' :
                'Low confidence — active physiological factors';

    return (
        <Card className={`border-0 shadow-[0_4px_20px_rgba(0,0,0,0.08)] bg-linear-to-br ${config.gradient} overflow-hidden`}>
            <CardContent className="p-0">
                {/* Top accent bar */}
                <div className={`h-1 w-full ${config.barColor}`} />

                <div className="p-5">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className={`relative w-11 h-11 ${config.bgColor} rounded-2xl flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.08)]`}>
                                <FiClock className={`w-5 h-5 ${config.color}`} />
                                <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${config.pulseColor} animate-pulse`} />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-gray-900 text-base leading-tight">30-Minute Forecast</h3>
                                <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                                    {modelUsed === 'bluely_personalized' ? '✦ Personalised model' : modelUsed === 'ohiot1dm' ? 'OhioT1DM model' : 'Bluely ML model'}
                                </p>
                            </div>
                        </div>
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wide shadow-[0_4px_20px_rgba(0,0,0,0.06)] ${config.badgeBg}`}>
                            {config.badgeText}
                        </span>
                    </div>

                    {/* Expired state */}
                    {isExpired ? (
                        <div className="mb-4 p-5 bg-white/80 border border-gray-200 rounded-2xl text-center shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
                            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                <FiClock className="w-6 h-6 text-gray-400" />
                            </div>
                            <p className="text-sm font-semibold text-gray-800 mb-1">Forecast window reached</p>
                            <p className="text-xs text-gray-500 mb-4">
                                This prediction was for {formatTime(targetTime)}. Log a new reading to see how accurate it was.
                            </p>
                            <button
                                type="button"
                                onClick={handleRefresh}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1F2F98] text-white text-sm font-semibold rounded-xl hover:bg-[#1F2F98]/90 transition-all hover:shadow-lg hover:shadow-[#1F2F98]/20"
                            >
                                <FiRefreshCw className="w-3.5 h-3.5" />
                                Update Forecast
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Time row */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                                    <FiClock className="w-3 h-3" />
                                    <span>Predicted at {formatTime(predictionMade)}</span>
                                </div>
                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${timeRemaining < 5 * 60 * 1000
                                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                    : 'bg-gray-100 text-gray-500 border border-gray-200'
                                    }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${timeRemaining < 5 * 60 * 1000 ? 'bg-amber-500 animate-pulse' : 'bg-gray-300'}`} />
                                    {formatTimeRemaining(timeRemaining)} → {formatTime(targetTime)}
                                </div>
                            </div>

                            {/* Main glucose value + direction */}
                            <div className="flex items-center gap-4 mb-5 bg-white/60 rounded-2xl p-5 border border-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
                                <div className="flex-1">
                                    <p className="text-[11px] font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                                        Expected by {formatTime(targetTime)}
                                    </p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold text-gray-900 tabular-nums leading-none tracking-tighter">
                                            {isMmol ? displayedGlucose.toFixed(1) : displayedGlucose}
                                        </span>
                                        <span className="text-xl font-bold text-gray-300">{label}</span>
                                    </div>
                                </div>
                                {/* Direction button */}
                                <div className="relative">
                                    <button
                                        type="button"
                                        onMouseEnter={() => setShowTooltip(true)}
                                        onMouseLeave={() => setShowTooltip(false)}
                                        onClick={() => setShowTooltip(!showTooltip)}
                                        className={`relative w-14 h-14 ${config.bgColor} rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-[0_4px_20px_rgba(0,0,0,0.08)]`}
                                        aria-label={directionLabel}
                                    >
                                        <DirectionIcon className={`w-7 h-7 ${config.color}`} style={{
                                            animation: direction === 'rising'
                                                ? 'bounceUp 1.4s ease-in-out infinite'
                                                : direction === 'dropping'
                                                    ? 'bounceDown 1.4s ease-in-out infinite'
                                                    : 'none'
                                        }} />
                                    </button>
                                    {showTooltip && (
                                        <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-xl shadow-xl z-20">
                                            <div className="flex items-start gap-2">
                                                <FiInfo className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-300" />
                                                <span className="leading-relaxed">{directionLabel}</span>
                                            </div>
                                            <div className="absolute top-full right-4 w-2 h-2 bg-gray-900 rotate-45 -mt-1" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Risk Alert */}
                    {riskAlert && !isExpired && (
                        <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
                            <FiZap className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                            <p className="text-sm text-red-700 font-medium">{riskAlert}</p>
                        </div>
                    )}

                    {/* Confidence bar */}
                    {!isExpired && (
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[11px] font-semibold text-gray-500">Model Confidence</span>
                                <div className="flex items-center gap-1.5">
                                    <span className={`text-[11px] font-medium ${confidencePercent >= 70 ? 'text-emerald-600' :
                                        confidencePercent >= 50 ? 'text-amber-500' : 'text-red-500'
                                        }`}>{confidenceLabel}</span>
                                    <span className={`text-sm font-black tabular-nums ${confidencePercent >= 70 ? 'text-emerald-600' :
                                        confidencePercent >= 50 ? 'text-amber-600' : 'text-red-500'
                                        }`}>{confidencePercent}%</span>
                                </div>
                            </div>
                            {/* Track */}
                            <div className="relative w-full h-2 bg-gray-100 rounded-full">
                                <div
                                    className={`absolute inset-y-0 left-0 ${confidenceColor} rounded-full transition-all duration-700 ease-out`}
                                    style={{ width: `${confidenceAnimated}%` }}
                                />
                                {/* Knob */}
                                <div
                                    className="absolute top-1/2 -translate-y-1/2 transition-all duration-700 ease-out pointer-events-none"
                                    style={{ left: `${confidenceAnimated}%` }}
                                >
                                    <div className={`-ml-2 w-4 h-4 rounded-full bg-white shadow-[0_1px_6px_rgba(0,0,0,0.18)] border-2 ${confidencePercent >= 70 ? 'border-emerald-500' :
                                        confidencePercent >= 50 ? 'border-amber-500' : 'border-red-500'
                                        }`} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Recommendation */}
                    {!isExpired && (
                        <div className={`p-4 rounded-2xl ${config.bgColor} border ${config.borderColor} mb-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)]`}>
                            <p className="text-[13px] font-medium text-gray-700 leading-relaxed">{recommendation}</p>
                        </div>
                    )}

                    {/* DiaBuddy section */}
                    {!isExpired && (
                        <div className="mb-4">
                            {(diabuddyReply || aiInsight) ? (
                                <div className="rounded-2xl overflow-hidden border border-indigo-100 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
                                    {/* DiaBuddy header */}
                                    <div
                                        className="flex items-center gap-2.5 px-4 py-3"
                                        style={{ background: 'linear-gradient(135deg, #1F2F98 0%, #4338ca 60%, #7c3aed 100%)' }}
                                    >
                                        <div className="relative w-8 h-8 shrink-0">
                                            <span className="absolute inset-0 rounded-full bg-white/20 animate-ping" style={{ animationDuration: '2.5s' }} />
                                            <div className="absolute inset-0.5 rounded-full bg-white/90 flex items-center justify-center overflow-hidden shadow">
                                                <Image src="/diabuddy.png" alt="DiaBuddy" width={24} height={24} className="rounded-full object-cover" />
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-white tracking-wide leading-tight">DiaBuddy's Take</p>
                                            <p className="text-[10px] text-white/60 leading-tight">AI Health Assistant</p>
                                        </div>
                                        <span className="ml-auto flex items-center gap-1.5 text-[10px] text-white/70 font-semibold">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                            AI
                                        </span>
                                    </div>
                                    {/* Reply bubble */}
                                    <div className="px-4 py-3.5 bg-linear-to-br from-indigo-50/90 via-violet-50/60 to-purple-50/40">
                                        <p className="text-sm text-indigo-900 leading-relaxed" style={{ animation: 'fadeSlideIn 0.4s ease-out' }}>
                                            {diabuddyReply || aiInsight}
                                        </p>
                                        {diabuddyReply && (
                                            <div className="mt-3 flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setDiaBuddyReply(null)}
                                                    className="text-[11px] text-indigo-400 hover:text-indigo-600 font-medium underline underline-offset-2 transition-colors"
                                                >
                                                    Ask again
                                                </button>
                                                <span className="text-gray-200">·</span>
                                                <button
                                                    type="button"
                                                    onClick={() => { setDiaBuddyReply(null); }}
                                                    className="text-[11px] text-gray-400 hover:text-gray-600 font-medium transition-colors"
                                                >
                                                    Hide
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : diabuddyLoading ? (
                                <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-indigo-100 bg-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
                                    <div className="relative w-8 h-8 shrink-0">
                                        <div className="absolute inset-0 rounded-full bg-indigo-100 animate-pulse" />
                                        <div className="absolute inset-0.5 rounded-full bg-white flex items-center justify-center overflow-hidden">
                                            <Image src="/diabuddy.png" alt="" width={22} height={22} className="rounded-full opacity-90" />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-semibold text-indigo-700">DiaBuddy is thinking</p>
                                        <p className="text-[10px] text-indigo-400 mt-0.5">Analysing your glucose context…</p>
                                    </div>
                                    <span className="flex gap-1">
                                        {[0, 1, 2].map(i => (
                                            <span
                                                key={i}
                                                className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                                                style={{ animation: `bounce 1s ease-in-out ${i * 0.18}s infinite` }}
                                            />
                                        ))}
                                    </span>
                                </div>
                            ) : diabuddyError ? (
                                <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50">
                                    <FiMessageCircle className="w-4 h-4 text-gray-300 shrink-0" />
                                    <p className="text-xs text-gray-400">DiaBuddy is unavailable right now. Try again shortly.</p>
                                    <button type="button" onClick={handleAskDiaBuddy} className="ml-auto text-[11px] text-indigo-400 hover:text-indigo-600 font-medium underline">Retry</button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleAskDiaBuddy}
                                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-indigo-100 bg-white/80 hover:bg-indigo-50/80 hover:border-indigo-200 transition-all text-left shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.10)] group"
                                >
                                    <div className="relative w-9 h-9 shrink-0">
                                        <div className="absolute inset-0 rounded-xl bg-indigo-100 group-hover:bg-indigo-200 transition-colors" />
                                        <div className="absolute inset-0.5 rounded-xl overflow-hidden flex items-center justify-center">
                                            <Image src="/diabuddy.png" alt="" width={26} height={26} className="rounded-xl object-cover" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-[#1F2F98]">Ask DiaBuddy</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5 truncate">What does this forecast mean for me?</p>
                                    </div>
                                    <div className="w-7 h-7 rounded-full bg-[#1F2F98]/10 group-hover:bg-[#1F2F98]/20 flex items-center justify-center transition-colors shrink-0">
                                        <FiMessageCircle className="w-3.5 h-3.5 text-[#1F2F98]" />
                                    </div>
                                </button>
                            )}
                        </div>
                    )}

                    {/* Suggestions */}
                    {!isExpired && suggestions && suggestions.length > 0 && (
                        <div className="space-y-2 mb-4">
                            {suggestions.map((s, i) => {
                                const isMealSuggestion = s.toLowerCase().includes('meal');
                                return (
                                    <div key={i} className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                                        <FiAlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-sm text-amber-800">{s}</p>
                                            {isMealSuggestion && (
                                                <Link href="/meals" className="inline-flex items-center gap-1 mt-1.5 text-xs font-bold text-[#1F2F98] hover:underline">
                                                    Log a meal →
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Missing Data Actions */}
                    {!isExpired && missingDataActions && missingDataActions.length > 0 && (
                        <div className="mb-4">
                            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Log more data for better accuracy</p>
                            <div className="flex flex-wrap gap-2">
                                {missingDataActions.map((action, i) => {
                                    const iconMap: Record<string, React.ReactNode> = {
                                        meal: <FiCoffee className="w-3.5 h-3.5" />,
                                        medication: <TbPill className="w-3.5 h-3.5" />,
                                        glucose: <FiDroplet className="w-3.5 h-3.5" />,
                                        activity: <FiActivity className="w-3.5 h-3.5" />,
                                    };
                                    const colorMap: Record<string, string> = {
                                        meal: 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100',
                                        medication: 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100',
                                        glucose: 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100',
                                        activity: 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100',
                                    };
                                    const iconKey = action.icon || 'glucose';
                                    return (
                                        <Link
                                            key={i}
                                            href={action.href}
                                            title={action.reason}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border transition-all hover:shadow-sm ${colorMap[iconKey] || colorMap.glucose}`}
                                        >
                                            {iconMap[iconKey] || <FiDroplet className="w-3.5 h-3.5" />}
                                            {action.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Contributing Factors (collapsible) */}
                    {!isExpired && factors.length > 0 && (
                        <div className="border-t border-gray-100 pt-3 mt-1">
                            <button
                                type="button"
                                onClick={() => setShowFactors(!showFactors)}
                                className="w-full flex items-center justify-between text-[11px] font-semibold text-gray-400 hover:text-gray-600 transition-colors group"
                            >
                                <span className="uppercase tracking-wide">Contributing factors ({factors.length})</span>
                                {showFactors
                                    ? <FiChevronUp className="w-3.5 h-3.5 group-hover:text-gray-600 transition-colors" />
                                    : <FiChevronDown className="w-3.5 h-3.5 group-hover:text-gray-600 transition-colors" />
                                }
                            </button>
                            {showFactors && (
                                <ul className="mt-2.5 space-y-2" style={{ animation: 'fadeSlideIn 0.25s ease-out' }}>
                                    {factors.map((f, i) => (
                                        <li key={i} className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed">
                                            {getFactorIcon(f)}
                                            <span>{f}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {/* Disclaimer */}
                    <p className="text-[10px] text-gray-300 mt-5 text-center font-medium tracking-wide">
                        Forecast based on logged data patterns · Not medical advice
                    </p>
                </div>

                {/* Keyframe styles */}
                <style>{`
                    @keyframes bounceUp {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-4px); }
                    }
                    @keyframes bounceDown {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(4px); }
                    }
                    @keyframes fadeSlideIn {
                        from { opacity: 0; transform: translateY(6px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}</style>
            </CardContent>
        </Card>
    );
}



