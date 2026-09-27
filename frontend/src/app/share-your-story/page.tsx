'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FormEvent, useRef, useState } from 'react';
import { FiArrowLeft, FiArrowRight, FiCheck, FiSend } from 'react-icons/fi';
import { Header } from '@/components/landing';
import api from '@/lib/api';

const fieldClass = 'mt-2 w-full rounded-xl border border-[#cbd5ec] bg-white px-4 py-3.5 text-[#172853] outline-none transition focus:border-[#1F2F98] focus:ring-2 focus:ring-[#1F2F98]/15';

const countries = [
    ['CM', 'Cameroon', '+237'], ['NG', 'Nigeria', '+234'], ['GH', 'Ghana', '+233'], ['KE', 'Kenya', '+254'],
    ['ZA', 'South Africa', '+27'], ['UG', 'Uganda', '+256'], ['TZ', 'Tanzania', '+255'], ['RW', 'Rwanda', '+250'],
    ['ET', 'Ethiopia', '+251'], ['CI', "Cote d'Ivoire", '+225'], ['SN', 'Senegal', '+221'], ['EG', 'Egypt', '+20'],
    ['GB', 'United Kingdom', '+44'], ['US', 'United States', '+1'], ['CA', 'Canada', '+1'], ['AU', 'Australia', '+61'],
    ['FR', 'France', '+33'], ['DE', 'Germany', '+49'], ['IN', 'India', '+91'], ['AE', 'United Arab Emirates', '+971'],
] as const;

const storyPrompts = [
    ['My diagnosis', 'What do you remember about being diagnosed?'],
    ['School & friends', 'How has diabetes affected school, friendships or everyday life?'],
    ['A difficult moment', 'What is something difficult about diabetes that people do not often see?'],
    ["Something I've learned", 'What has living with diabetes taught you?'],
    ['What I wish people knew', 'What is one thing you wish more people understood about diabetes?'],
] as const;

export default function ShareYourStoryPage() {
    const [submittedName, setSubmittedName] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const storyRef = useRef<HTMLTextAreaElement>(null);

    function addStoryPrompt(prompt: string) {
        const storyField = storyRef.current;
        if (!storyField || storyField.value.trim()) return;
        storyField.value = prompt + ' ';
        storyField.focus();
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);
        const form = new FormData(event.currentTarget);
        const name = String(form.get('name') || '').trim();
        const phone = String(form.get('phone') || '').trim();
        const countryCode = String(form.get('countryCode') || '');

        try {
            await api.submitStory({
                name,
                email: String(form.get('email') || '').trim(),
                phone: phone ? `${countryCode} ${phone}`.trim() : undefined,
                location: String(form.get('location') || '').trim(),
                diabetesType: String(form.get('diabetesType') || ''),
                diagnosisYear: form.get('diagnosisYear') ? Number(form.get('diagnosisYear')) : undefined,
                story: String(form.get('story') || '').trim(),
                permissionToContact: form.get('permissionToContact') === 'on',
            });
            setSubmittedName(name);
            setSelectedCountry('');
            event.currentTarget.reset();
        } catch (submissionError) {
            setError(submissionError instanceof Error ? submissionError.message : 'We could not send your story. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#eef2fa] text-[#172853]">
            <Header />
            <main className="mx-auto max-w-360 px-5 pb-24 pt-8 sm:px-8 sm:pt-14 lg:px-10 lg:pt-20">
                <Link href="/#share-your-story" className="inline-flex items-center gap-2 text-sm font-bold text-[#1F2F98] transition-colors hover:text-[#17257d] focus-visible:outline-2 focus-visible:outline-[#1F2F98]"><FiArrowLeft aria-hidden="true" /> Back to Bluely</Link>

                <section className="relative mt-10 overflow-hidden bg-[#132653] text-white sm:mt-14 lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                    <div className="relative min-h-125 overflow-hidden px-6 pb-12 pt-12 sm:px-10 sm:pt-16 lg:min-h-157.5 lg:px-14 lg:pb-16 lg:pt-20">
                        <div className="absolute -right-16 top-10 h-64 w-64 rounded-full border border-[#8fa8ee]/25" aria-hidden="true" />
                        <div className="absolute -right-5 top-24 h-40 w-40 rounded-full border border-[#8fa8ee]/20" aria-hidden="true" />
                        <div className="relative z-10 max-w-155">
                            <p className="text-xs font-bold tracking-[0.2em] text-[#aebfff] sm:text-sm">YOUR EXPERIENCE MATTERS</p>
                            <h1 className="mt-6 max-w-147.5 text-[clamp(3.4rem,6vw,6.9rem)] font-semibold leading-[0.96] tracking-[-0.065em]">Your story is more <span className="text-[#9db4ff]">than numbers.</span></h1>
                            <p className="mt-8 max-w-120 text-base leading-8 text-[#d8e0f4] sm:text-lg">The difficult days. The small wins. The things you wish someone had understood. Your experience could help another young person living with diabetes feel seen.</p>
                            <div className="mt-12 border-l-2 border-[#8fa8ee] pl-5">
                                <p className="text-xs font-bold tracking-[0.18em] text-[#c5d1f5]">YOUR STORY · YOUR VOICE · YOUR CHOICE</p>
                                <p className="mt-3 max-w-97.5 text-sm leading-6 text-[#aebbd9]">Share only what feels comfortable. Your story will not be published automatically.</p>
                            </div>
                        </div>
                        <div className="absolute bottom-8 left-6 hidden items-end gap-4 sm:left-10 sm:flex lg:left-14" aria-hidden="true">
                            <span className="text-[5rem] font-semibold leading-none tracking-[-0.08em] text-[#263d76]">01</span>
                            <span className="mb-2 block h-px w-24 bg-[#637cb9]" />
                            <span className="mb-1 text-xs font-bold tracking-[0.16em] text-[#8fa8ee]">A SPACE TO BE HEARD</span>
                        </div>
                    </div>
                    <div className="relative min-h-75 overflow-hidden bg-[#263d76] lg:min-h-full">
                        <Image src="/images/story-reflection.png" alt="A young person in a quiet moment of reflection" fill sizes="(max-width: 1023px) 100vw, 50vw" className="object-cover object-center opacity-90" priority />
                        <div className="absolute inset-0 bg-linear-to-t from-[#132653]/80 via-transparent to-[#132653]/10" />
                        <p className="absolute bottom-7 left-6 max-w-60 text-sm font-semibold leading-6 text-white sm:left-10 sm:bottom-10">There is room here for the parts of diabetes people do not always see.</p>
                    </div>
                </section>

                {submittedName ? (
                    <section className="mt-8 bg-white px-6 py-12 sm:px-12 sm:py-16 lg:ml-[12%] lg:mr-[8%] lg:px-20" aria-live="polite">
                        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
                            <div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e5f4ec] text-[#1d7a4a]"><FiCheck className="h-6 w-6" aria-hidden="true" /></div>
                                <p className="mt-8 text-xs font-bold tracking-[0.18em] text-[#1F2F98]">THANK YOU, {submittedName.toUpperCase()}</p>
                                <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.05em] sm:text-5xl">Your story is with us.</h2>
                                <p className="mt-5 text-base leading-7 text-[#52617d]">Thank you for trusting Bluely with a part of your experience.</p>
                            </div>
                            <div className="border-t border-[#dbe3f3] pt-6">
                                <p className="text-xs font-bold tracking-[0.18em] text-[#1F2F98]">WHAT HAPPENS NEXT?</p>
                                <ol className="mt-7 space-y-6">
                                    {['Our team reads your story', 'We contact you', 'You decide what happens next'].map((step, index) => <li key={step} className="flex items-center gap-5"><span className="text-2xl font-semibold text-[#9aa9c9]">0{index + 1}</span><span className="h-px w-8 bg-[#b4c1dd]" /><span className="font-semibold text-[#26375f]">{step}</span></li>)}
                                </ol>
                                <p className="mt-8 text-sm font-semibold text-[#52617d]">Nothing is published without your permission.</p>
                                <Link href="/" className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#1F2F98] px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#17257d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1F2F98]">Return home <FiArrowRight aria-hidden="true" /></Link>
                                <p className="mt-8 text-sm italic text-[#7482a0]">Someone out there may need a story like yours.</p>
                            </div>
                        </div>
                    </section>
                ) : (
                    <form onSubmit={handleSubmit} className="relative mt-8 bg-white px-6 py-10 sm:px-10 sm:py-14 lg:ml-[8%] lg:mr-[4%] lg:px-16 lg:py-16">
                        <div className="absolute right-8 top-8 hidden text-right lg:block"><span className="block text-[5rem] font-semibold leading-none tracking-[-0.08em] text-[#edf1fa]">02</span><span className="text-[10px] font-bold tracking-[0.18em] text-[#8293ba]">YOUR STORY, IN YOUR WORDS</span></div>
                        <div className="max-w-220">
                            <section aria-labelledby="about-you-heading">
                                <div className="flex items-baseline gap-4 border-b border-[#dbe3f3] pb-4"><span className="text-sm font-bold tracking-[0.15em] text-[#1F2F98]">01</span><h2 id="about-you-heading" className="text-2xl font-semibold tracking-[-0.035em]">About you</h2></div>
                                <div className="mt-7 grid gap-6 sm:grid-cols-2">
                                    <label className="text-sm font-bold text-[#26375f]">Your name *<input name="name" required maxLength={120} className={fieldClass} /></label>
                                    <label className="text-sm font-bold text-[#26375f]">Email address *<input name="email" type="email" required maxLength={254} className={fieldClass} /></label>
                                    <div className="sm:col-span-2">
                                        <p className="text-sm font-bold text-[#26375f]">Phone or WhatsApp <span className="font-normal text-[#647396]">(optional)</span></p>
                                        <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                                            <label className="sr-only" htmlFor="country">Country</label>
                                            <select id="country" name="country" value={selectedCountry} onChange={(event) => setSelectedCountry(event.target.value)} className={fieldClass}><option value="">Select your country</option>{countries.map(([code, country, dialCode]) => <option key={code} value={code}>{country} ({dialCode})</option>)}</select>
                                            <label className="flex items-center rounded-xl border border-[#cbd5ec] bg-white px-4 text-[#172853] focus-within:border-[#1F2F98] focus-within:ring-2 focus-within:ring-[#1F2F98]/15"><span className="shrink-0 border-r border-[#dbe3f3] pr-3 text-sm font-bold text-[#1F2F98]">{countries.find(([code]) => code === selectedCountry)?.[2] || '+ code'}</span><input name="phone" type="tel" inputMode="tel" maxLength={24} placeholder={selectedCountry ? 'Your local number' : 'Choose a country first'} disabled={!selectedCountry} className="min-w-0 flex-1 bg-transparent px-3 py-3.5 text-[#172853] outline-none placeholder:text-[#8b98b2] disabled:cursor-not-allowed disabled:opacity-60" /></label>
                                        </div>
                                        <input type="hidden" name="countryCode" value={countries.find(([code]) => code === selectedCountry)?.[2] || ''} />
                                        <p className="mt-2 text-xs font-normal text-[#647396]">Select your country first so we can format your number correctly.</p>
                                    </div>
                                    <label className="text-sm font-bold text-[#26375f] sm:col-span-2">Where are you based? *<input name="location" required maxLength={160} placeholder="City and country" className={fieldClass} /></label>
                                </div>
                            </section>

                            <section className="mt-14" aria-labelledby="experience-heading">
                                <div className="flex items-baseline gap-4 border-b border-[#dbe3f3] pb-4"><span className="text-sm font-bold tracking-[0.15em] text-[#1F2F98]">02</span><h2 id="experience-heading" className="text-2xl font-semibold tracking-[-0.035em]">Your experience</h2></div>
                                <div className="mt-7 grid gap-6 sm:grid-cols-2"><label className="text-sm font-bold text-[#26375f]">What type of diabetes do you live with? *<select name="diabetesType" required defaultValue="" className={fieldClass}><option value="" disabled>Select one</option><option value="type1">Type 1</option><option value="type2">Type 2</option><option value="gestational">Gestational diabetes</option><option value="prediabetes">Prediabetes</option><option value="other">Another type</option><option value="prefer_not_to_say">Prefer not to say</option></select></label><label className="text-sm font-bold text-[#26375f]">When were you diagnosed? <span className="font-normal text-[#647396]">(optional)</span><input name="diagnosisYear" type="number" min="1900" max={new Date().getFullYear()} placeholder="Year" className={fieldClass} /></label></div>
                            </section>

                            <section className="mt-14" aria-labelledby="story-heading">
                                <div className="flex items-baseline gap-4 border-b border-[#dbe3f3] pb-4"><span className="text-sm font-bold tracking-[0.15em] text-[#1F2F98]">03</span><h2 id="story-heading" className="text-2xl font-semibold tracking-[-0.035em]">Your story</h2></div>
                                <label className="mt-7 block text-sm font-bold text-[#26375f]" htmlFor="story">What would you like to share? *<textarea ref={storyRef} id="story" name="story" required minLength={20} maxLength={10000} rows={9} placeholder="Start wherever feels natural..." className={`${fieldClass} mt-3 resize-y text-base leading-7`} /></label>
                                <div className="mt-5"><p className="text-xs font-bold tracking-[0.16em] text-[#647396]">NOT SURE WHERE TO START?</p><div className="mt-3 flex gap-2 overflow-x-auto pb-2" aria-label="Optional writing prompts">{storyPrompts.map(([label, prompt]) => <button key={label} type="button" onClick={() => addStoryPrompt(prompt)} className="shrink-0 rounded-full border border-[#cbd5ec] px-4 py-2 text-xs font-semibold text-[#52617d] transition-colors hover:border-[#1F2F98] hover:text-[#1F2F98] focus-visible:outline-2 focus-visible:outline-[#1F2F98]">{label}</button>)}</div></div>
                            </section>

                            <section className="mt-14 border-t-2 border-[#1F2F98] pt-6" aria-labelledby="before-send-heading">
                                <p className="text-xs font-bold tracking-[0.16em] text-[#1F2F98]">BEFORE YOU SEND</p><h2 id="before-send-heading" className="mt-3 text-2xl font-semibold tracking-[-0.035em]">Your story stays yours.</h2><p className="mt-3 max-w-170 text-sm leading-6 text-[#52617d]">Submitting your story does not automatically publish it. If Bluely would like to feature your experience, our team will contact you first to discuss what you are comfortable sharing.</p>
                                {/* TODO: Define age and guardian consent policy/UX before public launch because Bluely may collect stories from teenagers. */}
                                <label className="mt-6 flex items-start gap-3 text-sm leading-6 text-[#52617d]"><input name="permissionToContact" type="checkbox" required className="mt-1 h-4 w-4 accent-[#1F2F98]" /><span>I am happy for a member of the Bluely team to contact me about my story. *</span></label>
                                <p className="mt-4 text-xs leading-5 text-[#647396]">Please do not include urgent medical information. Nothing is published automatically.</p>
                            </section>

                            {error && <p className="mt-7 border-l-2 border-[#a32626] bg-[#fff5f5] px-4 py-3 text-sm text-[#a32626]" role="alert">{error}</p>}
                            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4"><button type="submit" disabled={isSubmitting} className="inline-flex min-h-14 items-center gap-4 rounded-full bg-[#1F2F98] px-7 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#17257d] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1F2F98]">{isSubmitting ? 'Sending...' : 'Send My Story'} <FiSend aria-hidden="true" /></button><span className="text-xs font-semibold text-[#647396]">Nothing is published automatically.</span></div>
                        </div>
                    </form>
                )}
            </main>
        </div>
    );
}
