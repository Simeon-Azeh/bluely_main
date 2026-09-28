'use client';

import Link from 'next/link';
import { FiArrowUpRight, FiCheck, FiDroplet, FiTrendingUp } from 'react-icons/fi';
import { useGlucoseUnit } from '@/hooks/useGlucoseUnit';

interface WelcomeHeaderProps {
    userName?: string;
    isOnboardingComplete: boolean;
    todaysReadingsCount: number;
    dailyGoal: number;
    averageGlucose: number | null;
    streak: number;
}

export default function WelcomeHeader({ userName, isOnboardingComplete, todaysReadingsCount, dailyGoal, averageGlucose, streak }: WelcomeHeaderProps) {
    const { format, label } = useGlucoseUnit();
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const completed = Math.min(todaysReadingsCount, dailyGoal);
    const goalReached = todaysReadingsCount >= dailyGoal;
    const progress = Math.min((todaysReadingsCount / dailyGoal) * 100, 100);

    return (
        <section aria-label="Your daily overview" className="relative overflow-hidden rounded-[28px] bg-[#101b4b] text-white shadow-[0_20px_45px_rgba(16,27,75,0.14)]">
            <div aria-hidden="true" className="absolute -right-24 -top-36 h-80 w-80 rounded-full border border-white/10" />
            <div aria-hidden="true" className="absolute -right-9 -top-20 h-56 w-56 rounded-full border border-white/10" />

            <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12 lg:p-10">
                <div className="flex flex-col items-start justify-between">
                    <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#aebdff]">Your day with Bluely</p>
                        <h1 className="max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">{greeting}{userName ? `, ${userName}` : ''}<span className="text-[#aebdff]">.</span></h1>
                        <p className="mt-4 max-w-md text-sm leading-6 text-white/70">
                            {isOnboardingComplete
                                ? goalReached ? 'Your readings are here whenever you want to look back at today.' : todaysReadingsCount > 0 ? 'Every reading adds a little more context to your day.' : 'Ready when you are. Start with a reading and build the picture from there.'
                                : 'Finish setting up your profile to make this space yours.'}
                        </p>
                    </div>
                    {isOnboardingComplete && <Link href="/glucose" className="group mt-7 inline-flex items-center gap-3 rounded-full bg-white py-2 pl-5 pr-2 text-sm font-semibold text-[#101b4b] transition hover:bg-[#e9edff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Log a reading <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#101b4b] text-white transition-transform group-hover:rotate-45"><FiArrowUpRight className="h-4 w-4" /></span></Link>}
                </div>

                {isOnboardingComplete && <div className="rounded-[22px] border border-white/15 bg-white/[0.08] p-5 backdrop-blur-sm sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#aebdff]">Today&apos;s readings</p>
                            <p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums">{todaysReadingsCount}<span className="ml-1 text-2xl font-normal text-white/45">/ {dailyGoal}</span></p>
                        </div>
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-[#c4d0ff]">{goalReached ? <FiCheck className="h-5 w-5" /> : <FiDroplet className="h-5 w-5" />}</span>
                    </div>
                    <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-label="Today's reading goal" aria-valuemin={0} aria-valuemax={dailyGoal} aria-valuenow={completed}>
                        <div className="h-full rounded-full bg-[#aebdff] transition-[width] duration-500" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-white/60">{goalReached ? 'Daily goal reached' : `${dailyGoal - completed} ${dailyGoal - completed === 1 ? 'reading' : 'readings'} to your daily goal`}</p>
                    <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/15 pt-5">
                        <div><p className="text-xs text-white/55">Recent average</p><p className="mt-1 text-lg font-semibold tabular-nums">{averageGlucose != null ? format(averageGlucose) : '—'} <span className="text-xs font-normal text-white/55">{averageGlucose != null ? label : ''}</span></p></div>
                        <div><p className="flex items-center gap-1 text-xs text-white/55"><FiTrendingUp className="h-3.5 w-3.5" /> Logging streak</p><p className="mt-1 text-lg font-semibold tabular-nums">{streak} <span className="text-xs font-normal text-white/55">{streak === 1 ? 'day' : 'days'}</span></p></div>
                    </div>
                </div>}
            </div>
        </section>
    );
}
