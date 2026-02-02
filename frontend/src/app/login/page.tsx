'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input } from '@/components/ui';
import { FiDroplet, FiMail, FiLock } from 'react-icons/fi';

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const { signIn } = useAuth();
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        try {
            setError(null);
            setIsLoading(true);
            await signIn(data.email, data.password);
            router.push('/dashboard');
        } catch (err) {
            console.error('Login error:', err);
            setError('Invalid email or password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Logo */}
                <div className="text-center">
                    <Link href="/" className="inline-flex items-center space-x-2">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                            <FiDroplet className="w-7 h-7 text-white" />
                        </div>
                    </Link>
                    <h2 className="mt-6 text-3xl font-bold text-gray-900">
                        Welcome back
                    </h2>
                    <p className="mt-2 text-gray-600">
                        Sign in to continue tracking your health
                    </p>
                </div>

                {/* Form */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiMail className="h-5 w-5 text-gray-400" />
                            </div>
                            <Input
                                type="email"
                                placeholder="Email address"
                                className="pl-10"
                                error={errors.email?.message}
                                {...register('email')}
                            />
                        </div>

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiLock className="h-5 w-5 text-gray-400" />
                            </div>
                            <Input
                                type="password"
                                placeholder="Password"
                                className="pl-10"
                                error={errors.password?.message}
                                {...register('password')}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                                    Remember me
                                </label>
                            </div>
                            <Link
                                href="/forgot-password"
                                className="text-sm font-medium text-blue-600 hover:text-blue-500"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            isLoading={isLoading}
                        >
                            Sign In
                        </Button>
                    </form>
                </div>

                {/* Sign up link */}
                <p className="text-center text-gray-600">
                    Don&apos;t have an account?{' '}
                    <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                        Sign up for free
                    </Link>
                </p>
            </div>
        </div>
    );
}
