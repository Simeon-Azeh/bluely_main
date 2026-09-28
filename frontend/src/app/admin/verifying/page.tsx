'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FiArrowLeft, FiCheck, FiShield } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminVerifyingPage() {
    const { user, userProfile, loading, signOut } = useAuth();
    const router = useRouter();
    const [denied, setDenied] = useState(false);

    useEffect(() => {
        if (loading) return;
        if (!user) {
            router.replace('/admin/login');
        } else if (userProfile?.role === 'admin') {
            router.replace('/admin');
        } else if (userProfile !== null) {
            setDenied(true);
        }
    }, [loading, user, userProfile, router]);

    if (denied) return <div className="flex min-h-screen items-center justify-center bg-[#f6f8ff] px-6"><div className="w-full max-w-md text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fff0f0] text-[#a32626]"><FiShield className="h-7 w-7" aria-hidden="true" /></div><p className="mt-7 text-xs font-bold tracking-[0.18em] text-[#a32626]">ACCESS NOT GRANTED</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#172853]">This account is not an admin.</h1><p className="mt-4 text-sm leading-6 text-[#647396]">Ask an existing administrator to assign the <strong>admin</strong> role in the Firestore users collection.</p><div className="mt-8 flex justify-center gap-5"><button type="button" onClick={signOut} className="rounded-full bg-[#1F2F98] px-6 py-3.5 text-sm font-bold text-white hover:bg-[#17257d] focus-visible:outline-2 focus-visible:outline-[#1F2F98]">Sign out</button><Link href="/" className="inline-flex items-center gap-2 border-b border-[#1F2F98] text-sm font-bold text-[#1F2F98]">Return home</Link></div></div></div>;

    return <div className="flex min-h-screen items-center justify-center bg-[#f6f8ff] px-6"><div className="w-full max-w-md text-center"><div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#e7ecfa] text-[#1F2F98]"><span className="absolute inset-0 animate-ping rounded-full border border-[#9eadd1] opacity-40" /><FiCheck className="relative h-8 w-8" aria-hidden="true" /></div><p className="mt-8 text-xs font-bold tracking-[0.18em] text-[#1F2F98]">VERIFYING CREDENTIALS</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#172853]">Checking your workspace access.</h1><p className="mt-4 text-sm leading-6 text-[#647396]">Firebase confirmed your sign-in. We are checking the Firestore users collection for the admin role.</p><div className="mx-auto mt-8 h-1.5 max-w-xs overflow-hidden bg-[#dbe3f3]"><div className="h-full w-1/2 animate-pulse bg-[#1F2F98]" /></div></div></div>;
}