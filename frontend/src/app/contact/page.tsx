'use client';

import type { FormEvent } from 'react';
import Link from 'next/link';
import { useState } from 'react';
import { FiArrowLeft, FiCheck, FiSend } from 'react-icons/fi';
import { Footer, Header } from '@/components/landing';
import api from '@/lib/api';

const inputClass = 'mt-2 w-full rounded-xl border border-[#cbd5ec] bg-white px-4 py-3.5 text-[#172853] outline-none transition focus:border-[#1F2F98] focus:ring-2 focus:ring-[#1F2F98]/15';

export default function ContactPage() {
    const [sent, setSent] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setSending(true);
        setError('');
        try {
            await api.submitContactMessage({ name: String(form.get('name') || ''), email: String(form.get('email') || ''), topic: String(form.get('topic') || ''), message: String(form.get('message') || '') });
            setSent(true);
            event.currentTarget.reset();
        } catch (submissionError) {
            setError(submissionError instanceof Error ? submissionError.message : 'We could not send your message. Please try again.');
        } finally {
            setSending(false);
        }
    }

    return <div className="min-h-screen bg-[#f6f8ff] text-[#172853]"><Header /><main className="mx-auto max-w-360 px-5 pb-24 pt-10 sm:px-8 sm:pt-16 lg:px-10"><Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#1F2F98] hover:text-[#17257d] focus-visible:outline-2 focus-visible:outline-[#1F2F98]"><FiArrowLeft aria-hidden="true" /> Back to Bluely</Link><section className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20"><div><p className="text-xs font-bold tracking-[0.18em] text-[#1F2F98] sm:text-sm">LET&apos;S TALK</p><h1 className="mt-5 max-w-155 text-[clamp(3rem,5.8vw,6.4rem)] font-semibold leading-[1.02] tracking-[-0.065em]">Bring us a question, an idea or a hello.</h1><p className="mt-7 max-w-130 text-lg leading-8 text-[#52617d]">Whether you are curious about Bluely, interested in working together or need help finding the right place to start, we&apos;d like to hear from you.</p><div className="mt-10 border-l-2 border-[#8293da] pl-5 text-sm leading-7 text-[#52617d]"><p className="font-bold tracking-[0.12em] text-[#1F2F98]">A HUMAN INBOX</p><p className="mt-2">Your message goes to the Bluely team. Please do not include urgent medical information.</p></div></div>{sent ? <section className="bg-[#132653] p-8 text-white sm:p-12" aria-live="polite"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#dff2e7] text-[#1d7a4a]"><FiCheck className="h-6 w-6" aria-hidden="true" /></div><p className="mt-8 text-xs font-bold tracking-[0.18em] text-[#b9cbff]">MESSAGE RECEIVED</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em]">Thank you for reaching out.</h2><p className="mt-5 max-w-120 text-base leading-7 text-[#d6def2]">A member of the Bluely team will read your message and get back to you as soon as we can.</p><Link href="/" className="mt-8 inline-flex items-center gap-3 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-[#1F2F98] hover:bg-[#e9edfc] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Return home</Link></section> : <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-10 lg:p-14"><div className="grid gap-6 sm:grid-cols-2"><label className="text-sm font-bold">Your name *<input name="name" required maxLength={120} className={inputClass} /></label><label className="text-sm font-bold">Email address *<input name="email" type="email" required maxLength={254} className={inputClass} /></label><label className="text-sm font-bold sm:col-span-2">What can we help with? *<select name="topic" required defaultValue="" className={inputClass}><option value="" disabled>Select a topic</option><option value="general">A general question</option><option value="partnership">Partnerships</option><option value="press">Press or media</option><option value="privacy">Privacy and data</option><option value="support">App support</option></select></label></div><label className="mt-6 block text-sm font-bold">Your message *<textarea name="message" required minLength={10} maxLength={5000} rows={8} placeholder="Write to us..." className={`${inputClass} resize-y leading-7`} /></label>{error && <p className="mt-5 border-l-2 border-[#a32626] bg-[#fff5f5] px-4 py-3 text-sm text-[#a32626]" role="alert">{error}</p>}<button type="submit" disabled={sending} className="mt-8 inline-flex min-h-13 items-center gap-3 rounded-full bg-[#1F2F98] px-6 py-3 text-sm font-bold text-white hover:bg-[#17257d] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1F2F98]">{sending ? 'Sending...' : 'Send message'} <FiSend aria-hidden="true" /></button></form>}</section></main><Footer /></div>;
}
