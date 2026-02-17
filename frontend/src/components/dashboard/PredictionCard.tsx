'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui';
import { FiShield, FiAlertTriangle, FiAlertOctagon } from 'react-icons/fi';

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
    const config = riskConfig[riskLevel];
    const Icon = config.icon;
    const confidencePercent = Math.round(confidence * 100);

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
                            <p className="text-xs text-gray-500">AI-powered risk analysis</p>
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
                        <span className="font-medium">💡 Tip: </span>
                        {recommendation}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
