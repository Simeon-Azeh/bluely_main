'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input } from '@/components/ui';
import { FiDroplet, FiMail, FiArrowLeft, FiCheck } from 'react-icons/fi';

const resetSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
});

type ResetFormData = z.infer<typeof resetSchema>;

export default function ForgotPasswordPage() {
    const { resetPassword } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetFormData>({
        resolver: zodResolver(resetSchema),
    });

    const onSubmit = async (data: ResetFormData) => {
        try {
            setError(null);
            setIsLoading(true);
            await resetPassword(data.email);
            setIsSuccess(true);
        } catch (err) {
            console.error('Reset password error:', err);
            setError('Failed to send reset email. Please check your email address.');
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
                        Reset your password
                    </h2>
                    <p className="mt-2 text-gray-600">
                        Enter your email and we&apos;ll send you a reset link
                    </p>
                </div>

                {/* Form */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    {isSuccess ? (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FiCheck className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Check your email
                            </h3>
                            <p className="text-gray-600 mb-6">
                                We&apos;ve sent you a password reset link. Please check your inbox.
                            </p>
                            <Link
                                href="/login"
                                className="text-blue-600 hover:text-blue-500 font-medium"
                            >
                                Back to sign in
                            </Link>
                        </div>
                    ) : (
                        <>
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

                                <Button
                                    type="submit"
                                    className="w-full"
                                    size="lg"
                                    isLoading={isLoading}
                                >
                                    Send Reset Link
                                </Button>
                            </form>
                        </>
                    )}
                </div>

                {/* Back to login */}
                <div className="text-center">
                    <Link
                        href="/login"
                        className="inline-flex items-center text-gray-600 hover:text-gray-900"
                    >
                        <FiArrowLeft className="w-4 h-4 mr-2" />
                        Back to sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}
