'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import type { FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FiArrowLeft, FiEye, FiEyeOff, FiLock, FiMail, FiUser } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '@/contexts/AuthContext';
import AuthAction from '@/components/auth/AuthAction';
import AuthCarousel from '@/components/auth/AuthCarousel';
import AuthField from '@/components/auth/AuthField';
import { googleSignInFeedback, signupFeedback } from '@/lib/firebase/authErrors';
import styles from '@/components/auth/AuthStep.module.css';

const signupSchema = z.object({
    displayName: z.string().trim().min(2, 'Please enter at least 2 characters'),
    email: z.string().trim().email('Please enter a valid email address'),
    password: z.string().min(6, 'Use at least 6 characters'),
    confirmPassword: z.string(),
    agreeToTerms: z.boolean().refine((value) => value, { message: 'Please agree to the terms to continue' }),
}).refine((data) => data.password === data.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] });

type SignupFormData = z.infer<typeof signupSchema>;

const carouselItems = [
    { title: 'Make room for your whole story.', description: 'Your health is more than one number. Bluely helps you see the everyday context around it.' },
    { title: 'Start with understanding.', description: 'Bring your readings, routines and questions into one clearer space.' },
    { title: 'Take it one day at a time.', description: 'Notice patterns at your pace, with tools made for real life.' },
];

const stepFields = ['displayName', 'email', 'password'] as const;

export default function SignupPage() {
    const { signUp, signInWithGoogle } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [googleError, setGoogleError] = useState<string | null>(null);
    const [emailInUse, setEmailInUse] = useState(false);
    const [passwordRejected, setPasswordRejected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const advancing = useRef(false);
    const { register, handleSubmit, trigger, setFocus, setError: setFieldError, clearErrors, watch, formState: { errors } } = useForm<SignupFormData>({
        resolver: zodResolver(signupSchema),
        defaultValues: { displayName: '', email: '', password: '', confirmPassword: '', agreeToTerms: false },
    });
    const enteredName = (watch('displayName') ?? '').trim().split(/\s+/)[0] || 'friend';
    const firstName = enteredName.charAt(0).toUpperCase() + enteredName.slice(1);
    const emailRegistration = register('email');
    const passwordRegistration = register('password');

    useEffect(() => {
        advancing.current = false;
        if (step === 0) return;
        const field = step === 1 ? 'email' : step === 2 ? 'password' : 'confirmPassword';
        const timer = window.setTimeout(() => setFocus(field), 100);
        return () => window.clearTimeout(timer);
    }, [step, setFocus]);

    const advance = async () => {
        if (advancing.current) return;
        if (step === 1 && emailInUse) {
            setFieldError('email', { type: 'server', message: 'This email already has a Bluely account.' });
            return;
        }
        if (step === 2 && passwordRejected) {
            setFieldError('password', { type: 'server', message: 'Choose a stronger password and try again.' });
            return;
        }
        advancing.current = true;
        const isValid = await trigger(stepFields[step as 0 | 1 | 2]);
        if (isValid) {
            setError(null);
            setStep((current) => current + 1);
        } else advancing.current = false;
    };

    const onSubmit = async (data: SignupFormData) => {
        try {
            setError(null);
            setIsLoading(true);
            await signUp(data.email, data.password, data.displayName.trim());
            router.push('/onboarding');
        } catch (err) {
            const feedback = signupFeedback(err);
            if (feedback.target === 'email') {
                setEmailInUse(Boolean(feedback.emailInUse));
                setFieldError('email', { type: 'server', message: feedback.message });
                setStep(1);
            } else if (feedback.target === 'password') {
                setPasswordRejected(true);
                setFieldError('password', { type: 'server', message: feedback.message });
                setStep(2);
            } else setError(feedback.message);
        } finally {
            setIsLoading(false);
        }
    };

    const onInvalid = (formErrors: FieldErrors<SignupFormData>) => {
        if (formErrors.displayName) setStep(0);
        else if (formErrors.email) setStep(1);
        else if (formErrors.password) setStep(2);
        else setStep(3);
    };

    const handleGoogleSignIn = async () => {
        try {
            setError(null);
            setGoogleError(null);
            setIsGoogleLoading(true);
            await signInWithGoogle();
            router.push('/onboarding');
        } catch (err) {
            setGoogleError(googleSignInFeedback(err));
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
        if (step < 3) {
            event.preventDefault();
            void advance();
            return;
        }
        void handleSubmit(onSubmit, onInvalid)(event);
    };

    return (
        <div className="min-h-screen bg-[#f6f8ff] text-[#172853]">
            <div className="grid min-h-screen lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                <AuthCarousel slides={carouselItems} label="Signup messages" />
                <main className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-16">
                    <div className="w-full max-w-[460px]">
                        <div className="flex items-center justify-between gap-5">
                            <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#1F2F98] hover:text-[#17257d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1F2F98]"><FiArrowLeft aria-hidden="true" /> Back to Bluely</Link>
                            <span className="text-xs font-bold tracking-[0.16em] text-[#8293ba]">CREATE ACCOUNT</span>
                        </div>
                        <div className="mt-12 lg:mt-16" aria-label={`Step ${step + 1} of 4`}>
                            <div className="flex items-center justify-between text-xs font-bold tracking-[0.16em] text-[#8293ba]"><span>LET&apos;S BEGIN</span><span>0{step + 1} / 04</span></div>
                            <div className="mt-4 grid grid-cols-4 gap-2" aria-hidden="true">{[0, 1, 2, 3].map((index) => <span key={index} className={`h-1.5 rounded-full transition-colors duration-300 ${index <= step ? 'bg-[#1F2F98]' : 'bg-[#d9e1f2]'}`} />)}</div>
                        </div>
                        <form onSubmit={handleFormSubmit} aria-label="Create an account" className="mt-9">
                            <div key={step} className={styles.step}>
                                {step === 0 && <AuthField id="signup-name" label="What should we call you?" largeLabel icon={<FiUser />} type="text" autoComplete="name" placeholder="e.g. Maya" error={errors.displayName?.message} {...register('displayName')} />}
                                {step === 1 && <>
                                    <AuthField id="signup-email" label={<>Alright, <span className="text-[#1F2F98]">{firstName}</span>. What&apos;s your email address?</>} largeLabel icon={<FiMail />} type="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message} {...emailRegistration} onChange={(event) => { void emailRegistration.onChange(event); clearErrors('email'); setEmailInUse(false); }} />
                                    {emailInUse && <p className="mt-3 text-sm text-[#52617d]"><Link href="/login" className="font-bold text-[#1F2F98] underline underline-offset-2">Sign in</Link> or <Link href="/forgot-password" className="font-bold text-[#1F2F98] underline underline-offset-2">reset your password</Link>.</p>}
                                </>}
                                {step === 2 && <AuthField id="signup-password" label={<>Nice to meet you, <span className="text-[#1F2F98]">{firstName}</span>. Choose a password.</>} largeLabel icon={<FiLock />} type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="At least 6 characters" error={errors.password?.message} trailing={<button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="flex h-9 w-9 items-center justify-center rounded-xl text-[#8293ba] hover:bg-[#eef2fc] hover:text-[#1F2F98] focus-visible:outline-2 focus-visible:outline-[#1F2F98]">{showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}</button>} {...passwordRegistration} onChange={(event) => { void passwordRegistration.onChange(event); clearErrors('password'); setPasswordRejected(false); }} />}
                                {step === 3 && <>
                                    <AuthField id="signup-confirm-password" label={<>One last thing, <span className="text-[#1F2F98]">{firstName}</span>. Confirm your password.</>} largeLabel icon={<FiLock />} type={showConfirmPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Enter it once more" error={errors.confirmPassword?.message} trailing={<button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'} className="flex h-9 w-9 items-center justify-center rounded-xl text-[#8293ba] hover:bg-[#eef2fc] hover:text-[#1F2F98] focus-visible:outline-2 focus-visible:outline-[#1F2F98]">{showConfirmPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}</button>} {...register('confirmPassword')} />
                                    <div className="mt-6 flex items-start gap-3"><input id="agreeToTerms" type="checkbox" className="mt-1 h-5 w-5 shrink-0 rounded-md accent-[#1F2F98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F2F98]" {...register('agreeToTerms')} /><label htmlFor="agreeToTerms" className="text-sm leading-6 text-[#647396]">I agree to the <Link href="/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#1F2F98] underline underline-offset-2">Terms of Service</Link> and <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#1F2F98] underline underline-offset-2">Privacy Policy</Link>.</label></div>
                                    {errors.agreeToTerms && <p className="mt-2 text-sm text-[#a32626]" role="alert">{errors.agreeToTerms.message}</p>}
                                </>}
                            </div>
                            {error && <div className="mt-7 rounded-2xl border border-[#e9baba] bg-[#fff5f5] px-4 py-3 text-sm text-[#a32626]" role="alert">{error}</div>}
                            <div className="mt-8 flex gap-3">
                                {step > 0 && <button type="button" onClick={() => { setError(null); setStep((current) => current - 1); }} disabled={isLoading} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-[#cbd6ed] bg-[#ffffff] px-5 text-sm font-bold text-[#26375f] transition-colors hover:border-[#9eadd1] hover:bg-[#f8faff] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1F2F98] disabled:opacity-60"><FiArrowLeft aria-hidden="true" /> Back</button>}
                                <AuthAction type="submit" loading={isLoading || isGoogleLoading}>{isLoading ? 'Creating account...' : step === 3 ? 'Create account' : 'Continue'}</AuthAction>
                            </div>
                        </form>
                        {step === 0 && <>
                            <div className="relative my-7"><div className="border-t border-[#dbe3f3]" /><span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#f6f8ff] px-4 text-xs font-bold tracking-[0.14em] text-[#8293ba]">OR</span></div>
                            <AuthAction type="button" variant="secondary" onClick={handleGoogleSignIn} loading={isGoogleLoading || isLoading}><FcGoogle className="h-5 w-5" aria-hidden="true" />{isGoogleLoading ? 'Connecting...' : 'Continue with Google'}</AuthAction>
                            {googleError && <p className="mt-3 text-sm leading-6 text-[#a32626]" role="alert">{googleError}</p>}
                        </>}
                        <p className="mt-8 text-center text-sm text-[#647396]">Already have an account? <Link href="/login" className="font-bold text-[#1F2F98] hover:underline">Sign in</Link></p>
                    </div>
                </main>
            </div>
        </div>
    );
}
