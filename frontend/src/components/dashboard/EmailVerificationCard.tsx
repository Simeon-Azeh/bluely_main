'use client';

import { useState } from 'react';
import { FiMail, FiCheckCircle, FiRefreshCw } from 'react-icons/fi';
import { sendEmailVerification, User } from 'firebase/auth';
import { Card, CardContent } from '@/components/ui/Card';

interface EmailVerificationCardProps {
    user: User;
}

export default function EmailVerificationCard({ user }: EmailVerificationCardProps) {
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [checking, setChecking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleResendVerification = async () => {
        setSending(true);
        setError(null);
        try {
            await sendEmailVerification(user);
            setSent(true);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to send verification email';
            if (message.includes('too-many-requests')) {
                setError('Too many requests. Please wait a few minutes before trying again.');
            } else {
                setError(message);
            }
        } finally {
            setSending(false);
        }
    };

    const handleCheckVerification = async () => {
        setChecking(true);
        setError(null);
        try {
            await user.reload();
            if (user.emailVerified) {
                window.location.reload();
            } else {
                setError('Email not verified yet. Please check your inbox and click the verification link.');
            }
        } catch {
            setError('Unable to check verification status. Please try again.');
        } finally {
            setChecking(false);
        }
    };

    return (
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
            <CardContent>
                <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                        <FiMail className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-amber-900 mb-1">Verify Your Email</h3>
                        <p className="text-sm text-amber-700 mb-3">
                            We sent a verification email to <span className="font-medium">{user.email}</span>.
                            Please check your inbox and click the link to verify your account.
                        </p>

                        {error && (
                            <p className="text-sm text-red-600 mb-3">{error}</p>
                        )}

                        {sent && !error && (
                            <p className="text-sm text-green-700 mb-3 flex items-center gap-1.5">
                                <FiCheckCircle className="w-4 h-4" />
                                Verification email sent! Check your inbox.
                            </p>
                        )}

                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={handleCheckVerification}
                                disabled={checking}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
                            >
                                <FiRefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
                                {checking ? 'Checking...' : "I've Verified"}
                            </button>
                            <button
                                onClick={handleResendVerification}
                                disabled={sending}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-100 disabled:opacity-50 transition-colors"
                            >
                                {sending ? 'Sending...' : 'Resend Email'}
                            </button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
