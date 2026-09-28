'use client';

import type { FormEvent } from 'react';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiArrowLeft, FiLock, FiMail } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminLoginPage() {
    const { signIn } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(searchParams.get('error') === 'unauthorized' ? 'This account does not have admin access.' : '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            await signIn(email, password);
            router.push('/admin/verifying');
        } catch {
            setError('We could not verify those credentials. Please try again.');
            setIsSubmitting(false);
        }
    }

    return <div className="flex min-h-screen bg-[#132653] text-white"><div className="hidden flex-1 flex-col justify-between p-12 lg:flex"><Link href="/" className="text-4xl font-semibold tracking-[-0.08em]">BLUELY</Link><div><p className="text-xs font-bold tracking-[0.18em] text-[#b9cbff]">PRIVATE WORKSPACE</p><h1 className="mt-5 max-w-[620px] text-6xl font-semibold leading-[0.98] tracking-[-0.065em]">Careful work deserves a careful space.</h1><p className="mt-7 max-w-[480px] text-lg leading-8 text-[#d6def2]">Review stories, listen to the community and help Bluely keep the person behind the data in view.</p></div><p className="text-sm text-[#aebbd9]">Bluely admin access</p></div><div className="flex w-full items-center justify-center bg-[#f6f8ff] px-6 py-12 text-[#172853] sm:px-10 lg:max-w-[540px]"><div className="w-full max-w-md"><Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#1F2F98] hover:text-[#17257d] focus-visible:outline-2 focus-visible:outline-[#1F2F98]"><FiArrowLeft aria-hidden="true" /> Back to Bluely</Link><div className="mt-14"><p className="text-xs font-bold tracking-[0.18em] text-[#1F2F98]">ADMIN SIGN IN</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em]">Welcome to the workspace.</h2><p className="mt-4 text-sm leading-6 text-[#647396]">Use an account that has been assigned the admin role in Firestore.</p></div><form onSubmit={handleSubmit} className="mt-10 space-y-5"><label className="block text-sm font-bold">Email address<div className="relative"><FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8293ba]" aria-hidden="true" /><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required autoComplete="email" className="mt-2 w-full rounded-xl border border-[#cbd5ec] bg-white px-4 py-3.5 pl-11 outline-none focus:border-[#1F2F98] focus:ring-2 focus:ring-[#1F2F98]/15" /></div></label><label className="block text-sm font-bold">Password<div className="relative"><FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8293ba]" aria-hidden="true" /><input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required autoComplete="current-password" className="mt-2 w-full rounded-xl border border-[#cbd5ec] bg-white px-4 py-3.5 pl-11 outline-none focus:border-[#1F2F98] focus:ring-2 focus:ring-[#1F2F98]/15" /></div></label>{error && <p className="border-l-2 border-[#a32626] bg-[#fff5f5] px-4 py-3 text-sm text-[#a32626]" role="alert">{error}</p>}<button type="submit" disabled={isSubmitting} className="w-full rounded-full bg-[#1F2F98] px-6 py-4 text-sm font-bold text-white hover:bg-[#17257d] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1F2F98]">{isSubmitting ? 'Signing in...' : 'Continue to verification'}</button></form></div></div></div>;
}