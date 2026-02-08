'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FiDownload, FiX, FiSmartphone, FiZap, FiBell, FiWifi } from 'react-icons/fi';
import { Button } from '@/components/ui';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallPromptProps {
    onDismiss?: () => void;
    variant?: 'modal' | 'banner' | 'card';
}

export default function InstallPrompt({ onDismiss, variant = 'modal' }: InstallPromptProps) {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Check if iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
        setIsIOS(isIOSDevice);

        // Listen for beforeinstallprompt event
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Show prompt for iOS users after a delay
        if (isIOSDevice) {
            const dismissed = localStorage.getItem('bluely-install-dismissed');
            if (!dismissed) {
                setTimeout(() => setShowPrompt(true), 2000);
            }
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setShowPrompt(false);
            setIsInstalled(true);
        }

        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('bluely-install-dismissed', 'true');
        onDismiss?.();
    };

    if (isInstalled || !showPrompt) return null;

    const features = [
        { icon: FiZap, text: 'Quick access from home screen' },
        { icon: FiBell, text: 'Get reminder notifications' },
        { icon: FiWifi, text: 'Works offline' },
    ];

    if (variant === 'banner') {
        return (
            <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#1F2F98] to-[#3B4CC0] text-white p-4 shadow-lg z-50 safe-area-bottom">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <FiSmartphone className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-semibold">Install Bluely App</p>
                            <p className="text-sm text-white/80">Add to home screen for the best experience</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDismiss}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <FiX className="w-5 h-5" />
                        </button>
                        {isIOS ? (
                            <Button
                                onClick={() => setShowPrompt(true)}
                                className="bg-white text-[#1F2F98] hover:bg-white/90"
                                size="sm"
                            >
                                Learn How
                            </Button>
                        ) : (
                            <Button
                                onClick={handleInstall}
                                className="bg-white text-[#1F2F98] hover:bg-white/90"
                                size="sm"
                            >
                                <FiDownload className="w-4 h-4 mr-2" />
                                Install
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (variant === 'card') {
        return (
            <div className="bg-gradient-to-br from-[#1F2F98] to-[#3B4CC0] rounded-2xl p-6 text-white relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

                <button
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                    <FiX className="w-4 h-4" />
                </button>

                <div className="relative z-10">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                        <FiSmartphone className="w-6 h-6" />
                    </div>

                    <h3 className="text-xl font-bold mb-2">Install Bluely</h3>
                    <p className="text-white/80 text-sm mb-4">
                        Get the app for quick access and a better experience
                    </p>

                    <div className="space-y-2 mb-6">
                        {features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-white/90">
                                <feature.icon className="w-4 h-4 text-white/60" />
                                <span>{feature.text}</span>
                            </div>
                        ))}
                    </div>

                    {isIOS ? (
                        <div className="bg-white/10 rounded-xl p-4 text-sm">
                            <p className="font-medium mb-2">To install on iOS:</p>
                            <ol className="space-y-1 text-white/80">
                                <li>1. Tap the Share button</li>
                                <li>2. Scroll and tap &quot;Add to Home Screen&quot;</li>
                                <li>3. Tap &quot;Add&quot; to confirm</li>
                            </ol>
                        </div>
                    ) : (
                        <Button
                            onClick={handleInstall}
                            className="w-full bg-white text-[#1F2F98] hover:bg-white/90"
                        >
                            <FiDownload className="w-4 h-4 mr-2" />
                            Install App
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    // Modal variant (default)
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                {/* Header with gradient */}
                <div className="bg-gradient-to-br from-[#1F2F98] to-[#3B4CC0] p-8 text-white text-center relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <Image
                                src="/icons/android-chrome-192x192.png"
                                alt="Bluely"
                                width={56}
                                height={56}
                                className="w-14 h-14"
                            />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Install Bluely</h2>
                        <p className="text-white/80">
                            Add Bluely to your home screen for quick access
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="space-y-4 mb-6">
                        {features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                                    <feature.icon className="w-5 h-5 text-[#1F2F98]" />
                                </div>
                                <span className="text-gray-700">{feature.text}</span>
                            </div>
                        ))}
                    </div>

                    {isIOS ? (
                        <div className="bg-gray-50 rounded-xl p-4 mb-6">
                            <p className="font-medium text-gray-900 mb-2">To install on iOS:</p>
                            <ol className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-start gap-2">
                                    <span className="w-5 h-5 bg-[#1F2F98] text-white rounded-full flex items-center justify-center text-xs shrink-0">1</span>
                                    <span>Tap the <strong>Share</strong> button in Safari</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-5 h-5 bg-[#1F2F98] text-white rounded-full flex items-center justify-center text-xs shrink-0">2</span>
                                    <span>Scroll and tap <strong>&quot;Add to Home Screen&quot;</strong></span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-5 h-5 bg-[#1F2F98] text-white rounded-full flex items-center justify-center text-xs shrink-0">3</span>
                                    <span>Tap <strong>&quot;Add&quot;</strong> to confirm</span>
                                </li>
                            </ol>
                        </div>
                    ) : (
                        <Button
                            onClick={handleInstall}
                            className="w-full bg-[#1F2F98] hover:bg-[#1F2F98]/90 mb-3"
                            size="lg"
                        >
                            <FiDownload className="w-5 h-5 mr-2" />
                            Install App
                        </Button>
                    )}

                    <button
                        onClick={handleDismiss}
                        className="w-full text-gray-500 hover:text-gray-700 text-sm py-2 transition-colors"
                    >
                        Maybe later
                    </button>
                </div>
            </div>
        </div>
    );
}

// Hook for programmatic install prompt
export function useInstallPrompt() {
    const [canInstall, setCanInstall] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setCanInstall(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const promptInstall = async () => {
        if (!deferredPrompt) return false;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setCanInstall(false);
        }

        setDeferredPrompt(null);
        return outcome === 'accepted';
    };

    return { canInstall, promptInstall };
}
