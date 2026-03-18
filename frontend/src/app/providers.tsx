'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthLayout } from '@/components/layout';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <AuthProvider>
                <AuthLayout>{children}</AuthLayout>
            </AuthProvider>
        </ThemeProvider>
    );
}
