'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { FiClock, FiArrowRight, FiPlus, FiSun, FiMoon, FiCoffee, FiActivity, FiHeart } from 'react-icons/fi';
import { format, isToday, isYesterday } from 'date-fns';

interface Reading {
    _id: string;
    value: number;
    unit: string;
    readingType: string;
    recordedAt: string;
    notes?: string;
}

interface RecentReadingsProps {
    readings: Reading[];
    targetMin: number;
    targetMax: number;
}

export default function RecentReadings({ readings, targetMin, targetMax }: RecentReadingsProps) {
    const getGlucoseStatus = (value: number) => {
        if (value < targetMin) return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', label: 'Low' };
        if (value > targetMax) return { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', label: 'High' };
        return { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', label: 'In Range' };
    };

    const getReadingTypeIcon = (type: string) => {
        switch (type) {
            case 'fasting': return FiSun;
            case 'before_meal': return FiCoffee;
            case 'after_meal': return FiActivity;
            case 'bedtime': return FiMoon;
            default: return FiActivity;
        }
    };

    const formatReadingTime = (date: string) => {
        const d = new Date(date);
        if (isToday(d)) return `Today, ${format(d, 'h:mm a')}`;
        if (isYesterday(d)) return `Yesterday, ${format(d, 'h:mm a')}`;
        return format(d, 'MMM d, h:mm a');
    };

    return (
        <Card className="border-0 shadow-lg shadow-gray-100">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <FiClock className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <CardTitle>Recent Readings</CardTitle>
                            <p className="text-sm text-gray-500">Your latest entries</p>
                        </div>
                    </div>
                    <Link href="/history" className="text-sm text-[#1F2F98] hover:underline font-medium flex items-center gap-1">
                        View All
                        <FiArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </CardHeader>
            <CardContent>
                {readings.length > 0 ? (
                    <div className="space-y-3">
                        {readings.map((reading) => {
                            const status = getGlucoseStatus(reading.value);
                            const TypeIcon = getReadingTypeIcon(reading.readingType);

                            return (
                                <div
                                    key={reading._id}
                                    className={`flex items-center justify-between p-4 rounded-xl ${status.bg} border ${status.border} transition-all hover:shadow-md`}
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${status.bg}`}>
                                            <TypeIcon className={`w-5 h-5 ${status.color}`} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-2xl font-bold ${status.color}`}>
                                                    {reading.value}
                                                </span>
                                                <span className="text-sm text-gray-500">{reading.unit}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.color} font-medium`}>
                                                    {status.label}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 capitalize">
                                                {reading.readingType.replace('_', ' ')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-700">
                                            {formatReadingTime(reading.recordedAt)}
                                        </p>
                                        {reading.notes && (
                                            <p className="text-xs text-gray-400 mt-1 truncate max-w-[150px]">
                                                {reading.notes}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <FiHeart className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-600 font-medium mb-2">No readings yet</p>
                        <p className="text-sm text-gray-500 mb-4">Log your first reading to get started</p>
                        <Link href="/glucose">
                            <Button size="sm" className="bg-[#1F2F98]">
                                <FiPlus className="w-4 h-4 mr-1" />
                                Log Reading
                            </Button>
                        </Link>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
