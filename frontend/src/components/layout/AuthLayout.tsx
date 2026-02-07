'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import DashboardLayout from './DashboardLayout';
import LoadingSpinner from '../ui/LoadingSpinner';

interface AuthLayoutProps {
    children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
    const { user, userProfile, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const publicRoutes = ['/', '/login', '/signup', '/forgot-password'];
    const fullScreenRoutes = ['/onboarding']; // Routes that need full screen (no sidebar)
    const isPublicRoute = publicRoutes.includes(pathname);
    const isFullScreenRoute = fullScreenRoutes.includes(pathname);

    React.useEffect(() => {
        if (!loading) {
            if (!user && !isPublicRoute) {
                // Not logged in, redirect to login
                router.push('/login');
            } else if (user && isPublicRoute && pathname !== '/') {
                // User is logged in and on a public route (login/signup)
                // Check if they've completed onboarding
                if (userProfile?.onboardingCompleted) {
                    router.push('/dashboard');
                } else {
                    router.push('/onboarding');
                }
            } else if (user && !isPublicRoute && !isFullScreenRoute && !userProfile?.onboardingCompleted) {
                // User is trying to access dashboard but hasn't completed onboarding
                router.push('/onboarding');
            }
        }
    }, [user, userProfile, loading, isPublicRoute, isFullScreenRoute, pathname, router]);

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

    // For public routes or full-screen routes (like onboarding), don't show dashboard layout
    if (isPublicRoute || isFullScreenRoute) {
        return <>{children}</>;
    }

    // For authenticated routes, use dashboard layout with sidebar/bottom nav
    return <DashboardLayout>{children}</DashboardLayout>;
};

export default AuthLayout;
