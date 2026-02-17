'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui';
import { FiActivity, FiTarget, FiTrendingDown, FiTrendingUp } from 'react-icons/fi';

interface StatsGridProps {
    averageGlucose: number | null;
    inRangePercentage: number | null;
    minGlucose: number | null;
    maxGlucose: number | null;
    targetMin: number;
    targetMax: number;
}

export default function StatsGrid({
    averageGlucose,
    inRangePercentage,
    minGlucose,
    maxGlucose,
    targetMin,
    targetMax,
}: StatsGridProps) {
    const stats = [
        {
            label: '7-Day Avg',
            value: averageGlucose || '--',
            unit: 'mg/dL',
            icon: FiActivity,
            iconColor: 'text-[#1F2F98]',
            bgGradient: 'from-blue-100 to-blue-50',
        },
        {
            label: 'In Range',
            value: inRangePercentage ?? '--',
            unit: `${targetMin}-${targetMax} mg/dL`,
            suffix: '%',
            icon: FiTarget,
            iconColor: 'text-green-600',
            bgGradient: 'from-green-100 to-green-50',
            valueColor: 'text-green-600',
        },
        {
            label: 'Lowest',
            value: minGlucose || '--',
            unit: 'mg/dL',
            icon: FiTrendingDown,
            iconColor: 'text-red-500',
            bgGradient: 'from-red-100 to-red-50',
        },
        {
            label: 'Highest',
            value: maxGlucose || '--',
            unit: 'mg/dL',
            icon: FiTrendingUp,
            iconColor: 'text-orange-500',
            bgGradient: 'from-orange-100 to-orange-50',
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                    <Card key={stat.label} className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)] transition-shadow">
                        <CardContent>
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
                                    <p className={`text-3xl font-bold ${stat.valueColor || 'text-gray-900'}`}>
                                        {stat.value}{stat.suffix || ''}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">{stat.unit}</p>
                                </div>
                                <div className={`w-12 h-12 bg-gradient-to-br ${stat.bgGradient} rounded-2xl flex items-center justify-center`}>
                                    <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
