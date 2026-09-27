'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import DashboardLayout from './DashboardLayout';
import PageSkeleton from '../ui/PageSkeleton';

interface AuthLayoutProps {
    children: React.ReactNode;
}

const authEntryRoutes = ['/login', '/signup', '/forgot-password'];

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
    const { user, userProfile, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const publicRoutes = ['/', '/channels', '/resources', '/share-your-story', '/login', '/signup', '/forgot-password', '/terms', '/privacy', '/medical-disclaimer'];
    const fullScreenRoutes = ['/onboarding']; // Routes that need full screen (no sidebar)
    // Pages that require email verification to access
    const emailVerificationRequired = ['/glucose', '/meals', '/medications', '/insights', '/history', '/notifications'];
    const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/stories/') || pathname.startsWith('/resources/');
    const isFullScreenRoute = fullScreenRoutes.includes(pathname);
    const requiresEmailVerification = emailVerificationRequired.includes(pathname);

    React.useEffect(() => {
        if (!loading) {
            if (!user && !isPublicRoute) {
                // Not logged in, redirect to login
                router.push('/login');
            } else if (user && authEntryRoutes.includes(pathname)) {
                // Signed-in users should leave authentication screens; other public pages remain available.
                // Check if they've completed onboarding - wait for profile to load
                if (userProfile !== null) {
                    if (userProfile?.onboardingCompleted === true) {
                        router.push('/dashboard');
                    } else {
                        router.push('/onboarding');
                    }
                }
            } else if (user && !isPublicRoute && !isFullScreenRoute && userProfile !== null && userProfile?.onboardingCompleted !== true) {
                // User is trying to access dashboard but hasn't completed onboarding
                // Only redirect if we have loaded the profile (userProfile !== null)
                router.push('/onboarding');
            } else if (user && !user.emailVerified && requiresEmailVerification) {
                // Email not verified — redirect to dashboard where verification card is shown
                router.push('/dashboard');
            }
        }
    }, [user, userProfile, loading, isPublicRoute, isFullScreenRoute, requiresEmailVerification, pathname, router]);

    if (loading) return <PageSkeleton variant={isPublicRoute ? 'website' : 'app'} />;

    // For public routes or full-screen routes (like onboarding), don't show dashboard layout
    if (isPublicRoute || isFullScreenRoute) {
        return <>{children}</>;
    }

    // For authenticated routes, use dashboard layout with sidebar/bottom nav
    return <DashboardLayout>{children}</DashboardLayout>;
};

export default AuthLayout;
