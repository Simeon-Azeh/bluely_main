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
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const publicRoutes = ['/', '/login', '/signup', '/forgot-password'];
    const isPublicRoute = publicRoutes.includes(pathname);

    React.useEffect(() => {
        if (!loading) {
            if (!user && !isPublicRoute) {
                router.push('/login');
            } else if (user && isPublicRoute && pathname !== '/') {
                router.push('/dashboard');
            }
        }
    }, [user, loading, isPublicRoute, pathname, router]);

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

    // For public routes, don't show dashboard layout
    if (isPublicRoute) {
        return <>{children}</>;
    }

    // For authenticated routes, use dashboard layout with sidebar/bottom nav
    return <DashboardLayout>{children}</DashboardLayout>;
};

export default AuthLayout;
