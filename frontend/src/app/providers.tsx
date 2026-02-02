'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { AuthLayout } from '@/components/layout';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <AuthLayout>{children}</AuthLayout>
        </AuthProvider>
    );
}
