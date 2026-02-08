'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input } from '@/components/ui';
import { FiMail, FiLock, FiArrowLeft, FiEye, FiEyeOff } from 'react-icons/fi';
import Image from 'next/image';
import { FcGoogle } from 'react-icons/fc';

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const carouselItems = [
    {
        title: "Welcome back to Bluely, diabestie!",
        description: "Track your data. Understand your patterns. Make informed daily decisions."
    },
    {
        title: "Your health journey continues!",
        description: "Monitor glucose levels, discover insights, and take control of your wellness."
    },
    {
        title: "Stay on top of your health!",
        description: "Log readings, track trends, and make smarter choices every day."
    }
];

export default function LoginPage() {
    const { signIn, signInWithGoogle } = useAuth();
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

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

    const handleGoogleSignIn = async () => {
        try {
            setError(null);
            setIsGoogleLoading(true);
            await signInWithGoogle();
            router.push('/dashboard');
        } catch (err) {
            console.error('Google sign-in error:', err);
            setError('Failed to sign in with Google. Please try again.');
        } finally {
            setIsGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Gradient Background with Content */}
            <div
                className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, #1F2F98 0%, #3B4CC0 50%, #1F2F98 100%)'
                }}
            >
                {/* Background Pattern/Image Overlay */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }} />
                </div>

                {/* Abstract circles decoration */}
                <div className="absolute top-20 right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
                <div className="absolute bottom-40 left-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />

                {/* Content */}
                <div className="relative z-10 flex flex-col w-full p-8 lg:p-12">
                    {/* Top Navigation */}
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <Link href="/" className="flex items-center space-x-3">
                            <Image
                                src="/icons/full_logotext_white.png"
                                alt="Bluely"
                                width={140}
                                height={40}
                                className="h-26 w-auto"
                            />
                        </Link>

                        {/* Back to Website */}
                        <Link
                            href="/"
                            className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
                        >
                            <FiArrowLeft className="w-4 h-4" />
                            <span className="text-sm font-medium">Back to website</span>
                        </Link>
                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Bottom Content - Carousel */}
                    <div className="space-y-6">
                        <div className="min-h-[120px]">
                            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 transition-all duration-500">
                                {carouselItems[currentSlide].title}
                            </h2>
                            <p className="text-lg text-white/80 transition-all duration-500">
                                {carouselItems[currentSlide].description}
                            </p>
                        </div>

                        {/* Carousel Indicators */}
                        <div className="flex space-x-2">
                            {carouselItems.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentSlide(index)}
                                    className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide
                                        ? 'w-8 bg-white'
                                        : 'w-2 bg-white/40 hover:bg-white/60'
                                        }`}
                                    aria-label={`Go to slide ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-white">
                <div className="w-full max-w-md space-y-8">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <Link href="/" className="inline-flex items-center">
                            <Image
                                src="/icons/full_logotext.png"
                                alt="Bluely"
                                width={140}
                                height={40}
                                className="h-26 w-auto"
                            />
                        </Link>
                    </div>

                    {/* Header */}
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                            Welcome back!
                        </h1>
                        <p className="mt-2 text-gray-600">
                            Log in to continue logging and tracking your health.
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiMail className="h-5 w-5 text-gray-400" />
                                </div>
                                <Input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="pl-10"
                                    error={errors.email?.message}
                                    {...register('email')}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiLock className="h-5 w-5 text-gray-400" />
                                </div>
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    className="pl-10 pr-10"
                                    error={errors.password?.message}
                                    {...register('password')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    {showPassword ? (
                                        <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                    ) : (
                                        <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-[#1F2F98] focus:ring-[#1F2F98] border-gray-300 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                                    Remember Me
                                </label>
                            </div>
                            <Link
                                href="/forgot-password"
                                className="text-sm font-medium text-[#1F2F98] hover:text-[#1F2F98]/80"
                            >
                                Forgot Password?
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-[#1F2F98] hover:bg-[#1F2F98]/90"
                            size="lg"
                            isLoading={isLoading}
                        >
                            Login
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-gray-500">Or continue with</span>
                        </div>
                    </div>

                    {/* Google Sign In */}
                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={isGoogleLoading}
                        className="w-full flex items-center justify-center space-x-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FcGoogle className="w-5 h-5" />
                        <span className="text-sm font-medium text-gray-700">
                            {isGoogleLoading ? 'Signing in...' : 'Google'}
                        </span>
                    </button>

                    {/* Sign Up Link */}
                    <p className="text-center text-gray-600">
                        Don&apos;t have an account?{' '}
                        <Link href="/signup" className="font-medium text-[#1F2F98] hover:text-[#1F2F98]/80">
                            Sign up here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
