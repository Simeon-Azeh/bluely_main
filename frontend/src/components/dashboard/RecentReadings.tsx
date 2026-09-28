'use client';

import Link from 'next/link';
import { FiArrowRight, FiArrowUpRight, FiDroplet, FiPlus } from 'react-icons/fi';
import { format, isToday, isYesterday } from 'date-fns';
import { useGlucoseUnit } from '@/hooks/useGlucoseUnit';

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

function readingTime(value: string) {
    const date = new Date(value);
    if (isToday(date)) return `Today · ${format(date, 'h:mm a')}`;
    if (isYesterday(date)) return `Yesterday · ${format(date, 'h:mm a')}`;
    return format(date, 'MMM d · h:mm a');
}

export default function RecentReadings({ readings, targetMin, targetMax }: RecentReadingsProps) {
    const { format: formatGlucose, label } = useGlucoseUnit();
    const latest = readings.slice(0, 5);

    return (
        <section aria-labelledby="recent-readings-title" className="overflow-hidden rounded-[24px] border border-[#e3e7f0] bg-white shadow-[0_8px_30px_rgba(16,27,75,0.035)] dark:border-white/10 dark:bg-[#1a1a1a]">
            <div className="flex items-start justify-between gap-4 border-b border-[#e3e7f0] px-5 py-5 dark:border-white/10 sm:items-center sm:px-7">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5365b2] dark:text-[#aebdff]">Your history</p>
                    <h2 id="recent-readings-title" className="mt-1 text-xl font-semibold tracking-tight text-[#101b4b] dark:text-white sm:text-2xl">Recent readings</h2>
                </div>
                {latest.length > 0 && <Link href="/history" className="group inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-sm font-medium text-[#1F2F98] hover:bg-[#f2f4ff] dark:text-[#aebdff] dark:hover:bg-white/10">View history <FiArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Link>}
            </div>

            {latest.length > 0 ? (
                <div className="px-5 sm:px-7">
                    <ol className="divide-y divide-[#edf0f5] dark:divide-white/10">
                        {latest.map(reading => {
                            const range = reading.value < targetMin ? 'Below range' : reading.value > targetMax ? 'Above range' : 'In range';
                            const tone = reading.value < targetMin ? 'text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-500/10' : reading.value > targetMax ? 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-500/10' : 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-500/10';
                            return <li key={reading._id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4 sm:flex-nowrap sm:py-5">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f3f5ff] text-[#1F2F98] dark:bg-white/10 dark:text-[#aebdff]"><FiDroplet className="h-4 w-4" /></span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium capitalize text-[#17214e] dark:text-white">{reading.readingType.replaceAll('_', ' ')}</p>
                                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{readingTime(reading.recordedAt)}</p>
                                    {reading.notes && <p className="mt-1 max-w-md truncate text-xs text-slate-500 dark:text-slate-400" title={reading.notes}>{reading.notes}</p>}
                                </div>
                                <div className="ml-13 flex w-full items-center justify-between gap-3 sm:ml-0 sm:w-auto sm:justify-end">
                                    <span className={`order-2 rounded-full px-2.5 py-1 text-[11px] font-medium sm:order-1 ${tone}`}>{range}</span>
                                    <span className="order-1 min-w-20 text-right text-lg font-semibold tabular-nums text-[#101b4b] dark:text-white sm:order-2">{formatGlucose(reading.value)} <span className="text-xs font-normal text-slate-500">{label}</span></span>
                                </div>
                            </li>;
                        })}
                    </ol>
                    <div className="border-t border-[#edf0f5] py-4 dark:border-white/10"><Link href="/glucose" className="inline-flex items-center gap-2 text-sm font-semibold text-[#1F2F98] hover:underline dark:text-[#aebdff]"><FiPlus className="h-4 w-4" /> Add another reading</Link></div>
                </div>
            ) : (
                <div className="grid gap-6 px-5 py-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-7 sm:py-9">
                    <div className="flex items-start gap-4">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f3f5ff] text-[#1F2F98] dark:bg-white/10 dark:text-[#aebdff]"><FiDroplet className="h-5 w-5" /></span>
                        <div><h3 className="font-semibold text-[#101b4b] dark:text-white">A place for your readings</h3><p className="mt-1 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">When you log a glucose reading, it will appear here with its time and context.</p></div>
                    </div>
                    <Link href="/glucose" className="group inline-flex w-fit items-center gap-2 rounded-full border border-[#d7def4] px-4 py-2.5 text-sm font-semibold text-[#1F2F98] transition-colors hover:bg-[#f3f5ff] dark:border-white/15 dark:text-[#aebdff] dark:hover:bg-white/10">Log a reading <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
                </div>
            )}
        </section>
    );
}
