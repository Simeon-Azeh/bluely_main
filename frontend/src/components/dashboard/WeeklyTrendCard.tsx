'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui';
import { FiTrendingUp, FiTrendingDown, FiMinus, FiBarChart2 } from 'react-icons/fi';

interface WeeklyTrendCardProps {
    direction: 'rising' | 'stable' | 'declining';
    currentAverage: number;
    previousAverage: number | null;
    percentageChange: number;
    totalReadings: number;
    riskPeriod: string;
    recommendation: string;
}

const trendConfig = {
    rising: {
        icon: FiTrendingUp,
        label: 'Rising',
        color: 'text-red-500',
        bgColor: 'bg-red-100',
        arrow: '↑',
    },
    stable: {
        icon: FiMinus,
        label: 'Stable',
        color: 'text-green-500',
        bgColor: 'bg-green-100',
        arrow: '→',
    },
    declining: {
        icon: FiTrendingDown,
        label: 'Declining',
        color: 'text-blue-500',
        bgColor: 'bg-blue-100',
        arrow: '↓',
    },
};

export default function WeeklyTrendCard({
    direction,
    currentAverage,
    previousAverage,
    percentageChange,
    totalReadings,
    riskPeriod,
    recommendation,
}: WeeklyTrendCardProps) {
    const config = trendConfig[direction];
    const TrendIcon = config.icon;

    return (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden">
            <CardContent>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-blue-600 rounded-xl flex items-center justify-center">
                            <FiBarChart2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Weekly Trend</h3>
                            <p className="text-xs text-gray-500">{totalReadings} readings this week</p>
                        </div>
                    </div>
                    <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${config.bgColor}`}>
                        <TrendIcon className={`w-4 h-4 ${config.color}`} />
                        <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
                    </div>
                </div>

                {/* Average comparison */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-white rounded-xl border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">This Week Avg</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {currentAverage}
                            <span className="text-sm font-normal text-gray-400 ml-1">mg/dL</span>
                        </p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Last Week Avg</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {previousAverage ?? '—'}
                            {previousAverage && (
                                <span className="text-sm font-normal text-gray-400 ml-1">mg/dL</span>
                            )}
                        </p>
                        {previousAverage && (
                            <p className={`text-xs font-semibold mt-1 ${percentageChange > 0 ? 'text-red-500' : percentageChange < 0 ? 'text-green-500' : 'text-gray-500'
                                }`}>
                                {config.arrow} {Math.abs(percentageChange)}%
                            </p>
                        )}
                    </div>
                </div>

                {/* Risk Period */}
                <div className="p-3 bg-white/80 rounded-xl border border-gray-100 mb-3">
                    <p className="text-xs text-gray-500 mb-1">Pattern Detected</p>
                    <p className="text-sm font-medium text-gray-700">{riskPeriod}</p>
                </div>

                {/* Recommendation */}
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-sm text-gray-700">
                        <span className="font-medium">📊 </span>
                        {recommendation}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
