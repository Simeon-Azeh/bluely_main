'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FiArrowLeft, FiEye, FiEyeOff, FiLock, FiMail } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '@/contexts/AuthContext';
import AuthAction from '@/components/auth/AuthAction';
import AuthCarousel from '@/components/auth/AuthCarousel';
import AuthField from '@/components/auth/AuthField';
import { googleSignInFeedback, loginFeedback } from '@/lib/firebase/authErrors';

const loginSchema = z.object({
    email: z.string().trim().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const carouselItems = [
    { title: 'Good to see you again.', description: 'Pick up where you left off and keep learning from your everyday patterns.' },
    { title: 'Your days tell a story.', description: 'Bring your readings and routines together in one clearer view.' },
    { title: 'Keep understanding what matters.', description: 'Small moments can add helpful context to your health.' },
];

export default function LoginPage() {
    const { signIn, signInWithGoogle } = useAuth();
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [googleError, setGoogleError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { register, handleSubmit, setError: setFieldError, clearErrors, formState: { errors } } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });
    const emailRegistration = register('email');
    const passwordRegistration = register('password');

    const onSubmit = async (data: LoginFormData) => {
        try {
            setError(null);
            setIsLoading(true);
            await signIn(data.email, data.password);
            router.push('/dashboard');
        } catch (err) {
            const feedback = loginFeedback(err);
            if (feedback.target === 'email') setFieldError('email', { type: 'server', message: feedback.message });
            else if (feedback.target === 'password') setFieldError('password', { type: 'server', message: feedback.message });
            else setError(feedback.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            setError(null);
            setGoogleError(null);
            setIsGoogleLoading(true);
            await signInWithGoogle();
            router.push('/dashboard');
        } catch (err) {
            setGoogleError(googleSignInFeedback(err));
        } finally {
            setIsGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f6f8ff] text-[#172853]">
            <div className="grid min-h-screen lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                <AuthCarousel slides={carouselItems} label="Login messages" />
                <main className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-16">
                    <div className="w-full max-w-[460px]">
                        <div className="flex items-center justify-between gap-5">
                            <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#1F2F98] hover:text-[#17257d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1F2F98]"><FiArrowLeft aria-hidden="true" /> Back to Bluely</Link>
                            <span className="text-xs font-bold tracking-[0.16em] text-[#8293ba]">SIGN IN</span>
                        </div>
                        <h2 className="sr-only">Sign in to Bluely</h2>
                        <form onSubmit={handleSubmit(onSubmit)} aria-label="Sign in" className="mt-12 space-y-6 lg:mt-16">
                            <AuthField id="login-email" label="Email address" icon={<FiMail />} type="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message} {...emailRegistration} onChange={(event) => { void emailRegistration.onChange(event); clearErrors('email'); setError(null); }} />
                            <div>
                                <AuthField id="login-password" label="Password" icon={<FiLock />} type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" error={errors.password?.message} trailing={<button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="flex h-9 w-9 items-center justify-center rounded-xl text-[#8293ba] hover:bg-[#eef2fc] hover:text-[#1F2F98] focus-visible:outline-2 focus-visible:outline-[#1F2F98]">{showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}</button>} {...passwordRegistration} onChange={(event) => { void passwordRegistration.onChange(event); clearErrors('password'); setError(null); }} />
                                <div className="mt-3 flex justify-end"><Link href="/forgot-password" className="text-sm font-semibold text-[#1F2F98] hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1F2F98]">Forgot password?</Link></div>
                            </div>
                            {error && <div className="rounded-2xl border border-[#e9baba] bg-[#fff5f5] px-4 py-3 text-sm text-[#a32626]" role="alert">{error}</div>}
                            <AuthAction type="submit" loading={isLoading || isGoogleLoading}>{isLoading ? 'Signing in...' : 'Sign in'}</AuthAction>
                        </form>
                        <div className="relative my-7"><div className="border-t border-[#dbe3f3]" /><span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#f6f8ff] px-4 text-xs font-bold tracking-[0.14em] text-[#8293ba]">OR</span></div>
                        <AuthAction type="button" variant="secondary" onClick={handleGoogleSignIn} loading={isGoogleLoading || isLoading}><FcGoogle className="h-5 w-5" aria-hidden="true" />{isGoogleLoading ? 'Connecting...' : 'Continue with Google'}</AuthAction>
                        {googleError && <p className="mt-3 text-sm leading-6 text-[#a32626]" role="alert">{googleError}</p>}
                        <p className="mt-8 text-center text-sm text-[#647396]">New to Bluely? <Link href="/signup" className="font-bold text-[#1F2F98] hover:underline">Create an account</Link></p>
                    </div>
                </main>
            </div>
        </div>
    );
}
