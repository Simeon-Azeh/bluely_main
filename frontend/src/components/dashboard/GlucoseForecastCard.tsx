'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui';
import { FiClock, FiInfo, FiZap, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import { IoArrowUp, IoArrowDown, IoArrowForward } from 'react-icons/io5';
import Link from 'next/link';

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
}

const directionConfig = {
    rising: {
        Icon: IoArrowUp,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        borderColor: 'border-orange-200',
        gradient: 'from-orange-50 to-amber-50',
        barColor: 'bg-orange-500',
        badgeText: 'Rising',
        badgeBg: 'bg-orange-100 text-orange-700',
    },
    stable: {
        Icon: IoArrowForward,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        borderColor: 'border-green-200',
        gradient: 'from-green-50 to-emerald-50',
        barColor: 'bg-green-500',
        badgeText: 'Stable',
        badgeBg: 'bg-green-100 text-green-700',
    },
    dropping: {
        Icon: IoArrowDown,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        borderColor: 'border-blue-200',
        gradient: 'from-blue-50 to-cyan-50',
        barColor: 'bg-blue-500',
        badgeText: 'Dropping',
        badgeBg: 'bg-blue-100 text-blue-700',
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
}: GlucoseForecastCardProps) {
    const [showTooltip, setShowTooltip] = useState(false);
    const [showFactors, setShowFactors] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState<number>(30 * 60 * 1000);
    const [isExpired, setIsExpired] = useState(false);

    const config = directionConfig[direction];
    const DirectionIcon = config.Icon;
    const confidencePercent = Math.round(confidence * 100);

    // Memoize target time so it doesn't create a new Date on every render
    const predictionMade = useMemo(
        () => (predictionTimestamp ? new Date(predictionTimestamp) : new Date()),
        [predictionTimestamp]
    );
    const targetTime = useMemo(
        () => new Date(predictionMade.getTime() + 30 * 60 * 1000),
        [predictionMade]
    );

    // Countdown timer - deps are now stable references
    useEffect(() => {
        const target = targetTime.getTime();

        const updateCountdown = () => {
            const remaining = target - Date.now();
            setTimeRemaining(Math.max(0, remaining));

            if (remaining <= 0 && !isExpired) {
                setIsExpired(true);
                // Send browser notification if permitted
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
                    } catch (err) {
                        console.warn('Notification failed:', err);
                    }
                }
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 10000);
        return () => clearInterval(interval);
    }, [targetTime, isExpired]); // targetTime is now memoized, won't trigger infinite loop

    const handleRefresh = useCallback(() => {
        setIsExpired(false);
        onRefresh?.();
    }, [onRefresh]);

    return (
        <Card className={`border-0 shadow-lg bg-gradient-to-br ${config.gradient} overflow-hidden`}>
            <CardContent>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${config.bgColor} rounded-xl flex items-center justify-center`}>
                            <FiClock className={`w-5 h-5 ${config.color}`} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">30-Minute Forecast</h3>
                            <p className="text-xs text-gray-500">
                                {modelUsed === 'ohiot1dm' ? 'OhioT1DM ML Model' : 'Trend Analysis'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.badgeBg}`}>
                            {config.badgeText}
                        </span>
                    </div>
                </div>

                {/* Expired state */}
                {isExpired ? (
                    <div className="mb-4 p-4 bg-white/70 border border-gray-200 rounded-xl text-center">
                        <p className="text-sm font-medium text-gray-800 mb-1">
                            Forecast window reached!
                        </p>
                        <p className="text-xs text-gray-500 mb-3">
                            This prediction was for {formatTime(targetTime)}. Log a new reading to see how accurate it was.
                        </p>
                        <button
                            type="button"
                            onClick={handleRefresh}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1F2F98] text-white text-sm font-medium rounded-xl hover:bg-[#1F2F98]/90 transition-colors"
                        >
                            <FiRefreshCw className="w-3.5 h-3.5" />
                            Update Forecast
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Time info */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <FiClock className="w-3 h-3" />
                                <span>Predicted at {formatTime(predictionMade)}</span>
                            </div>
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${timeRemaining < 5 * 60 * 1000
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-gray-100 text-gray-600'
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${timeRemaining < 5 * 60 * 1000 ? 'bg-amber-500 animate-pulse' : 'bg-gray-400'
                                    }`} />
                                {formatTimeRemaining(timeRemaining)} until {formatTime(targetTime)}
                            </div>
                        </div>

                        {/* Predicted value + direction arrow */}
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex-1">
                                <p className="text-sm text-gray-500 mb-1">
                                    Expected by {formatTime(targetTime)}
                                </p>
                                <div className="flex items-end gap-3">
                                    <p className="text-4xl font-bold text-gray-900">
                                        ~{Math.round(predictedGlucose)}
                                        <span className="text-lg font-normal text-gray-400 ml-1">mg/dL</span>
                                    </p>
                                    {/* Direction Arrow with tooltip */}
                                    <div className="relative mb-1">
                                        <button
                                            type="button"
                                            onMouseEnter={() => setShowTooltip(true)}
                                            onMouseLeave={() => setShowTooltip(false)}
                                            onClick={() => setShowTooltip(!showTooltip)}
                                            className={`w-10 h-10 ${config.bgColor} rounded-full flex items-center justify-center transition-transform hover:scale-110`}
                                            aria-label={directionLabel}
                                        >
                                            <DirectionIcon className={`w-6 h-6 ${config.color}`} />
                                        </button>
                                        {showTooltip && (
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-xl shadow-lg z-20">
                                                <div className="flex items-start gap-2">
                                                    <FiInfo className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                                    <span>{directionLabel}</span>
                                                </div>
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 -mt-1" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Risk Alert */}
                {riskAlert && !isExpired && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                        <FiZap className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                        <p className="text-sm text-red-700">{riskAlert}</p>
                    </div>
                )}

                {/* Confidence bar */}
                {!isExpired && (
                    <div className="mb-4">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>Model Confidence</span>
                            <span className="font-semibold">{confidencePercent}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${config.barColor} rounded-full transition-all duration-500`}
                                style={{ width: `${confidencePercent}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Recommendation */}
                {!isExpired && (
                    <div className={`p-3 rounded-xl ${config.bgColor}/50 border ${config.borderColor}`}>
                        <p className="text-sm text-gray-700">{recommendation}</p>
                    </div>
                )}

                {/* Suggestions (actionable nudges) */}
                {!isExpired && suggestions && suggestions.length > 0 && (
                    <div className="mt-3 space-y-2">
                        {suggestions.map((s, i) => {
                            const isMealSuggestion = s.toLowerCase().includes('meal');
                            return (
                                <div key={i} className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                                    <FiAlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm text-amber-800">{s}</p>
                                        {isMealSuggestion && (
                                            <Link
                                                href="/meals"
                                                className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold text-[#1F2F98] hover:underline"
                                            >
                                                Log a meal →
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Contributing Factors (collapsible) */}
                {!isExpired && factors.length > 0 && (
                    <div className="mt-3">
                        <button
                            type="button"
                            onClick={() => setShowFactors(!showFactors)}
                            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                        >
                            <FiInfo className="w-3 h-3" />
                            {showFactors ? 'Hide' : 'Show'} contributing factors
                        </button>
                        {showFactors && (
                            <ul className="mt-2 space-y-1">
                                {factors.map((f, i) => (
                                    <li key={i} className="text-xs text-gray-500 flex items-start gap-1.5">
                                        <span className="text-gray-400 mt-0.5">&#8226;</span>
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {/* Disclaimer */}
                <p className="text-[10px] text-gray-400 mt-3 text-center">
                    Forecast based on logged data patterns, not medical advice.
                </p>
            </CardContent>
        </Card>
    );
}
