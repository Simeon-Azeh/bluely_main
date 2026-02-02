'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { signUp, signIn, logOut, resetPassword } from '@/lib/firebase/auth';
import api from '@/lib/api';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signUp: (email: string, password: string, displayName: string) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleSignUp = async (email: string, password: string, displayName: string) => {
        const userCredential = await signUp(email, password, displayName);

        // Create user profile in backend
        await api.createUser({
            firebaseUid: userCredential.user.uid,
            email: userCredential.user.email || email,
            displayName,
        });
    };

    const handleSignIn = async (email: string, password: string) => {
        await signIn(email, password);
    };

    const handleSignOut = async () => {
        await logOut();
    };

    const handleResetPassword = async (email: string) => {
        await resetPassword(email);
    };

    const value: AuthContextType = {
        user,
        loading,
        signUp: handleSignUp,
        signIn: handleSignIn,
        signOut: handleSignOut,
        resetPassword: handleResetPassword,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
