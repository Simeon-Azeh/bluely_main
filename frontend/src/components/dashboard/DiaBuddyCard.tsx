'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { FiArrowUpRight, FiRefreshCw } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

export default function DiaBuddyCard({ compact = false }: { compact?: boolean }) {
    const { user } = useAuth();
    const [summary, setSummary] = useState('');
    const [displayedText, setDisplayedText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRevealing, setIsRevealing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const requestId = useRef(0);

    useEffect(() => {
        if (!summary) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        let offset = 0;
        const timer = window.setInterval(() => {
            offset = Math.min(offset + 5, summary.length);
            setDisplayedText(summary.slice(0, offset));
            if (offset === summary.length) {
                window.clearInterval(timer);
                setIsRevealing(false);
            }
        }, 22);
        return () => window.clearInterval(timer);
    }, [summary]);

    const handleGenerate = async () => {
        if (!user || isLoading) return;
        const currentRequest = ++requestId.current;
        setIsLoading(true);
        setError(null);
        setSummary('');
        setDisplayedText('');
        setIsRevealing(false);
        try {
            const result = await api.getDiaBuddySummary(user.uid);
            if (currentRequest !== requestId.current) return;
            setSummary(result.summary);
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                setDisplayedText(result.summary);
            } else {
                setIsRevealing(true);
            }
        } catch (caught) {
            if (currentRequest !== requestId.current) return;
            console.error('DiaBuddy summary error:', caught);
            setError('We could not prepare your summary right now. Please try again.');
        } finally {
            if (currentRequest === requestId.current) setIsLoading(false);
        }
    };

    return (
        <section aria-labelledby="diabuddy-summary-title" className={`overflow-hidden rounded-[20px] border border-[#e3e7f0] bg-white dark:border-white/10 dark:bg-[#1a1a1a] ${compact ? 'p-5' : 'p-6'}`}>
            <div className="flex items-center gap-3 border-b border-[#e9ecf4] pb-4 dark:border-white/10">
                <Image src="/diabuddy.png" alt="" width={42} height={42} className="h-10 w-10 rounded-full object-cover ring-2 ring-[#e5e9f8]" />
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5365b2] dark:text-[#aebdff]">From your logged data</p>
                    <h3 id="diabuddy-summary-title" className="text-lg font-semibold text-[#101b4b] dark:text-white">DiaBuddy summary</h3>
                </div>
            </div>

            {isLoading ? <div role="status" aria-live="polite" className="py-6">
                <div className="flex items-center gap-2 text-sm font-medium text-[#101b4b] dark:text-white"><span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7386e2] opacity-60 motion-reduce:animate-none" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#1F2F98]" /></span>Preparing your summary</div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Looking at the readings you have logged.</p>
                <div aria-hidden="true" className="mt-5 space-y-2.5 animate-pulse motion-reduce:animate-none"><div className="h-2.5 w-full rounded-full bg-[#edf0f8] dark:bg-white/10" /><div className="h-2.5 w-11/12 rounded-full bg-[#edf0f8] dark:bg-white/10" /><div className="h-2.5 w-8/12 rounded-full bg-[#edf0f8] dark:bg-white/10" /></div>
            </div> : summary ? <div className="pt-5">
                <p className="whitespace-pre-wrap text-sm leading-7 text-[#34405c] dark:text-gray-200" aria-label={summary}>{displayedText}<span aria-hidden="true" className={`ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 bg-[#1F2F98] motion-reduce:hidden ${isRevealing ? 'animate-pulse' : 'hidden'}`} /></p>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#e9ecf4] pt-4 dark:border-white/10">
                    <p className="max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">For information only. Use your glucose readings and care team for health decisions.</p>
                    <button type="button" onClick={handleGenerate} disabled={isRevealing} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1F2F98] hover:underline disabled:opacity-50 dark:text-[#aebdff]"><FiRefreshCw className="h-4 w-4" /> Refresh summary</button>
                </div>
            </div> : <div className="py-6">
                <p className="max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">See a short summary of the patterns in your logged readings. If you are just getting started, DiaBuddy will tell you what it needs.</p>
                {error && <p role="alert" className="mt-3 text-sm text-rose-700 dark:text-rose-300">{error}</p>}
                <button type="button" onClick={handleGenerate} className="group mt-5 inline-flex items-center gap-2 rounded-full bg-[#1F2F98] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#17257d]">{error ? 'Try again' : 'Generate summary'} <FiArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></button>
            </div>}
        </section>
    );
}
