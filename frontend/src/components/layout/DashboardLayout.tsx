'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
    FiHome,
    FiDroplet,
    FiBarChart2,
    FiSettings,
    FiLogOut,
    FiTrendingUp,
    FiCoffee,
    FiBell,
    FiChevronLeft,
    FiChevronRight,
    FiMessageCircle,
    FiLock,
    FiMenu,
    FiX,
    FiArrowUp,
    FiArrowDown,
    FiEdit2,
    FiCheck,
    FiChevronDown
} from 'react-icons/fi';
import { TbPill } from 'react-icons/tb';
import PageSkeleton from '../ui/PageSkeleton';
import FloatingChat from '../dashboard/FloatingChat';
import api from '@/lib/api';
import { useTheme } from '@/contexts/ThemeContext';
import ProfileAvatar from './ProfileAvatar';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: FiHome },
    { href: '/glucose', label: 'Log Glucose', icon: FiDroplet },
    { href: '/meals', label: 'Log Meal', icon: FiCoffee },
    { href: '/medications', label: 'Medications', icon: TbPill },
    { href: '/insights', label: 'Insights', icon: FiTrendingUp },
    { href: '/history', label: 'History', icon: FiBarChart2 },
    { href: '/notifications', label: 'Notifications', icon: FiBell },
];

const bottomNavItems = [
    { href: '/settings', label: 'Settings', icon: FiSettings },
];

const defaultNavOrder = navItems.map(item => item.href);

function restoreNavOrder(userId: string): string[] {
    try {
        const saved = JSON.parse(localStorage.getItem(`bluely-nav-order:${userId}`) || '[]');
        if (Array.isArray(saved)) {
            return [...saved.filter((href): href is string => typeof href === 'string' && defaultNavOrder.includes(href)), ...defaultNavOrder.filter(href => !saved.includes(href))];
        }
    } catch { /* Use the default order if local storage is unavailable. */ }
    return defaultNavOrder;
}

// Pages that require email verification
const emailVerificationRequired = new Set(['/glucose', '/meals', '/medications', '/insights', '/history', '/notifications', '/chat']);

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const { user, loading, signOut } = useAuth();
    const pathname = usePathname();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showFloatingChat, setShowFloatingChat] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [editingNav, setEditingNav] = useState(false);
    const [navOrder, setNavOrder] = useState(defaultNavOrder);
    const [navOrderUserId, setNavOrderUserId] = useState<string | null>(null);
    const [sidebarTooltip, setSidebarTooltip] = useState<{ label: string; top: number } | null>(null);
    const { isDark } = useTheme();

    const isActive = (path: string) => pathname === path;
    const orderedNavItems = (navOrderUserId === user?.uid ? navOrder : defaultNavOrder).map(href => navItems.find(item => item.href === href)!).filter(Boolean);

    React.useEffect(() => {
        if (!user?.uid) return;
        setNavOrder(restoreNavOrder(user.uid));
        setNavOrderUserId(user.uid);
    }, [user?.uid]);

    const moveNavItem = (href: string, direction: -1 | 1) => {
        if (!user) return;
        const current = navOrderUserId === user.uid ? [...navOrder] : [...defaultNavOrder];
        const index = current.indexOf(href);
        const nextIndex = index + direction;
        if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return;
        [current[index], current[nextIndex]] = [current[nextIndex], current[index]];
        setNavOrder(current);
        setNavOrderUserId(user.uid);
        try { localStorage.setItem(`bluely-nav-order:${user.uid}`, JSON.stringify(current)); } catch { /* Keep this session's order. */ }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const currentPage = [...navItems, ...bottomNavItems].find(item => item.href === pathname)?.label || (pathname === '/dashboard/chat' ? 'DiaBuddy' : 'Your space');

    // Fetch unread notification count
    React.useEffect(() => {
        const fetchUnread = async () => {
            if (!user) return;
            try {
                const data = await api.getUnreadNotificationCount(user.uid);
                setUnreadCount(data.unreadCount);
            } catch {
                // Silently fail - notification count is non-critical
            }
        };
        fetchUnread();
        const interval = setInterval(fetchUnread, 60000); // Poll every 60s
        return () => clearInterval(interval);
    }, [user]);

    if (loading) return <PageSkeleton variant="app" />;

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[#f7f8fc] dark:bg-[#121212]">
            {/* Desktop Sidebar */}
            <aside
                className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 overflow-hidden bg-[#101b4b] text-white transition-all duration-300 ease-in-out z-30 ${sidebarCollapsed ? 'md:w-20' : 'md:w-[264px]'
                    }`}
            >
                {/* Logo Section */}
                <div className={`flex items-center h-20 border-b border-white/10 ${sidebarCollapsed ? 'justify-center px-3' : 'justify-between px-6'}`}>
                    <Link href="/dashboard" className="flex items-center" aria-label="Bluely home">
                        {sidebarCollapsed ? (
                            <Image
                                src="/icons/logo_white.png"
                                alt="Bluely"
                                width={36}
                                height={36}
                                className="h-9 w-9 object-contain"
                            />
                        ) : (
                            <Image
                                src="/icons/full_logotext_white.png"
                                alt="Bluely"
                                width={140}
                                height={40}
                                className="h-10 w-36 object-cover object-center"
                            />
                        )}
                    </Link>
                    {!sidebarCollapsed && (
                        <button
                            onClick={() => setSidebarCollapsed(true)}
                            aria-label="Collapse sidebar"
                            className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                        >
                            <FiChevronLeft className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Expand Button (when collapsed) */}
                {sidebarCollapsed && (
                    <button
                        onClick={() => setSidebarCollapsed(false)}
                        aria-label="Expand sidebar"
                        className="mx-auto mt-3 rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <FiChevronRight className="w-5 h-5" />
                    </button>
                )}

                {/* Main Navigation */}
                <nav aria-label="Main navigation" className="flex-1 px-3 py-8 space-y-1 overflow-y-auto">
                    {!sidebarCollapsed && (
                        <p className="px-4 mb-4 text-[11px] font-semibold text-white/45 uppercase tracking-[0.18em]">
                            Your space
                        </p>
                    )}
                    {orderedNavItems.map((item, index) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        const locked = !user?.emailVerified && emailVerificationRequired.has(item.href);

                        if (editingNav && !sidebarCollapsed) return (
                            <div key={item.href} className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-2.5 text-sm text-white">
                                <Icon className="h-5 w-5 shrink-0" />
                                <span className="flex-1">{item.label}</span>
                                <button type="button" onClick={() => moveNavItem(item.href, -1)} disabled={index === 0} aria-label={`Move ${item.label} up`} className="rounded-lg p-1.5 hover:bg-white/15 disabled:opacity-25"><FiArrowUp className="h-4 w-4" /></button>
                                <button type="button" onClick={() => moveNavItem(item.href, 1)} disabled={index === orderedNavItems.length - 1} aria-label={`Move ${item.label} down`} className="rounded-lg p-1.5 hover:bg-white/15 disabled:opacity-25"><FiArrowDown className="h-4 w-4" /></button>
                            </div>
                        );

                        if (locked) {
                            return (
                                <div
                                    key={item.href}
                                    className={`group relative flex items-center ${sidebarCollapsed ? 'justify-center' : ''} space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-white/30 cursor-not-allowed`}
                                    title={sidebarCollapsed ? `${item.label}: verify your email to unlock` : 'Verify your email to unlock'}
                                    onMouseEnter={(event) => sidebarCollapsed && setSidebarTooltip({ label: `${item.label} · Verify email to unlock`, top: event.currentTarget.getBoundingClientRect().top + 8 })}
                                    onMouseLeave={() => setSidebarTooltip(null)}
                                >
                                    <Icon className="w-5 h-5 flex-shrink-0" />
                                    {!sidebarCollapsed && (
                                        <>
                                            <span>{item.label}</span>
                                            <FiLock className="w-3.5 h-3.5 ml-auto text-gray-300" />
                                        </>
                                    )}
                                    {sidebarCollapsed && (
                                        <FiLock className="absolute -top-1 -right-1 w-3 h-3 text-gray-400" />
                                    )}
                                </div>
                            );
                        }

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                aria-current={active ? 'page' : undefined}
                                className={`group relative flex items-center ${sidebarCollapsed ? 'justify-center' : ''} space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${active
                                    ? 'bg-white text-[#18245a] shadow-sm'
                                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                                    }`}
                                onMouseEnter={(event) => sidebarCollapsed && setSidebarTooltip({ label: item.label, top: event.currentTarget.getBoundingClientRect().top + 8 })}
                                onMouseLeave={() => setSidebarTooltip(null)}
                                onFocus={(event) => sidebarCollapsed && setSidebarTooltip({ label: item.label, top: event.currentTarget.getBoundingClientRect().top + 8 })}
                                onBlur={() => setSidebarTooltip(null)}
                            >
                                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? '' : 'group-hover:scale-110 transition-transform'}`} />
                                {!sidebarCollapsed && <span>{item.label}</span>}
                            </Link>
                        );
                    })}
                    {!sidebarCollapsed && <button type="button" onClick={() => setEditingNav(value => !value)} className="mt-5 flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-xs font-medium text-white/55 hover:bg-white/10 hover:text-white">{editingNav ? <FiCheck className="h-4 w-4" /> : <FiEdit2 className="h-4 w-4" />}{editingNav ? 'Done arranging' : 'Arrange links'}</button>}
                </nav>
                {sidebarCollapsed && sidebarTooltip && <div role="tooltip" className="fixed left-[88px] z-50 rounded-lg bg-[#101b4b] px-3 py-2 text-xs font-medium text-white shadow-xl ring-1 ring-white/15" style={{ top: sidebarTooltip.top }}>{sidebarTooltip.label}</div>}

                {/* Bottom Section */}
                <div className="p-3 border-t border-white/10 space-y-2">
                    {!sidebarCollapsed && (
                        <p className="px-4 mb-2 text-[11px] font-semibold text-white/45 uppercase tracking-[0.18em]">
                            Account
                        </p>
                    )}
                    {bottomNavItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`group flex items-center ${sidebarCollapsed ? 'justify-center' : ''} space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${active
                                    ? 'bg-white text-[#18245a]'
                                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                                    }`}
                                title={sidebarCollapsed ? item.label : undefined}
                                onMouseEnter={(event) => sidebarCollapsed && setSidebarTooltip({ label: item.label, top: event.currentTarget.getBoundingClientRect().top + 8 })}
                                onMouseLeave={() => setSidebarTooltip(null)}
                                onFocus={(event) => sidebarCollapsed && setSidebarTooltip({ label: item.label, top: event.currentTarget.getBoundingClientRect().top + 8 })}
                                onBlur={() => setSidebarTooltip(null)}
                            >
                                <Icon className="w-5 h-5 flex-shrink-0" />
                                {!sidebarCollapsed && <span>{item.label}</span>}
                            </Link>
                        );
                    })}

                    {/* Sign Out Button */}
                    <button
                        onClick={handleSignOut}
                        className={`flex items-center ${sidebarCollapsed ? 'justify-center' : ''} space-x-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-all duration-200`}
                        title={sidebarCollapsed ? 'Sign Out' : undefined}
                        onMouseEnter={(event) => sidebarCollapsed && setSidebarTooltip({ label: 'Sign out', top: event.currentTarget.getBoundingClientRect().top + 8 })}
                        onMouseLeave={() => setSidebarTooltip(null)}
                        onFocus={(event) => sidebarCollapsed && setSidebarTooltip({ label: 'Sign out', top: event.currentTarget.getBoundingClientRect().top + 8 })}
                        onBlur={() => setSidebarTooltip(null)}
                    >
                        <FiLogOut className="w-5 h-5" />
                        {!sidebarCollapsed && <span>Sign Out</span>}
                    </button>
                </div>
            </aside>

            {/* Top Header */}
            <header className={`fixed top-0 right-0 ${showUserMenu ? 'z-[60]' : 'z-20'} bg-white/95 backdrop-blur-xl border-b border-[#e6e9f3] dark:bg-[#1a1a1a]/95 dark:border-[#2a2a2a] transition-all duration-300 ${sidebarCollapsed ? 'md:left-20' : 'md:left-[264px]'
                } left-0`}>
                <div className="flex items-center justify-between h-20 px-4 sm:px-6 lg:px-8">
                    {/* Left Section - Greeting (Desktop) / Logo (Mobile) */}
                    <div className="flex items-center">
                        <button type="button" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu" aria-expanded={mobileMenuOpen} className="mr-3 rounded-xl p-2.5 text-[#1F2F98] hover:bg-blue-50 dark:text-blue-200 dark:hover:bg-[#2a2a2a] md:hidden">
                            <FiMenu className="h-6 w-6" />
                        </button>
                        {/* Mobile Logo */}
                        <Link href="/dashboard" className="md:hidden flex items-center mr-4">
                            <Image
                                src={isDark ? "/icons/full_logotext_white.png" : "/icons/full_logotext.png"}
                                alt="Bluely"
                                width={130}
                                height={38}
                                className="h-10 w-32 object-cover object-center"
                            />
                        </Link>

                        {/* Desktop page context */}
                        <div className="hidden md:block">
                            <h1 className="text-lg font-semibold tracking-tight text-[#14204e] dark:text-white">
                                {currentPage}
                            </h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Your Bluely space
                            </p>
                        </div>
                    </div>

                    {/* Right Section - Actions */}
                    <div className="flex items-center space-x-2 sm:space-x-4">
                        {/* Quick Actions */}
                        {user?.emailVerified ? (
                            <Link
                                href="/glucose"
                                className="hidden sm:flex items-center space-x-2 px-4 py-2.5 bg-[#1F2F98] text-white rounded-xl text-sm font-medium hover:bg-[#16257e] transition-colors"
                            >
                                <FiDroplet className="w-4 h-4" />
                                <span>Log Reading</span>
                            </Link>
                        ) : (
                            <div className="group relative hidden sm:flex items-center space-x-2 px-4 py-2.5 bg-gray-200 text-gray-400 rounded-xl text-sm font-medium cursor-not-allowed" title="Verify your email to unlock">
                                <FiLock className="w-4 h-4" />
                                <span>Log Reading</span>
                            </div>
                        )}

                        {/* Notifications */}
                        {user?.emailVerified ? (
                            <Link href="/notifications" className="relative p-2.5 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-[#2a2a2a] dark:text-gray-300 dark:hover:bg-[#333] transition-colors">
                                <FiBell className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </Link>
                        ) : (
                            <div className="group relative p-2.5 rounded-xl bg-gray-100 text-gray-300 cursor-not-allowed" title="Verify your email to unlock">
                                <FiBell className="w-5 h-5" />
                            </div>
                        )}

                        {/* DiaBuddy Chat */}
                        <Link
                            href="/dashboard/chat"
                            className="hidden sm:flex p-2.5 rounded-xl bg-gradient-to-br from-[#1F2F98]/10 to-[#4F5FD8]/10 text-[#1F2F98] hover:from-[#1F2F98]/20 hover:to-[#4F5FD8]/20 dark:from-[#1F2F98]/25 dark:to-[#4F5FD8]/25 dark:text-blue-300 transition-colors"
                            title="Chat with DiaBuddy"
                        >
                            <FiMessageCircle className="w-5 h-5" />
                        </Link>

                        {/* Profile photo slot; Firebase photoURL displays when available. */}
                        <div className="relative border-l border-slate-200 pl-3 dark:border-white/10 sm:pl-4">
                            <button
                                type="button"
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                aria-label="Open profile menu"
                                aria-expanded={showUserMenu}
                                className="flex items-center gap-2 rounded-full bg-[#f5f7ff] py-1 pl-1 pr-2 text-left transition-colors hover:bg-[#e8edff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F2F98] dark:bg-white/10 dark:hover:bg-white/15"
                            >
                                <ProfileAvatar name={user.displayName} photoURL={user.photoURL} size={42} />
                                <span className="hidden max-w-28 text-sm font-semibold text-[#14204e] dark:text-white lg:block truncate">{user.displayName?.split(' ')[0] || 'Profile'}</span>
                                <FiChevronDown className={`hidden h-4 w-4 text-[#61709e] transition-transform sm:block ${showUserMenu ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Profile menu */}
                            {showUserMenu && (
                                <div className="absolute right-0 mt-3 w-[min(90vw,288px)] rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_55px_rgba(20,32,78,0.16)] dark:border-white/10 dark:bg-[#232323]">
                                    <div className="rounded-xl bg-[#f3f5ff] px-4 py-4 dark:bg-white/5">
                                        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6673a0] dark:text-blue-300">Your account</p>
                                        <div className="flex items-center gap-3">
                                            <ProfileAvatar name={user.displayName} photoURL={user.photoURL} size={52} />
                                            <div className="min-w-0"><p className="truncate text-sm font-semibold text-[#14204e] dark:text-white">{user.displayName || 'Bluely member'}</p><p className="truncate text-xs text-slate-500 dark:text-gray-400">{user.email}</p></div>
                                        </div>
                                        <p className="mt-3 text-xs text-[#61709e] dark:text-gray-300">{user.emailVerified ? 'Email verified' : 'Email verification pending'}</p>
                                    </div>
                                    <Link
                                        href="/settings"
                                        className="mt-2 flex items-center space-x-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 dark:text-gray-200 dark:hover:bg-white/10"
                                        onClick={() => setShowUserMenu(false)}
                                    >
                                        <FiSettings className="w-4 h-4" />
                                        <span>Profile and settings</span>
                                    </Link>
                                    <button
                                        onClick={() => { setShowUserMenu(false); void handleSignOut(); }}
                                        className="flex items-center space-x-3 w-full rounded-xl px-3 py-3 text-sm text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/10"
                                    >
                                        <FiLogOut className="w-4 h-4" />
                                        <span>Sign Out</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile navigation drawer */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <button type="button" className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)} />
                    <nav aria-label="App navigation" className="absolute inset-y-0 left-0 flex w-[min(85vw,340px)] flex-col bg-white p-5 shadow-2xl dark:bg-[#1a1a1a] animate-in slide-in-from-left duration-300">
                        <div className="mb-7 flex items-center justify-between">
                            <Image src="/icons/full_logotext.png" alt="Bluely" width={144} height={144} className="h-10 w-36 object-cover object-center dark:hidden" />
                            <Image src="/icons/full_logotext_white.png" alt="Bluely" width={144} height={144} className="hidden h-10 w-36 object-cover object-center dark:block" />
                            <button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu" className="rounded-xl p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#2a2a2a]"><FiX className="h-5 w-5" /></button>
                        </div>
                        <div className="mb-3 flex items-center justify-between px-3"><p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Your space</p><button type="button" onClick={() => setEditingNav(value => !value)} className="flex items-center gap-1 text-xs font-semibold text-[#1F2F98] dark:text-blue-300">{editingNav ? <FiCheck /> : <FiEdit2 />}{editingNav ? 'Done' : 'Arrange'}</button></div>
                        <div className="flex-1 space-y-1 overflow-y-auto">
                            {[...orderedNavItems, ...bottomNavItems].map((item, index) => {
                                const Icon = item.icon;
                                const locked = !user.emailVerified && emailVerificationRequired.has(item.href);
                                if (editingNav && index < orderedNavItems.length) return <div key={item.href} className="flex items-center gap-3 rounded-xl bg-blue-50 px-3 py-2.5 text-sm text-[#14204e] dark:bg-white/10 dark:text-white"><Icon className="h-5 w-5" /><span className="flex-1">{item.label}</span><button type="button" onClick={() => moveNavItem(item.href, -1)} disabled={index === 0} aria-label={`Move ${item.label} up`} className="rounded-lg p-2 disabled:opacity-25"><FiArrowUp /></button><button type="button" onClick={() => moveNavItem(item.href, 1)} disabled={index === orderedNavItems.length - 1} aria-label={`Move ${item.label} down`} className="rounded-lg p-2 disabled:opacity-25"><FiArrowDown /></button></div>;
                                return locked ? <div key={item.href} className="flex items-center gap-3 rounded-xl px-3 py-3 text-gray-400" title="Verify your email to unlock"><Icon className="h-5 w-5" /><span>{item.label}</span><FiLock className="ml-auto h-4 w-4" /></div> : <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} aria-current={isActive(item.href) ? 'page' : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${isActive(item.href) ? 'bg-[#1F2F98] text-white' : 'text-gray-700 hover:bg-blue-50 dark:text-gray-200 dark:hover:bg-[#2a2a2a]'}`}><Icon className="h-5 w-5" />{item.label}</Link>;
                            })}
                            <Link href="/dashboard/chat" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 dark:text-gray-200 dark:hover:bg-[#2a2a2a]"><FiMessageCircle className="h-5 w-5" />DiaBuddy</Link>
                        </div>
                        <button type="button" onClick={() => { setMobileMenuOpen(false); void handleSignOut(); }} className="mt-4 flex items-center gap-3 rounded-xl border-t border-gray-100 px-3 py-4 text-sm text-gray-600 dark:border-[#333] dark:text-gray-300"><FiLogOut className="h-5 w-5" />Sign out</button>
                    </nav>
                </div>
            )}

            {/* Main Content */}
            <main className={`pt-20 pb-8 transition-all duration-300 ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-[264px]'
                }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
                    {children}
                </div>
            </main>

            {/* Floating DiaBuddy Chat */}
            {pathname !== '/dashboard/chat' && (
                <>
                    <FloatingChat isOpen={showFloatingChat} onClose={() => setShowFloatingChat(false)} />
                    <button
                        onClick={() => setShowFloatingChat((v) => !v)}
                        className="fixed z-40 bottom-6 right-4 md:bottom-8 md:right-8 w-14 h-14 rounded-full shadow-lg shadow-[#1F2F98]/25 hover:shadow-xl hover:shadow-[#1F2F98]/30 transition-all hover:scale-105 active:scale-95 overflow-hidden ring-2 ring-white dark:ring-[#2a2a2a]"
                        title="Chat with DiaBuddy"
                    >
                        {showFloatingChat ? (
                            <div className="w-full h-full bg-[#1F2F98] flex items-center justify-center">
                                <FiMessageCircle className="w-6 h-6 text-white" />
                            </div>
                        ) : (
                            <Image
                                src="/diabuddy.png"
                                alt="Chat with DiaBuddy"
                                width={56}
                                height={56}
                                className="w-full h-full object-cover"
                            />
                        )}
                    </button>
                </>
            )}

            {/* Click outside to close user menu */}
            {showUserMenu && (
                <button type="button" aria-label="Close profile menu"
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                />
            )}
        </div>
    );
};

export default DashboardLayout;
