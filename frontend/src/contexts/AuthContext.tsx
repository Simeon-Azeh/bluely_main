'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { signUp, signIn, logOut, resetPassword, signInWithGoogle } from '@/lib/firebase/auth';
import api from '@/lib/api';

interface UserProfile {
    onboardingCompleted?: boolean;
    diabetesType?: string;
    preferredUnit?: string;
    targetGlucoseMin?: number;
    targetGlucoseMax?: number;
}

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    signUp: (email: string, password: string, displayName: string) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    refreshUserProfile: () => Promise<void>;
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
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUserProfile = async (firebaseUser: User) => {
        try {
            const profile = await api.getUser(firebaseUser.uid) as UserProfile;
            setUserProfile(profile);
        } catch (error: unknown) {
            // If user not found, create them in the backend
            if (error instanceof Error && error.message === 'User not found') {
                try {
                    await api.createUser({
                        firebaseUid: firebaseUser.uid,
                        email: firebaseUser.email || '',
                        displayName: firebaseUser.displayName || 'User',
                    });
                    // Fetch the newly created profile
                    const newProfile = await api.getUser(firebaseUser.uid) as UserProfile;
                    setUserProfile(newProfile);
                    return;
                } catch (createError) {
                    console.error('Error creating user profile:', createError);
                }
            }
            console.error('Error fetching user profile:', error);
            setUserProfile(null);
        }
    };

    const refreshUserProfile = async () => {
        if (user) {
            await fetchUserProfile(user);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                await fetchUserProfile(firebaseUser);
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleSignUp = async (email: string, password: string, displayName: string) => {
        const userCredential = await signUp(email, password, displayName);

        // Try to create user profile in backend, but don't fail if backend is unavailable
        try {
            await api.createUser({
                firebaseUid: userCredential.user.uid,
                email: userCredential.user.email || email,
                displayName,
            });
        } catch (error) {
            console.error('Warning: Could not create backend user profile:', error);
            // Continue anyway - user can complete profile later
        }
    };

    const handleSignIn = async (email: string, password: string) => {
        await signIn(email, password);
    };

    const handleSignInWithGoogle = async () => {
        const userCredential = await signInWithGoogle();

        // Try to create user profile in backend if it doesn't exist
        try {
            await api.createUser({
                firebaseUid: userCredential.user.uid,
                email: userCredential.user.email || '',
                displayName: userCredential.user.displayName || '',
            });
        } catch (error) {
            // User might already exist, that's okay
            console.log('User profile may already exist:', error);
        }
    };

    const handleSignOut = async () => {
        await logOut();
        setUserProfile(null);
    };

    const handleResetPassword = async (email: string) => {
        await resetPassword(email);
    };

    const value: AuthContextType = {
        user,
        userProfile,
        loading,
        signUp: handleSignUp,
        signIn: handleSignIn,
        signInWithGoogle: handleSignInWithGoogle,
        signOut: handleSignOut,
        resetPassword: handleResetPassword,
        refreshUserProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
