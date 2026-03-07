'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

interface DiaBuddyCardProps {
    compact?: boolean;
}

function getFirstName(displayName: string | null | undefined): string {
    if (!displayName) return '';
    if (displayName.includes('@')) return '';
    const first = displayName.split(' ')[0];
    if (first.length > 20 || /[^a-zA-Z\-']/.test(first)) return '';
    return first;
}

export default function DiaBuddyCard({ compact = false }: DiaBuddyCardProps) {
    const { user } = useAuth();
    const firstName = getFirstName(user?.displayName);
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [source, setSource] = useState<string | null>(null);
    const [displayedText, setDisplayedText] = useState('');
    const [isAnimating, setIsAnimating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const animateText = (text: string) => {
        setIsAnimating(true);
        setDisplayedText('');
        let i = 0;
        const interval = setInterval(() => {
            if (i < text.length) {
                setDisplayedText(text.slice(0, i + 1));
                i++;
            } else {
                clearInterval(interval);
                setIsAnimating(false);
            }
        }, 18);
    };

    const handleAskDiaBuddy = async () => {
        if (!user) return;
        setIsLoading(true);
        setError(null);
        setSummary('');
        setDisplayedText('');

        try {
            const result = await api.getDiaBuddySummary(user.uid);
            setSummary(result.summary);
            setSource(result.source);
            animateText(result.summary);
        } catch (err) {
            console.error('DiaBuddy error:', err);
            setError('DiaBuddy is taking a nap. Please try again in a moment!');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setSummary('');
        setDisplayedText('');
        setSource(null);
        setError(null);
    };

    return (
        <Card className="overflow-hidden">
            <CardContent className={compact ? 'p-4' : 'p-5'}>
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <Image
                        src="/diabuddy.png"
                        alt="DiaBuddy"
                        width={40}
                        height={40}
                        className="rounded-full object-cover ring-2 ring-[#1F2F98]/10"
                    />
                    <div>
                        <h3 className="font-semibold text-gray-900 text-sm">DiaBuddy</h3>
                        <p className="text-xs text-gray-500">{firstName ? `${firstName}'s health companion` : 'Your AI health companion'}</p>
                    </div>
                    {source && (
                        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                            {source === 'ai' ? 'AI Powered' : 'Analysis'}
                        </span>
                    )}
                </div>

                {/* Content area */}
                {!summary && !isLoading && !error && (
                    <div className="text-center py-4">
                        <p className="text-sm text-gray-600 mb-4">
                            {compact
                                ? `${firstName ? `Hey ${firstName}, get` : 'Get'} a quick AI summary of your glucose patterns`
                                : `${firstName ? `Hey ${firstName}! I` : 'I'} can analyze your glucose readings and give you a personalized summary. Want to see what I've found?`}
                        </p>
                        <button
                            onClick={handleAskDiaBuddy}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#1F2F98] to-[#4F5FD8] text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200 active:scale-[0.98]"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                            </svg>
                            Ask DiaBuddy to Summarize
                        </button>
                    </div>
                )}

                {/* Loading animation */}
                {isLoading && (
                    <div className="flex items-center gap-3 py-6 justify-center">
                        <div className="flex gap-1">
                            <span className="w-2 h-2 bg-[#1F2F98] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-[#1F2F98] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-[#1F2F98] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-sm text-gray-500">DiaBuddy is thinking...</span>
                    </div>
                )}

                {/* Summary display with typing animation */}
                {(displayedText || (summary && !isAnimating)) && (
                    <div className="space-y-3">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100/50">
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {displayedText || summary}
                                {isAnimating && (
                                    <span className="inline-block w-0.5 h-4 bg-[#1F2F98] ml-0.5 animate-pulse align-text-bottom" />
                                )}
                            </p>
                        </div>
                        {!isAnimating && (
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] text-gray-400">
                                    Not medical advice. Consult your healthcare provider.
                                </p>
                                <button
                                    onClick={handleReset}
                                    className="text-xs text-[#1F2F98] hover:text-[#4F5FD8] font-medium transition-colors"
                                >
                                    Ask again
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Error state */}
                {error && (
                    <div className="text-center py-4">
                        <p className="text-sm text-gray-500 mb-3">{error}</p>
                        <button
                            onClick={handleAskDiaBuddy}
                            className="text-sm text-[#1F2F98] hover:text-[#4F5FD8] font-medium transition-colors"
                        >
                            Try again
                        </button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
