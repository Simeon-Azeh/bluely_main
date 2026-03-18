'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { FiPlus, FiSun, FiMoon, FiCoffee, FiAward } from 'react-icons/fi';
import { useGlucoseUnit } from '@/hooks/useGlucoseUnit';

interface WelcomeHeaderProps {
    userName?: string;
    motivationalMessage: string;
    isOnboardingComplete: boolean;
    todaysReadingsCount: number;
    averageGlucose: number | null;
    streak: number;
}

export default function WelcomeHeader({
    userName,
    motivationalMessage,
    isOnboardingComplete,
    todaysReadingsCount,
    averageGlucose,
    streak,
}: WelcomeHeaderProps) {
    const { format, label } = useGlucoseUnit();
    // Get greeting based on time of day
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return { text: 'Good morning', icon: FiSun, color: 'text-amber-500' };
        if (hour < 17) return { text: 'Good afternoon', icon: FiCoffee, color: 'text-orange-500' };
        return { text: 'Good evening', icon: FiMoon, color: 'text-indigo-500' };
    };

    const greeting = getGreeting();
    const GreetingIcon = greeting.icon;

    return (
        <div className="bg-gradient-to-br from-[#1F2F98] via-[#2D3DA8] to-[#3B4CC0] dark:bg-none dark:bg-[#1e1e1e] dark:border dark:border-[#3a3a3a] rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <GreetingIcon className={`w-5 h-5 ${greeting.color}`} />
                            <span className="text-white/80 text-sm">{greeting.text}</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold">
                            {userName || 'Welcome back'}!
                        </h1>
                        <p className="text-white/70 mt-2 text-sm max-w-md">
                            {motivationalMessage}
                        </p>
                    </div>
                    {isOnboardingComplete && (
                        <Link href="/glucose">
                            <Button className="bg-white text-[#1F2F98] hover:bg-white/90 shadow-lg font-semibold dark:bg-[#2a2a2a] dark:text-white dark:hover:bg-[#3a3a3a]">
                                <FiPlus className="w-4 h-4 mr-2 text-[#1F2F98] dark:text-white" />
                                <span className="text-[#1f2f98] dark:text-white">Quick Log</span>
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Quick Stats Row */}
                {isOnboardingComplete && averageGlucose && (
                    <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/20">
                        <div>
                            <p className="text-white/60 text-xs uppercase tracking-wide">Today</p>
                            <p className="text-2xl font-bold mt-1">{todaysReadingsCount}</p>
                            <p className="text-white/70 text-sm">readings</p>
                        </div>
                        <div>
                            <p className="text-white/60 text-xs uppercase tracking-wide">Average</p>
                            <p className="text-2xl font-bold mt-1">{averageGlucose ? format(averageGlucose) : '--'}</p>
                            <p className="text-white/70 text-sm">{label}</p>
                        </div>
                        <div>
                            <p className="text-white/60 text-xs uppercase tracking-wide">Streak</p>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-2xl font-bold">{streak}</p>
                                <FiAward className="w-5 h-5 text-amber-400" />
                            </div>
                            <p className="text-white/70 text-sm">days</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
