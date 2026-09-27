'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import ArrowCircle from './ArrowCircle';
import api from '@/lib/api';

export default function NewsletterSection() {
    const [status, setStatus] = useState<'idle' | 'success' | 'already-subscribed' | 'error'>('idle');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const requestUpdates = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;
        const email = new FormData(form).get('email');
        if (typeof email !== 'string' || !email.trim()) return;

        setStatus('idle');
        setIsSubmitting(true);
        try {
            const result = await api.subscribeToNewsletter(email.trim());
            setStatus(result.alreadySubscribed ? 'already-subscribed' : 'success');
            if (!result.alreadySubscribed) form.reset();
        } catch {
            setStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section id="newsletter" aria-labelledby="newsletter-heading" className="bg-[#f4f6fc] py-20 text-[#172853] sm:py-24 lg:py-28">
            <div className="mx-auto grid max-w-360 gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,53fr)_minmax(0,47fr)] lg:items-end lg:gap-20 lg:px-10">
                <div>
                    <p className="text-xs font-bold tracking-[0.17em] text-[#1F2F98] sm:text-sm">STAY CLOSE TO THE MISSION</p>
                    <h2 id="newsletter-heading" className="mt-5 max-w-175 text-[clamp(2.65rem,4.8vw,5.3rem)] font-semibold leading-[1.1] tracking-[-0.055em]">Stories, resources and updates from Bluely.</h2>
                </div>
                <div className="lg:pb-2">
                    <form onSubmit={requestUpdates} className="flex items-center gap-3 border-b-2 border-[#172853] pb-2 focus-within:border-[#1F2F98]">
                        <label htmlFor="newsletter-email" className="sr-only">Your email address</label>
                        <input id="newsletter-email" name="email" type="email" autoComplete="email" required placeholder="Your email address" className="min-w-0 flex-1 bg-transparent py-3 text-base text-[#172853] outline-none placeholder:text-[#697794] sm:text-lg" />
                        <button type="submit" disabled={isSubmitting} className="group inline-flex shrink-0 items-center gap-2 py-1 text-sm font-bold text-[#1F2F98] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1F2F98] sm:gap-3 sm:text-base">{isSubmitting ? 'Joining...' : 'Join us'} <ArrowCircle tone="white" /></button>
                    </form>
                    <p className="mt-5 text-sm leading-[1.7] text-[#52617d]">No noise. Just meaningful updates from the Bluely community.</p>
                    <p className="mt-1 text-xs leading-[1.6] text-[#697794]">You can unsubscribe at any time by contacting the Bluely team.</p>
                    {status === 'success' && <p className="mt-4 text-sm font-semibold text-[#1d7a4a]" role="status">You&apos;re on the list. We&apos;ll keep the updates meaningful.</p>}
                    {status === 'already-subscribed' && <p className="mt-4 text-sm font-semibold text-[#1d7a4a]" role="status">This email is already receiving Bluely updates.</p>}
                    {status === 'error' && <p className="mt-4 text-sm font-semibold text-[#a32626]" role="alert">We couldn&apos;t add you right now. Please try again.</p>}
                    <p className="mt-1 text-xs leading-[1.6] text-[#697794]">Read our <Link href="/privacy" className="font-semibold underline underline-offset-2 hover:text-[#1F2F98]">Privacy Policy</Link>.</p>
                </div>
            </div>
        </section>
    );
}
