'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui';
import { FiTarget, FiCheckCircle, FiCircle, FiStar } from 'react-icons/fi';

interface TodaysProgressProps {
    todaysReadingsCount: number;
    recommendedReadings: number;
    userName?: string;
}

function getTimePeriod(): 'morning' | 'afternoon' | 'evening' {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
}

function getGreeting(name?: string): string {
    const period = getTimePeriod();
    const who = name ? `, ${name}` : '';
    if (period === 'morning') return `Good morning${who}!`;
    if (period === 'afternoon') return `Good afternoon${who}!`;
    return `Good evening${who}!`;
}

function getMotivation(count: number, goal: number): { text: string; subtext: string } {
    const period = getTimePeriod();
    const remaining = Math.max(0, goal - count);

    if (count >= goal) {
        return {
            text: "You've hit your daily goal!",
            subtext: 'Amazing consistency. Your data helps build better insights.',
        };
    }

    if (count === 0) {
        if (period === 'morning') return { text: 'Start your day strong', subtext: 'Log your first reading to kick things off.' };
        if (period === 'afternoon') return { text: "There's still time", subtext: 'A quick reading now helps track your afternoon pattern.' };
        return { text: 'End the day informed', subtext: 'Even one reading tonight adds valuable data.' };
    }

    if (remaining === 1) {
        return { text: 'Almost there!', subtext: 'Just one more reading to complete your daily goal.' };
    }

    if (period === 'morning' && count >= 1) {
        return { text: 'Great start!', subtext: `${remaining} more reading${remaining > 1 ? 's' : ''} to go. You're on track.` };
    }
    if (period === 'afternoon') {
        return { text: 'Keep the momentum', subtext: `${remaining} more to go. An afternoon check helps catch trends.` };
    }
    return { text: 'Finish strong', subtext: `${remaining} more reading${remaining > 1 ? 's' : ''} before the day ends.` };
}

export default function TodaysProgress({ todaysReadingsCount, recommendedReadings, userName }: TodaysProgressProps) {
    const progressPercentage = Math.min((todaysReadingsCount / recommendedReadings) * 100, 100);
    const timeSlots = ['Morning', 'Afternoon', 'Evening'];
    const greeting = getGreeting(userName);
    const motivation = getMotivation(todaysReadingsCount, recommendedReadings);
    const goalMet = todaysReadingsCount >= recommendedReadings;

    return (
        <Card className={`border-0 shadow-lg ${goalMet ? 'shadow-green-100 bg-gradient-to-br from-green-50 to-emerald-50' : 'shadow-gray-100'}`}>
            <CardContent>
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${goalMet ? 'bg-green-100' : 'bg-blue-100'}`}>
                            {goalMet ? (
                                <FiStar className="w-5 h-5 text-green-600" />
                            ) : (
                                <FiTarget className="w-5 h-5 text-[#1F2F98]" />
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">{greeting}</h3>
                            <p className="text-xs text-gray-500">Track {recommendedReadings} readings daily</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className={`text-2xl font-bold ${goalMet ? 'text-green-600' : 'text-[#1F2F98]'}`}>
                            {todaysReadingsCount}/{recommendedReadings}
                        </p>
                        <p className="text-xs text-gray-500">{goalMet ? 'complete!' : 'completed'}</p>
                    </div>
                </div>

                {/* Personalized motivation */}
                <div className={`mb-4 px-3 py-2 rounded-lg ${goalMet ? 'bg-green-100/60' : 'bg-blue-50/60'}`}>
                    <p className={`text-sm font-medium ${goalMet ? 'text-green-700' : 'text-gray-700'}`}>{motivation.text}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{motivation.subtext}</p>
                </div>

                {/* Progress Bar */}
                <div className="relative">
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                            className={`h-3 rounded-full transition-all duration-500 ease-out ${goalMet
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                : 'bg-gradient-to-r from-[#1F2F98] to-[#3B4CC0]'
                                }`}
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
