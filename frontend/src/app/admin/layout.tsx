'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FiBarChart2, FiChevronRight, FiGrid, FiLogOut, FiMessageSquare, FiSettings, FiUsers } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';

const adminNavigation = [
    { href: '/admin', label: 'Overview', icon: FiGrid },
    { href: '/admin/stories', label: 'Stories', icon: FiMessageSquare },
    { href: '/admin/community', label: 'Community', icon: FiUsers },
    { href: '/admin/insights', label: 'Insights', icon: FiBarChart2 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, userProfile, loading, signOut } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [checking, setChecking] = useState(true);
    const isEntryRoute = pathname === '/admin/login' || pathname === '/admin/verifying';

    useEffect(() => {
        if (loading) return;
        if (isEntryRoute) {
            setChecking(false);
            return;
        }
        if (!user) {
            router.replace('/admin/login');
            return;
        }
        if (userProfile?.role !== 'admin') {
            router.replace('/admin/login?error=unauthorized');
            return;
        }
        setChecking(false);
    }, [loading, user, userProfile, router, isEntryRoute]);

    if (isEntryRoute) return <>{children}</>;

    if (loading || checking || !user || userProfile?.role !== 'admin') {
        return <div className="flex min-h-screen items-center justify-center bg-[#f6f8ff] px-6"><div className="w-full max-w-md text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e7ecfa]"><span className="h-7 w-7 animate-spin rounded-full border-2 border-[#c5d1ed] border-t-[#1F2F98]" /></div><p className="mt-7 text-xs font-bold tracking-[0.18em] text-[#1F2F98]">VERIFYING CREDENTIALS</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#172853]">Preparing your admin space.</h1><p className="mt-4 text-sm leading-6 text-[#647396]">We are checking your Bluely account permissions before opening the dashboard.</p></div></div>;
    }

    return <div className="min-h-screen bg-[#f5f7fc] text-[#172853]"><aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-[#dfe5f2] bg-[#132653] text-white lg:flex lg:flex-col"><div className="flex h-24 items-center border-b border-white/15 px-7"><Link href="/admin" className="text-3xl font-semibold tracking-[-0.08em] text-white">BLUELY<span className="ml-2 text-xs font-bold tracking-[0.16em] text-[#aebfff]">ADMIN</span></Link></div><div className="px-6 pt-8"><p className="text-[10px] font-bold tracking-[0.18em] text-[#9eb1e8]">WORKSPACE</p><nav className="mt-5 space-y-2" aria-label="Admin navigation">{adminNavigation.map((item) => { const Icon = item.icon; const active = pathname === item.href; return <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-3.5 text-sm font-semibold transition-colors ${active ? 'bg-white text-[#1F2F98]' : 'text-[#d8e0f4] hover:bg-white/10 hover:text-white'}`}><Icon className="h-5 w-5" aria-hidden="true" />{item.label}</Link>; })}</nav></div><div className="mt-auto border-t border-white/15 p-6"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center bg-[#526bb0] text-sm font-bold text-white">{(user.displayName || user.email || 'A').slice(0, 1).toUpperCase()}</div><div className="min-w-0"><p className="truncate text-sm font-semibold">{user.displayName || 'Admin'}</p><p className="truncate text-xs text-[#aebbd9]">{user.email}</p></div></div><button type="button" onClick={signOut} className="mt-5 flex items-center gap-2 text-sm font-semibold text-[#b9c7e7] hover:text-white focus-visible:outline-2 focus-visible:outline-white"><FiLogOut aria-hidden="true" /> Sign out</button></div></aside><div className="lg:pl-72"><header className="flex h-24 items-center justify-between border-b border-[#dfe5f2] bg-white px-5 sm:px-8 lg:px-12"><div><p className="text-xs font-bold tracking-[0.18em] text-[#1F2F98]">BLUELY ADMIN</p><h1 className="mt-1 text-xl font-semibold tracking-[-0.03em] sm:text-2xl">{pathname === '/admin' ? 'Overview' : 'Workspace'}</h1></div><div className="flex items-center gap-3 text-sm text-[#647396]"><span className="hidden sm:inline">Signed in as {user.displayName || user.email}</span><Link href="/" className="inline-flex items-center gap-2 border-b border-[#1F2F98] font-semibold text-[#1F2F98] focus-visible:outline-2 focus-visible:outline-[#1F2F98]">View site <FiChevronRight aria-hidden="true" /></Link></div></header><main className="px-5 py-8 sm:px-8 sm:py-12 lg:px-12">{children}</main></div></div>;
}
