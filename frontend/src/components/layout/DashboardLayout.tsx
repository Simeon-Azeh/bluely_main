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
    FiSearch,
    FiChevronLeft,
    FiChevronRight,
    FiUser,
    FiHelpCircle,
    FiSun,
    FiMoon
} from 'react-icons/fi';
import LoadingSpinner from '../ui/LoadingSpinner';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: FiHome },
    { href: '/glucose', label: 'Log Glucose', icon: FiDroplet },
    { href: '/meals', label: 'Log Meal', icon: FiCoffee },
    { href: '/insights', label: 'Insights', icon: FiTrendingUp },
    { href: '/history', label: 'History', icon: FiBarChart2 },
];

const bottomNavItems = [
    { href: '/settings', label: 'Settings', icon: FiSettings },
];

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const { user, userProfile, loading, signOut } = useAuth();
    const pathname = usePathname();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);

    const isActive = (path: string) => pathname === path;

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const getInitials = (name: string | null | undefined) => {
        if (!name) return 'U';
        const names = name.split(' ');
        if (names.length >= 2) {
            return `${names[0][0]}${names[1][0]}`.toUpperCase();
        }
        return name[0].toUpperCase();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
                <div className="text-center">
                    <div className="w-20 h-20 bg-[#1F2F98] rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <Image
                            src="/icons/logo_white.png"
                            alt="Bluely"
                            width={48}
                            height={48}
                            className="w-12 h-12"
                        />
                    </div>
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-600 font-medium">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
            {/* Desktop Sidebar */}
            <aside
                className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 bg-white border-r border-gray-100 shadow-xl transition-all duration-300 ease-in-out z-30 ${sidebarCollapsed ? 'md:w-20' : 'md:w-72'
                    }`}
            >
                {/* Logo Section */}
                <div className={`flex items-center h-20 px-6 border-b border-gray-100 ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
                    <Link href="/dashboard" className="flex items-center space-x-3">
                        {sidebarCollapsed ? (
                            <Image
                                src="/icons/logo_white.png"
                                alt="Bluely"
                                width={36}
                                height={36}
                                className="w-9 h-9"
                            />
                        ) : (
                            <Image
                                src="/icons/full_logotext.png"
                                alt="Bluely"
                                width={140}
                                height={40}
                                className="h-10 w-auto"
                            />
                        )}
                    </Link>
                    {!sidebarCollapsed && (
                        <button
                            onClick={() => setSidebarCollapsed(true)}
                            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            <FiChevronLeft className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Expand Button (when collapsed) */}
                {sidebarCollapsed && (
                    <button
                        onClick={() => setSidebarCollapsed(false)}
                        className="mx-auto mt-4 p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        <FiChevronRight className="w-5 h-5" />
                    </button>
                )}

                {/* Main Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    {!sidebarCollapsed && (
                        <p className="px-3 mb-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Menu
                        </p>
                    )}
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`group flex items-center ${sidebarCollapsed ? 'justify-center' : ''} space-x-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 ${active
                                    ? 'bg-gradient-to-r from-[#1F2F98] to-[#3B4CC0] text-white shadow-lg shadow-blue-500/25'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-[#1F2F98]'
                                    }`}
                                title={sidebarCollapsed ? item.label : undefined}
                            >
                                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? '' : 'group-hover:scale-110 transition-transform'}`} />
                                {!sidebarCollapsed && <span>{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Section */}
                <div className="p-4 border-t border-gray-100 space-y-2">
                    {!sidebarCollapsed && (
                        <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
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
                                    ? 'bg-gradient-to-r from-[#1F2F98] to-[#3B4CC0] text-white shadow-lg shadow-blue-500/25'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-[#1F2F98]'
                                    }`}
                                title={sidebarCollapsed ? item.label : undefined}
                            >
                                <Icon className="w-5 h-5 flex-shrink-0" />
                                {!sidebarCollapsed && <span>{item.label}</span>}
                            </Link>
                        );
                    })}

                    {/* User Profile Card */}
                    <div className={`mt-4 p-3 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-100 ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
                        <div className={`flex items-center ${sidebarCollapsed ? '' : 'space-x-3'}`}>
                            <div className="w-10 h-10 bg-gradient-to-br from-[#1F2F98] to-[#3B4CC0] rounded-xl flex items-center justify-center shadow-md">
                                <span className="text-white font-semibold text-sm">
                                    {getInitials(user.displayName)}
                                </span>
                            </div>
                            {!sidebarCollapsed && (
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                        {user.displayName || 'User'}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {userProfile?.diabetesType ?
                                            userProfile.diabetesType.replace('_', ' ').replace('type', 'Type ') :
                                            'Complete your profile'
                                        }
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sign Out Button */}
                    <button
                        onClick={handleSignOut}
                        className={`flex items-center ${sidebarCollapsed ? 'justify-center' : ''} space-x-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200`}
                        title={sidebarCollapsed ? 'Sign Out' : undefined}
                    >
                        <FiLogOut className="w-5 h-5" />
                        {!sidebarCollapsed && <span>Sign Out</span>}
                    </button>
                </div>
            </aside>

            {/* Top Header */}
            <header className={`fixed top-0 right-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300 ${sidebarCollapsed ? 'md:left-20' : 'md:left-72'
                } left-0`}>
                <div className="flex items-center justify-between h-20 px-4 sm:px-6 lg:px-8">
                    {/* Left Section - Greeting (Desktop) / Logo (Mobile) */}
                    <div className="flex items-center">
                        {/* Mobile Logo */}
                        <Link href="/dashboard" className="md:hidden flex items-center mr-4">
                            <Image
                                src="/icons/full_logotext.png"
                                alt="Bluely"
                                width={130}
                                height={38}
                                className="h-10 w-auto"
                            />
                        </Link>

                        {/* Desktop Greeting */}
                        <div className="hidden md:block">
                            <h1 className="text-xl font-bold text-gray-900">
                                {getGreeting()}, {user.displayName?.split(' ')[0] || 'there'}! 👋
                            </h1>
                            <p className="text-sm text-gray-500">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </div>

                    {/* Right Section - Actions */}
                    <div className="flex items-center space-x-2 sm:space-x-4">
                        {/* Search (Desktop) */}
                        <div className="hidden lg:flex items-center">
                            <div className="relative">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="w-64 pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1F2F98]/20 focus:border-[#1F2F98] transition-all"
                                />
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <Link
                            href="/glucose"
                            className="hidden sm:flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-[#1F2F98] to-[#3B4CC0] text-white rounded-xl text-sm font-medium shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all"
                        >
                            <FiDroplet className="w-4 h-4" />
                            <span>Log Reading</span>
                        </Link>

                        {/* Notifications */}
                        <button className="relative p-2.5 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">
                            <FiBell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                        </button>

                        {/* Help */}
                        <button className="hidden sm:flex p-2.5 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">
                            <FiHelpCircle className="w-5 h-5" />
                        </button>

                        {/* User Avatar (Mobile) */}
                        <div className="relative md:hidden">
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="w-10 h-10 bg-gradient-to-br from-[#1F2F98] to-[#3B4CC0] rounded-xl flex items-center justify-center"
                            >
                                <span className="text-white font-semibold text-sm">
                                    {getInitials(user.displayName)}
                                </span>
                            </button>

                            {/* Mobile User Dropdown */}
                            {showUserMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                                    <div className="px-4 py-2 border-b border-gray-100">
                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                            {user.displayName}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                    </div>
                                    <Link
                                        href="/settings"
                                        className="flex items-center space-x-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                                        onClick={() => setShowUserMenu(false)}
                                    >
                                        <FiSettings className="w-4 h-4" />
                                        <span>Settings</span>
                                    </Link>
                                    <button
                                        onClick={handleSignOut}
                                        className="flex items-center space-x-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
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

            {/* Main Content */}
            <main className={`pt-20 pb-24 md:pb-8 transition-all duration-300 ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-72'
                }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Tab Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-2xl">
                <div className="flex items-center justify-around h-20 px-2">
                    {navItems.slice(0, 5).map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all ${active
                                    ? 'text-[#1F2F98]'
                                    : 'text-gray-400'
                                    }`}
                            >
                                <div className={`p-2 rounded-xl transition-all ${active ? 'bg-blue-50' : ''}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <span className={`text-xs mt-1 font-medium ${active ? 'text-[#1F2F98]' : 'text-gray-500'}`}>
                                    {item.label.split(' ')[0]}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Click outside to close user menu */}
            {showUserMenu && (
                <div
                    className="fixed inset-0 z-40 md:hidden"
                    onClick={() => setShowUserMenu(false)}
                />
            )}
        </div>
    );
};

export default DashboardLayout;
