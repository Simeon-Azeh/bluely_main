'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
    FiHome,
    FiDroplet,
    FiBarChart2,
    FiSettings,
    FiLogOut,
    FiTrendingUp,
    FiCoffee
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
    { href: '/settings', label: 'Settings', icon: FiSettings },
];

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const { user, loading, signOut } = useAuth();
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Desktop/Tablet Left Sidebar */}
            <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-64 bg-white border-r border-gray-200 shadow-sm">
                {/* Logo */}
                <div className="flex items-center h-16 px-6 border-b border-gray-100">
                    <Link href="/dashboard" className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <FiDroplet className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-gray-900">Bluely</span>
                    </Link>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive(item.href)
                                        ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User & Sign Out */}
                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center space-x-3 px-4 py-2 mb-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">
                                {user.displayName?.[0]?.toUpperCase() || 'U'}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {user.displayName || 'User'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                                {user.email}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                        <FiLogOut className="w-5 h-5" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm">
                <div className="flex items-center justify-between h-14 px-4">
                    <Link href="/dashboard" className="flex items-center space-x-2">
                        <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                            <FiDroplet className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-lg font-bold text-gray-900">Bluely</span>
                    </Link>
                    <button
                        onClick={handleSignOut}
                        className="p-2 text-gray-600 hover:text-gray-900"
                        title="Sign out"
                    >
                        <FiLogOut className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="md:ml-64 pt-14 md:pt-0 pb-20 md:pb-8">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Tab Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg">
                <div className="flex items-center justify-around h-16">
                    {navItems.slice(0, 5).map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center justify-center py-2 px-3 min-w-0 ${isActive(item.href)
                                        ? 'text-blue-600'
                                        : 'text-gray-500'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive(item.href) ? 'text-blue-600' : ''}`} />
                                <span className={`text-xs mt-1 truncate ${isActive(item.href) ? 'font-medium' : ''}`}>
                                    {item.label.split(' ')[0]}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
};

export default DashboardLayout;
