'use client';

import { useGlucoseUnit } from '@/hooks/useGlucoseUnit';

interface StatsGridProps {
    averageGlucose: number | null;
    inRangePercentage: number | null;
    minGlucose: number | null;
    maxGlucose: number | null;
    targetMin: number;
    targetMax: number;
}

export default function StatsGrid({ averageGlucose, inRangePercentage, minGlucose, maxGlucose, targetMin, targetMax }: StatsGridProps) {
    const { format, label, convert } = useGlucoseUnit();
    const hasData = averageGlucose != null || inRangePercentage != null || minGlucose != null || maxGlucose != null;

    if (!hasData) return <div className="rounded-[20px] border border-[#e3e7f0] bg-white px-5 py-5 dark:border-white/10 dark:bg-[#1a1a1a] sm:px-6"><p className="text-sm font-semibold text-[#101b4b] dark:text-white">Your 7-day overview</p><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your average and range will appear here once you have readings.</p></div>;

    const stats = [
        { label: 'Average', value: averageGlucose != null ? format(averageGlucose) : '—', unit: label },
        { label: 'In range', value: inRangePercentage != null ? `${inRangePercentage}%` : '—', unit: `${convert(targetMin)}–${convert(targetMax)} ${label}` },
        { label: 'Lowest', value: minGlucose != null ? format(minGlucose) : '—', unit: label },
        { label: 'Highest', value: maxGlucose != null ? format(maxGlucose) : '—', unit: label },
    ];

    return <section aria-label="Your last 7 days at a glance" className="overflow-hidden rounded-[20px] border border-[#e3e7f0] bg-white dark:border-white/10 dark:bg-[#1a1a1a]">
        <div className="border-b border-[#e9ecf4] px-5 py-4 dark:border-white/10 sm:px-6"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5365b2] dark:text-[#aebdff]">Last 7 days</p><h3 className="mt-1 text-lg font-semibold text-[#101b4b] dark:text-white">At a glance</h3></div>
        <dl className="grid grid-cols-2 divide-x divide-y divide-[#e9ecf4] dark:divide-white/10 lg:grid-cols-4 lg:divide-y-0">
            {stats.map(stat => <div key={stat.label} className="min-w-0 px-5 py-5 sm:px-6"><dt className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.label}</dt><dd className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-[#101b4b] dark:text-white">{stat.value}</dd><p className="mt-1 text-xs text-slate-400">{stat.unit}</p></div>)}
        </dl>
    </section>;
}
