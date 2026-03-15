'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { LoadingSpinner } from '@/components/ui';
import { FiActivity, FiArrowRight, FiClock, FiTrendingUp, FiDroplet, FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import MissingInputsCard, { MissingInput, QuickLogData } from './MissingInputsCard';
import GlucoseForecastCard from './GlucoseForecastCard';

const FORECAST_CACHE_KEY = 'bluely-forecast-cache';
const FORECAST_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

interface ForecastPrediction {
    predictedGlucose: number;
    direction: 'rising' | 'stable' | 'dropping';
    directionArrow: string;
    directionLabel: string;
    confidence: number;
    timeframe: string;
    recommendation: string;
    riskAlert: string | null;
    factors: string[];
    modelUsed: string;
    predictionTimestamp?: string;
    aiInsight?: string;
}

interface PredictionGatewayProps {
    firebaseUid: string;
    onForecastReady?: (forecast: ForecastPrediction) => void;
    isVisible?: boolean;
}

type GatewayState = 'restoring' | 'idle' | 'checking' | 'incomplete' | 'fetching' | 'complete' | 'error';

export default function PredictionGateway({
    firebaseUid,
    onForecastReady,
    isVisible = true,
}: PredictionGatewayProps) {
    const [state, setState] = useState<GatewayState>('restoring');
    const [missingInputs, setMissingInputs] = useState<MissingInput[]>([]);
    const [forecast, setForecast] = useState<ForecastPrediction | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Restore cached forecast on mount if still within the 30-min window
    useEffect(() => {
        try {
            const raw = localStorage.getItem(FORECAST_CACHE_KEY);
            if (!raw) { setState('idle'); return; }
            const cached: ForecastPrediction = JSON.parse(raw);
            if (!cached.predictionTimestamp) { setState('idle'); return; }
            const elapsed = Date.now() - new Date(cached.predictionTimestamp).getTime();
            if (elapsed < FORECAST_WINDOW_MS) {
                setForecast(cached);
                setState('complete');
                onForecastReady?.(cached);
            } else {
                localStorage.removeItem(FORECAST_CACHE_KEY);
                setState('idle');
            }
        } catch {
            // Malformed cache — treat as cold start
            setState('idle');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /**
     * Check safety by calling the backend API.
     * This happens when user clicks "Get Forecast" button.
     */
    const checkSafety = useCallback(async () => {
        setState('checking');
        setErrorMessage(null);

        try {
            // Call the predict endpoint which will return 422 if incomplete
            const response = await fetch(`/api/predict/glucose-30?firebaseUid=${firebaseUid}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            // If 422, we have missing inputs
            if (response.status === 422) {
                const data = await response.json();
                setMissingInputs(data.missingInputs || []);
                setState('incomplete');
                return;
            }

            // If successful, we have a forecast
            if (response.ok) {
                const data = await response.json();
                if (data.hasData && data.prediction) {
                    setForecast(data.prediction);
                    setState('complete');
                    onForecastReady?.(data.prediction);
                    try {
                        localStorage.setItem(FORECAST_CACHE_KEY, JSON.stringify(data.prediction));
                    } catch { /* storage full — non-critical */ }
                    return;
                }
            }

            // Unexpected response
            setErrorMessage('Unable to check forecast status');
            setState('error');
        } catch (error) {
            console.error('Safety check error:', error);
            setErrorMessage('Network error. Please try again.');
            setState('error');
        }
    }, [onForecastReady]);

    /**
     * Handle quick-log submission.
     * After logging, we re-check safety automatically.
     */
    const handleQuickLog = useCallback(
        async (data: QuickLogData) => {
            try {
                // Call quick-log endpoint
                await fetch('/api/predict/quick-log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ firebaseUid, ...data }),
                });

                // Re-check safety
                await checkSafety();
            } catch (error) {
                console.error('Quick-log error:', error);
                throw error;
            }
        },
        [firebaseUid, checkSafety]
    );

    if (!isVisible) return null;

    // Restoring: silently check localStorage before first paint — show a placeholder
    if (state === 'restoring') {
        return (
            <div className="h-48 rounded-2xl bg-gray-100/80 animate-pulse" />
        );
    }

    // Idle: Show button to check forecast
    if (state === 'idle') {
        return (
            <div className="relative overflow-hidden rounded-2xl border border-[#1F2F98]/15 bg-gradient-to-br from-[#1F2F98]/5 via-blue-50/50 to-indigo-50/30 shadow-sm">
                {/* Subtle animated ring */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-[#1F2F98]/8 pointer-events-none" style={{ animation: 'ping 4s cubic-bezier(0,0,0.2,1) infinite' }} />

                <div className="relative p-6">
                    {/* Icon with live indicator */}
                    <div className="flex justify-center mb-4">
                        <div className="relative">
                            <div className="w-16 h-16 bg-[#1F2F98]/10 rounded-2xl flex items-center justify-center">
                                <FiActivity className="w-8 h-8 text-[#1F2F98]" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#1F2F98] rounded-full border-2 border-white animate-pulse" />
                        </div>
                    </div>

                    <h3 className="text-center font-bold text-gray-900 text-base mb-2">
                        30-Minute Glucose Forecast
                    </h3>
                    <p className="text-center text-sm text-gray-500 mb-5 leading-relaxed">
                        See where your glucose is headed based on recent readings, meals, and activity.
                    </p>

                    {/* Feature pills */}
                    <div className="grid grid-cols-3 gap-2 mb-5">
                        {[
                            { icon: FiClock, label: 'Personalised' },
                            { icon: FiTrendingUp, label: 'ML-Powered' },
                            { icon: FiDroplet, label: 'Real-time' },
                        ].map(({ icon: Icon, label }) => (
                            <div key={label} className="flex flex-col items-center gap-1.5 bg-white/70 rounded-xl p-2.5 border border-white/80">
                                <Icon className="w-4 h-4 text-[#1F2F98]" />
                                <span className="text-[10px] font-semibold text-gray-600">{label}</span>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={checkSafety}
                        className="w-full py-3 bg-[#1F2F98] text-white rounded-xl hover:bg-[#1F2F98]/90 font-semibold text-sm transition-all hover:shadow-lg hover:shadow-[#1F2F98]/20 flex items-center justify-center gap-2 group"
                    >
                        Generate My Forecast
                        <FiArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-150" />
                    </button>
                </div>
            </div>
        );
    }

    // Checking: Show loading state
    if (state === 'checking') {
        return (
            <div className="rounded-2xl border border-[#1F2F98]/15 bg-gradient-to-br from-[#1F2F98]/5 to-blue-50/30 shadow-sm p-8 flex flex-col items-center justify-center">
                <div className="w-14 h-14 bg-[#1F2F98]/10 rounded-2xl flex items-center justify-center mb-4">
                    <FiActivity className="w-7 h-7 text-[#1F2F98] animate-pulse" />
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Analysing your data</p>
                <p className="text-xs text-gray-400">This takes just a moment...</p>
                <LoadingSpinner size="sm" className="mt-3" />
            </div>
        );
    }

    // Incomplete: Show missing inputs card
    if (state === 'incomplete') {
        return (
            <MissingInputsCard
                missingInputs={missingInputs}
                onQuickLog={handleQuickLog}
                onNavigate={(href: string) => {
                    // Navigation can be handled by parent or child Link component
                }}
            />
        );
    }

    // Complete: Show forecast
    if (state === 'complete' && forecast) {
        return (
            <GlucoseForecastCard
                predictedGlucose={forecast.predictedGlucose}
                direction={forecast.direction}
                directionArrow={forecast.directionArrow}
                directionLabel={forecast.directionLabel}
                confidence={forecast.confidence}
                timeframe={forecast.timeframe}
                recommendation={forecast.recommendation}
                riskAlert={forecast.riskAlert}
                factors={forecast.factors}
                modelUsed={forecast.modelUsed}
                predictionTimestamp={forecast.predictionTimestamp}
                aiInsight={forecast.aiInsight}
                onRefresh={checkSafety}
            />
        );
    }

    // Error: Show error message (softer styling)
    if (state === 'error') {
        return (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 shadow-sm p-5">
                <div className="flex items-start gap-3 mb-4">
                    <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                        <FiAlertTriangle className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900 text-sm">Forecast Unavailable</p>
                        <p className="text-xs text-gray-600 mt-0.5">{errorMessage || 'An error occurred. Please try again.'}</p>
                    </div>
                </div>
                <button
                    onClick={checkSafety}
                    className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                >
                    <FiRefreshCw className="w-3.5 h-3.5" />
                    Try Again
                </button>
            </div>
        );
    }

    return null;
}
