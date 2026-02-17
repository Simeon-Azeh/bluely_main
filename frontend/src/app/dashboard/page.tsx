'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, Button, LoadingSpinner, InstallPrompt } from '@/components/ui';
import {
    WelcomeHeader,
    QuickActionsGrid,
    StatsGrid,
    WeeklyChart,
    RecentReadings,
    MoodTracker,
    TodaysProgress,
    InsightsCard,
    MedicationCard,
    LifestyleCheckIn,
    PredictionCard,
    WeeklyTrendCard,
    GlucoseForecastCard,
} from '@/components/dashboard';
import { FiAlertCircle, FiCircle, FiArrowRight } from 'react-icons/fi';
import { format, isToday } from 'date-fns';
import api from '@/lib/api';

interface Stats {
    totalReadings: number;
    averageGlucose: number | null;
    minGlucose: number | null;
    maxGlucose: number | null;
    inRangePercentage: number | null;
    belowRangePercentage: number | null;
    aboveRangePercentage: number | null;
    targetMin: number;
    targetMax: number;
    readingsByDay: Array<{
        date: string;
        average: number;
        readings: Array<{
            value: number;
            recordedAt: string;
        }>;
    }>;
}

interface Reading {
    _id: string;
    value: number;
    unit: string;
    readingType: string;
    recordedAt: string;
    notes?: string;
}

interface ReadingsResponse {
    readings: Reading[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

// Motivational messages for the dashboard
const motivationalMessages = [
    "Every reading is a step toward better health. Keep going!",
    "Small consistent steps lead to big changes. You're doing great!",
    "Your dedication to tracking shows how much you care about your health.",
    "Progress, not perfection. Every day is a new opportunity!",
    "You're taking control of your health journey. That's amazing!",
    "Remember: knowledge is power. Keep tracking!",
    "One day at a time. You've got this!",
    "Your future self will thank you for the effort you're putting in today.",
    "Consistency is key. You're building great habits!",
    "Be proud of yourself for prioritizing your health.",
];

export default function DashboardPage() {
    const { user, userProfile } = useAuth();
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentReadings, setRecentReadings] = useState<Reading[]>([]);
    const [allReadings, setAllReadings] = useState<Reading[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [backendError, setBackendError] = useState(false);
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);
    const [motivationalMessage, setMotivationalMessage] = useState('');

    // ML & progressive collection state
    const [healthProfile, setHealthProfile] = useState<{
        exists: boolean;
        profile: {
            activityLevel?: string;
            exerciseFrequency?: string;
            sleepQuality?: number;
            stressLevel?: number;
            mealPreference?: string;
            onMedication?: boolean;
            medicationCategory?: string;
            medicationFrequency?: string;
            lastPromptShown?: string;
            promptsDismissed?: number;
            profileCompleteness?: number;
        } | null;
    }>({ exists: false, profile: null });
    const [prediction, setPrediction] = useState<{
        exists: boolean;
        prediction: {
            predictedGlucose: number;
            riskLevel: 'normal' | 'elevated' | 'critical';
            confidence: number;
            recommendation: string;
        } | null;
    }>({ exists: false, prediction: null });
    const [trends, setTrends] = useState<{
        hasData: boolean;
        trend: {
            direction: 'rising' | 'stable' | 'declining';
            currentAverage: number;
            previousAverage: number | null;
            percentageChange: number;
            totalReadings: number;
            riskPeriod: string;
            recommendation: string;
        } | null;
    }>({ hasData: false, trend: null });
    const [glucose30, setGlucose30] = useState<{
        hasData: boolean;
        prediction: {
            predictedGlucose: number;
            direction: 'rising' | 'stable' | 'dropping';
            directionArrow: string;
            directionLabel: string;
            confidence: number;
            timeframe: string;
            recommendation: string;
            riskAlert?: string | null;
            factors: string[];
            modelUsed: string;
            predictionTimestamp?: string;
        } | null;
    }>({ hasData: false, prediction: null });
    const [showInsightsCard, setShowInsightsCard] = useState(false);
    const [showMedicationCard, setShowMedicationCard] = useState(false);
    const [showLifestyleCard, setShowLifestyleCard] = useState(false);

    const isOnboardingComplete = userProfile?.onboardingCompleted === true;

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            try {
                setBackendError(false);
                const [statsData, readingsData, allReadingsData] = await Promise.all([
                    api.getGlucoseStats(user.uid, 7),
                    api.getGlucoseReadings({ firebaseUid: user.uid, limit: 5 }),
                    api.getGlucoseReadings({ firebaseUid: user.uid, limit: 100 }),
                ]);

                setStats(statsData);
                setRecentReadings(readingsData.readings);
                setAllReadings(allReadingsData.readings);

                // Fetch ML-related data (non-blocking)
                try {
                    const [hpData, predData, trendsData, g30Data] = await Promise.all([
                        api.getHealthProfile(user.uid),
                        api.getLatestPrediction(user.uid),
                        api.getTrends(user.uid),
                        api.getGlucose30(user.uid),
                    ]);

                    setHealthProfile(hpData);
                    setPrediction(predData);
                    setTrends(trendsData);
                    setGlucose30(g30Data);

                    // Determine which cards to show
                    const totalReadings = allReadingsData.readings.length;
                    const profile = hpData.profile;
                    const dismissed = profile?.promptsDismissed || 0;

                    // Card 1: Show if no activity level set AND < 3 dismissals
                    if (!profile?.activityLevel && dismissed < 3) {
                        setShowInsightsCard(true);
                    }

                    // Card 2: Show if medication = true AND no medication category set
                    if (profile?.onMedication === true && (!profile?.medicationCategory || profile?.medicationCategory === 'none')) {
                        setShowMedicationCard(true);
                    }

                    // Card 3: Show if profile completeness > 50% AND last prompt > 7 days ago
                    if (profile && (profile.profileCompleteness as number) >= 50) {
                        const lastShown = profile.lastPromptShown ? new Date(profile.lastPromptShown as string) : null;
                        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                        if (!lastShown || lastShown < sevenDaysAgo) {
                            setShowLifestyleCard(true);
                        }
                    }
                } catch (mlError) {
                    console.warn('ML data fetch failed (non-critical):', mlError);
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setBackendError(true);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();

        // Set random motivational message
        const randomIndex = Math.floor(Math.random() * motivationalMessages.length);
        setMotivationalMessage(motivationalMessages[randomIndex]);

        // Show install prompt after 3 seconds for new users
        const dismissed = localStorage.getItem('bluely-install-dismissed');
        if (!dismissed) {
            const timer = setTimeout(() => setShowInstallPrompt(true), 3000);
            return () => clearTimeout(timer);
        }
    }, [user]);

    // Count today's readings
    const todaysReadingsCount = allReadings.filter(reading =>
        isToday(new Date(reading.recordedAt))
    ).length;

    // Calculate streak (consecutive days with readings)
    const calculateStreak = () => {
        if (allReadings.length === 0) return 0;
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i <= 30; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(checkDate.getDate() - i);
            const hasReading = allReadings.some(reading => {
                const readingDate = new Date(reading.recordedAt);
                readingDate.setHours(0, 0, 0, 0);
                return readingDate.getTime() === checkDate.getTime();
            });
            if (hasReading) streak++;
            else if (i > 0) break;
        }
        return streak;
    };

    const streak = calculateStreak();
    const recommendedReadings = 3;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-500">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    // Prepare chart data
    const chartData = stats?.readingsByDay.map(day => ({
        date: format(new Date(day.date), 'EEE'),
        fullDate: format(new Date(day.date), 'MMM d'),
        average: Math.round(day.average),
        readings: day.readings.length,
    })) || [];

    return (
        <div className="space-y-6 pb-8">
            {/* Install Prompt */}
            {showInstallPrompt && (
                <InstallPrompt
                    variant="modal"
                    onDismiss={() => setShowInstallPrompt(false)}
                />
            )}

            {/* Welcome Header */}
            <WelcomeHeader
                userName={user?.displayName?.split(' ')[0]}
                motivationalMessage={motivationalMessage}
                isOnboardingComplete={isOnboardingComplete}
                todaysReadingsCount={todaysReadingsCount}
                averageGlucose={stats?.averageGlucose || null}
                streak={streak}
            />

            {/* Backend Connection Error */}
            {backendError && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent>
                        <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                                <FiAlertCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-red-800 mb-1">Connection Issue</h3>
                                <p className="text-sm text-red-700">
                                    Unable to connect to the server. Please make sure the backend is running and try again.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Onboarding Required Card */}
            {!isOnboardingComplete && (
                <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 overflow-hidden">
                    <CardContent>
                        <div className="flex items-start space-x-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-200">
                                <FiAlertCircle className="w-7 h-7 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900 text-xl mb-2">Complete Your Profile</h3>
                                <p className="text-gray-600 mb-4">
                                    Set up your profile to get personalized insights and start tracking effectively.
                                </p>
                                <div className="flex flex-wrap gap-2 mb-5">
                                    {['Set diabetes type', 'Configure target range', 'Choose units'].map((item) => (
                                        <span key={item} className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-white text-amber-700 border border-amber-200 shadow-sm">
                                            <FiCircle className="w-2 h-2 mr-1.5" />
                                            {item}
                                        </span>
                                    ))}
                                </div>
                                <Link href="/onboarding">
                                    <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-200/50">
                                        Complete Setup
                                        <FiArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Only show features if onboarding is complete */}
            {isOnboardingComplete && (
                <>
                    {/* Quick Actions Grid */}
                    <QuickActionsGrid />

                    {/* ── 30-Minute Glucose Forecast (always prominent) ── */}
                    {glucose30.hasData && glucose30.prediction && (
                        <GlucoseForecastCard
                            predictedGlucose={glucose30.prediction.predictedGlucose}
                            direction={glucose30.prediction.direction}
                            directionArrow={glucose30.prediction.directionArrow}
                            directionLabel={glucose30.prediction.directionLabel}
                            confidence={glucose30.prediction.confidence}
                            timeframe={glucose30.prediction.timeframe}
                            recommendation={glucose30.prediction.recommendation}
                            riskAlert={glucose30.prediction.riskAlert}
                            factors={glucose30.prediction.factors}
                            modelUsed={glucose30.prediction.modelUsed}
                            predictionTimestamp={glucose30.prediction.predictionTimestamp}
                            onRefresh={async () => {
                                if (!user) return;
                                try {
                                    const g30Data = await api.getGlucose30(user.uid);
                                    setGlucose30(g30Data);
                                } catch (err) {
                                    console.warn('Failed to refresh forecast:', err);
                                }
                            }}
                        />
                    )}

                    {/* ── Progressive Data Collection Cards (prominent placement) ── */}

                    {/* Card 1: Personalize Insights — shown after 1+ readings if no profile */}
                    {showInsightsCard && (
                        <InsightsCard
                            onComplete={() => {
                                setShowInsightsCard(false);
                                if (user) api.getHealthProfile(user.uid).then(setHealthProfile);
                            }}
                            onDismiss={() => setShowInsightsCard(false)}
                        />
                    )}

                    {/* Card 2: Medication Info — shown if user said yes to medication */}
                    {showMedicationCard && (
                        <MedicationCard
                            onComplete={() => {
                                setShowMedicationCard(false);
                                if (user) api.getHealthProfile(user.uid).then(setHealthProfile);
                            }}
                            onDismiss={() => setShowMedicationCard(false)}
                        />
                    )}

                    {/* Card 3: Lifestyle Check-In — shown weekly */}
                    {showLifestyleCard && (
                        <LifestyleCheckIn
                            onComplete={() => {
                                setShowLifestyleCard(false);
                                if (user) api.getHealthProfile(user.uid).then(setHealthProfile);
                            }}
                            onDismiss={() => setShowLifestyleCard(false)}
                        />
                    )}

                    {/* Mood Tracker */}
                    <MoodTracker />

                    {/* Today's Progress */}
                    <TodaysProgress
                        todaysReadingsCount={todaysReadingsCount}
                        recommendedReadings={recommendedReadings}
                        userName={user?.displayName?.split(' ')[0]}
                    />

                    {/* Stats Grid */}
                    <StatsGrid
                        averageGlucose={stats?.averageGlucose || null}
                        inRangePercentage={stats?.inRangePercentage || null}
                        minGlucose={stats?.minGlucose || null}
                        maxGlucose={stats?.maxGlucose || null}
                        targetMin={stats?.targetMin || 70}
                        targetMax={stats?.targetMax || 180}
                    />

                    {/* Weekly Chart */}
                    <WeeklyChart
                        chartData={chartData}
                        targetMin={stats?.targetMin || 70}
                        targetMax={stats?.targetMax || 180}
                    />

                    {/* Recent Readings */}
                    <RecentReadings
                        readings={recentReadings}
                        targetMin={stats?.targetMin || 70}
                        targetMax={stats?.targetMax || 180}
                    />

                    {/* ── ML Output Cards ── */}

                    {/* Card 4: Glucose Prediction */}
                    {prediction.exists && prediction.prediction && (
                        <PredictionCard
                            predictedGlucose={prediction.prediction.predictedGlucose}
                            riskLevel={prediction.prediction.riskLevel}
                            confidence={prediction.prediction.confidence}
                            recommendation={prediction.prediction.recommendation}
                        />
                    )}

                    {/* Card 5: Weekly Trend Summary */}
                    {trends.hasData && trends.trend && (
                        <WeeklyTrendCard
                            direction={trends.trend.direction}
                            currentAverage={trends.trend.currentAverage}
                            previousAverage={trends.trend.previousAverage}
                            percentageChange={trends.trend.percentageChange}
                            totalReadings={trends.trend.totalReadings}
                            riskPeriod={trends.trend.riskPeriod}
                            recommendation={trends.trend.recommendation}
                        />
                    )}

                    {/* Install App Card (Alternative placement) */}
                    <InstallPrompt variant="card" onDismiss={() => { }} />
                </>
            )}
        </div>
    );
}