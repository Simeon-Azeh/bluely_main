'use client';

import type { FormEvent } from 'react';
import Link from 'next/link';
import { useState } from 'react';
import { FiArrowLeft, FiCheck, FiSend } from 'react-icons/fi';
import { Footer, Header } from '@/components/landing';
import api from '@/lib/api';

const inputClass = 'mt-2 w-full rounded-xl border border-[#cbd5ec] bg-white px-4 py-3.5 text-[#172853] outline-none transition focus:border-[#1F2F98] focus:ring-2 focus:ring-[#1F2F98]/15';

export default function VolunteerPage() {
    const [sent, setSent] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setSending(true);
        setError('');
        try {
            await api.submitVolunteerApplication({ name: String(form.get('name') || ''), email: String(form.get('email') || ''), location: String(form.get('location') || ''), interests: String(form.get('interests') || ''), availability: String(form.get('availability') || '') || undefined, experience: String(form.get('experience') || '') || undefined });
            setSent(true);
            event.currentTarget.reset();
        } catch (submissionError) {
            setError(submissionError instanceof Error ? submissionError.message : 'We could not send your application. Please try again.');
        } finally {
            setSending(false);
        }
    }

    return <div className="min-h-screen bg-[#f6f8ff] text-[#172853]"><Header /><main className="mx-auto max-w-360 px-5 pb-24 pt-10 sm:px-8 sm:pt-16 lg:px-10"><Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#1F2F98] hover:text-[#17257d] focus-visible:outline-2 focus-visible:outline-[#1F2F98]"><FiArrowLeft aria-hidden="true" /> Back to Bluely</Link><section className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-20"><div><p className="text-xs font-bold tracking-[0.18em] text-[#1F2F98] sm:text-sm">JOIN THE WORK</p><h1 className="mt-5 max-w-155 text-[clamp(3rem,5.8vw,6.4rem)] font-semibold leading-[1.02] tracking-[-0.065em]">Bring your skills to a mission with room to grow.</h1><p className="mt-7 max-w-130 text-lg leading-8 text-[#52617d]">We are building a thoughtful team around diabetes, technology, education and community. Tell us what you care about and how you would like to contribute.</p><div className="mt-10 grid gap-4 border-t border-[#cbd5ed] pt-5 text-sm font-semibold text-[#52617d] sm:grid-cols-3"><span>Health</span><span>Technology</span><span>Community</span></div></div>{sent ? <section className="bg-[#132653] p-8 text-white sm:p-12" aria-live="polite"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#dff2e7] text-[#1d7a4a]"><FiCheck className="h-6 w-6" aria-hidden="true" /></div><p className="mt-8 text-xs font-bold tracking-[0.18em] text-[#b9cbff]">APPLICATION RECEIVED</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em]">Thank you for stepping forward.</h2><p className="mt-5 max-w-120 text-base leading-7 text-[#d6def2]">We&apos;ll read through your application and reach out if there is a meaningful way to work together.</p><Link href="/" className="mt-8 inline-flex items-center gap-3 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-[#1F2F98] hover:bg-[#e9edfc] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Return home</Link></section> : <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-10 lg:p-14"><div className="grid gap-6 sm:grid-cols-2"><label className="text-sm font-bold">Your name *<input name="name" required maxLength={120} className={inputClass} /></label><label className="text-sm font-bold">Email address *<input name="email" type="email" required maxLength={254} className={inputClass} /></label><label className="text-sm font-bold sm:col-span-2">Where are you based? *<input name="location" required maxLength={160} placeholder="City and country" className={inputClass} /></label><label className="text-sm font-bold sm:col-span-2">How would you like to help? *<textarea name="interests" required minLength={10} maxLength={2000} rows={4} placeholder="Tell us about the skills, interests or perspective you would bring..." className={`${inputClass} resize-y leading-7`} /></label><label className="text-sm font-bold">Availability <span className="font-normal text-[#647396]">(optional)</span><input name="availability" maxLength={160} placeholder="For example, a few hours each month" className={inputClass} /></label><label className="text-sm font-bold">Relevant experience <span className="font-normal text-[#647396]">(optional)</span><input name="experience" maxLength={240} placeholder="Work, study or lived experience" className={inputClass} /></label></div>{error && <p className="mt-5 border-l-2 border-[#a32626] bg-[#fff5f5] px-4 py-3 text-sm text-[#a32626]" role="alert">{error}</p>}<button type="submit" disabled={sending} className="mt-8 inline-flex min-h-13 items-center gap-3 rounded-full bg-[#1F2F98] px-6 py-3 text-sm font-bold text-white hover:bg-[#17257d] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1F2F98]">{sending ? 'Sending...' : 'Send my application'} <FiSend aria-hidden="true" /></button><p className="mt-5 text-xs leading-5 text-[#647396]">Please do not include urgent medical information in this form.</p></form>}</section></main><Footer /></div>;
}
