'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui';
import { FiTarget, FiCheckCircle, FiCircle } from 'react-icons/fi';

interface TodaysProgressProps {
    todaysReadingsCount: number;
    recommendedReadings: number;
}

export default function TodaysProgress({ todaysReadingsCount, recommendedReadings }: TodaysProgressProps) {
    const progressPercentage = Math.min((todaysReadingsCount / recommendedReadings) * 100, 100);
    const timeSlots = ['Morning', 'Afternoon', 'Evening'];

    return (
        <Card className="border-0 shadow-lg shadow-gray-100">
            <CardContent>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <FiTarget className="w-5 h-5 text-[#1F2F98]" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Today&apos;s Goal</h3>
                            <p className="text-sm text-gray-500">Track {recommendedReadings} readings daily</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-[#1F2F98]">{todaysReadingsCount}/{recommendedReadings}</p>
                        <p className="text-xs text-gray-500">completed</p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="relative">
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-[#1F2F98] to-[#3B4CC0] h-3 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                    {/* Milestone markers */}
                    <div className="flex justify-between mt-3">
                        {timeSlots.map((time, index) => (
                            <div key={time} className="flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${todaysReadingsCount > index
                                        ? 'bg-green-100 text-green-600'
                                        : 'bg-gray-100 text-gray-400'
                                    }`}>
                                    {todaysReadingsCount > index ? (
                                        <FiCheckCircle className="w-4 h-4" />
                                    ) : (
                                        <FiCircle className="w-4 h-4" />
                                    )}
                                </div>
                                <span className="text-xs text-gray-500 mt-1">{time}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
