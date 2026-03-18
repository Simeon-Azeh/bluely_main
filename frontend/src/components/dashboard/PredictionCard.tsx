'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui';
import { FiShield, FiAlertTriangle, FiAlertOctagon } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

interface PredictionCardProps {
    predictedGlucose: number;
    riskLevel: 'normal' | 'elevated' | 'critical';
    confidence: number;
    recommendation: string;
}

const riskConfig = {
    normal: {
        icon: FiShield,
        label: 'Normal',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        borderColor: 'border-green-200',
        gradient: 'from-green-50 to-emerald-50',
        barColor: 'bg-green-500',
    },
    elevated: {
        icon: FiAlertTriangle,
        label: 'Elevated',
        color: 'text-amber-600',
        bgColor: 'bg-amber-100',
        borderColor: 'border-amber-200',
        gradient: 'from-amber-50 to-yellow-50',
        barColor: 'bg-amber-500',
    },
    critical: {
        icon: FiAlertOctagon,
        label: 'Critical',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-200',
        gradient: 'from-red-50 to-orange-50',
        barColor: 'bg-red-500',
    },
};

export default function PredictionCard({
    predictedGlucose,
    riskLevel,
    confidence,
    recommendation,
}: PredictionCardProps) {
    const { user } = useAuth();
    const config = riskConfig[riskLevel];
    const Icon = config.icon;
    const confidencePercent = Math.round(confidence * 100);
    const [diabuddyInsight, setDiaBuddyInsight] = useState<string | null>(null);
    const [isDiaBuddyLoading, setIsDiaBuddyLoading] = useState(false);
    const [diabuddyError, setDiaBuddyError] = useState(false);

    const handleAskDiaBuddy = async () => {
        if (!user) return;
        setIsDiaBuddyLoading(true);
        setDiaBuddyError(false);
        try {
            const result = await api.chatWithDiaBuddy(
                user.uid,
                `My glucose risk assessment shows I'm in the "${riskLevel}" range with a predicted glucose of ~${predictedGlucose} mg/dL. The system recommendation is: "${recommendation}". In 2-3 sentences, explain what this means and give 1-2 specific, practical things I can do right now to manage this.`,
                [],
                user.displayName,
            );
            setDiaBuddyInsight(result.reply);
        } catch {
            setDiaBuddyError(true);
        } finally {
            setIsDiaBuddyLoading(false);
        }
    };

    return (
        <Card className={`border-0 shadow-lg bg-gradient-to-br ${config.gradient} overflow-hidden`}>
            <CardContent>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${config.bgColor} rounded-xl flex items-center justify-center`}>
                            <Icon className={`w-5 h-5 ${config.color}`} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Glucose Prediction</h3>
                            <p className="text-xs text-gray-500">Based on logged data patterns</p>
                        </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bgColor} ${config.color}`}>
                        {config.label}
                    </span>
                </div>

                {/* Predicted value */}
                <div className="flex items-end gap-4 mb-4">
                    <div>
                        <p className="text-sm text-gray-500 mb-1">Predicted Level</p>
                        <p className="text-4xl font-bold text-gray-900">
                            ~{predictedGlucose}
                            <span className="text-lg font-normal text-gray-400 ml-1">mg/dL</span>
                        </p>
                    </div>
                </div>

                {/* Confidence bar */}
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

                {/* Recommendation */}
                <div className={`p-3 rounded-xl ${config.bgColor}/50 border ${config.borderColor}`}>
                    <p className="text-sm text-gray-700">
                        {recommendation}
                    </p>
                </div>

                {/* DiaBuddy Insight Section */}
                {!diabuddyInsight && !isDiaBuddyLoading && (
                    <button
                        type="button"
                        onClick={handleAskDiaBuddy}
                        className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/60 text-xs font-semibold text-[#1F2F98] hover:bg-indigo-100 transition-colors"
                    >
                        <Image src="/diabuddy.png" alt="DiaBuddy" width={18} height={18} className="rounded-full" />
                        Ask DiaBuddy what this means &amp; what to do
                    </button>
                )}

                {isDiaBuddyLoading && (
                    <div className="mt-3 flex items-center justify-center gap-2 py-3">
                        <span className="w-1.5 h-1.5 bg-[#1F2F98] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        <span className="text-xs text-gray-500 ml-1">DiaBuddy is thinking...</span>
                    </div>
                )}

                {diabuddyInsight && (
                    <div className="mt-3 rounded-2xl overflow-hidden border border-indigo-100 shadow-[0_2px_12px_rgba(99,102,241,0.12)]">
                        <div className="flex items-center gap-2.5 px-4 py-2.5" style={{ background: 'linear-gradient(135deg, #1F2F98, #4338ca, #7c3aed)' }}>
                            <div className="relative w-7 h-7 shrink-0">
                                <div className="absolute inset-0 rounded-full bg-white/25 animate-pulse" />
                                <div className="absolute inset-0.5 rounded-full bg-white/90 flex items-center justify-center overflow-hidden">
                                    <Image src="/diabuddy.png" alt="DiaBuddy" width={22} height={22} className="rounded-full object-cover" />
                                </div>
                            </div>
                            <p className="text-xs font-semibold text-white tracking-wide">DiaBuddy's Take</p>
                            <button
                                type="button"
                                onClick={() => setDiaBuddyInsight(null)}
                                className="ml-auto text-[10px] text-white/60 hover:text-white transition-colors"
                            >
                                Ask again
                            </button>
                        </div>
                        <div className="px-4 py-3 bg-gradient-to-br from-indigo-50/80 via-violet-50/60 to-purple-50/40">
                            <p className="text-sm text-indigo-900 leading-relaxed">{diabuddyInsight}</p>
                        </div>
                    </div>
                )}

                {diabuddyError && (
                    <p className="mt-2 text-xs text-center text-gray-400">DiaBuddy is unavailable right now. Try again in a moment.</p>
                )}

                {/* Disclaimer */}
                <p className="text-[10px] text-gray-400 mt-3 text-center">
                    Insights are based on logged data patterns and are not medical instructions.
                </p>
            </CardContent>
        </Card>
    );
}
