'use client';

import Link from 'next/link';
import { FiActivity, FiArrowUpRight, FiDroplet, FiLock, FiSmile } from 'react-icons/fi';
import { IoFastFoodOutline } from 'react-icons/io5';

const actions = [
    { label: 'Glucose', detail: 'Add a reading', href: '/glucose', icon: FiDroplet },
    { label: 'Mood', detail: 'Note how you feel', href: '/mood', icon: FiSmile },
    { label: 'Meals', detail: 'Remember what you ate', href: '/meals', icon: IoFastFoodOutline },
    { label: 'Activity', detail: 'Record movement', href: '/activity', icon: FiActivity },
];

export default function QuickActionsGrid({ emailVerified = true }: { emailVerified?: boolean }) {
    return (
        <section aria-labelledby="daily-actions-title" className="overflow-hidden rounded-[24px] border border-[#e3e7f0] bg-white shadow-[0_8px_30px_rgba(16,27,75,0.035)] dark:border-white/10 dark:bg-[#1a1a1a]">
            <div className="flex flex-col gap-2 border-b border-[#e3e7f0] px-5 py-5 dark:border-white/10 sm:flex-row sm:items-end sm:justify-between sm:px-7">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5365b2] dark:text-[#aebdff]">Your day</p>
                    <h2 id="daily-actions-title" className="mt-1 text-xl font-semibold tracking-tight text-[#101b4b] dark:text-white sm:text-2xl">Add to your day</h2>
                </div>
                <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">The details around your readings help you see the fuller picture.</p>
            </div>

            <div className="grid sm:grid-cols-2">
                {actions.map((action, index) => {
                    const Icon = action.icon;
                    const itemClass = `group flex min-h-24 items-center gap-4 px-5 py-5 transition-colors sm:px-7 ${index > 0 ? 'border-t border-[#e3e7f0] dark:border-white/10' : ''} ${index === 1 ? 'sm:border-t-0' : ''} ${index % 2 === 1 ? 'sm:border-l sm:border-[#e3e7f0] dark:sm:border-white/10' : ''} ${emailVerified ? 'hover:bg-[#f6f8ff] dark:hover:bg-white/5' : 'cursor-not-allowed opacity-50'}`;
                    const content = <>
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#dfe4f3] bg-[#f4f6fd] text-[#1F2F98] dark:border-white/10 dark:bg-white/5 dark:text-[#aebdff]"><Icon className="h-5 w-5" /></span>
                        <span className="min-w-0 flex-1"><span className="block text-base font-semibold text-[#17214e] dark:text-white">{action.label}</span><span className="mt-0.5 block text-sm text-slate-500 dark:text-slate-400">{action.detail}</span></span>
                        {emailVerified ? <FiArrowUpRight className="h-5 w-5 shrink-0 text-[#7380ae] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 dark:text-[#aebdff]" /> : <FiLock className="h-4 w-4 shrink-0 text-slate-400" />}
                    </>;
                    return emailVerified
                        ? <Link key={action.href} href={action.href} className={itemClass} aria-label={`Log ${action.label.toLowerCase()}: ${action.detail}`}>{content}</Link>
                        : <div key={action.href} className={itemClass} title="Verify your email to unlock">{content}</div>;
                })}
            </div>
        </section>
    );
}
