const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface FetchOptions extends RequestInit {
    token?: string;
}

// Response types
interface GlucoseReading {
    _id: string;
    firebaseUid: string;
    value: number;
    unit: string;
    readingType: string;
    mealContext?: string;
    activityContext?: string;
    notes?: string;
    recordedAt: string;
    createdAt: string;
    updatedAt: string;
}

interface Pagination {
    total: number;
    page: number;
    pages: number;
    limit: number;
}

interface GlucoseReadingsResponse {
    readings: GlucoseReading[];
    pagination: Pagination;
}

interface UserData {
    _id: string;
    firebaseUid: string;
    email: string;
    displayName?: string;
    diabetesType?: string;
    diagnosisYear?: number;
    preferredUnit?: string;
    targetGlucoseMin?: number;
    targetGlucoseMax?: number;
    activityLevel?: string;
    reminderEnabled?: boolean;
    createdAt: string;
    updatedAt: string;
}

interface GlucoseStats {
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

// Health Profile types
interface HealthProfile {
    _id: string;
    firebaseUid: string;
    activityLevel?: string;
    exerciseFrequency?: string;
    sleepQuality?: number;
    stressLevel?: number;
    mealPreference?: string;
    onMedication: boolean;
    medicationCategory?: string;
    medicationFrequency?: string;
    lastPromptShown?: string;
    promptsDismissed: number;
    profileCompleteness: number;
}

interface HealthProfileResponse {
    exists: boolean;
    profile: HealthProfile | null;
}

// Prediction types
interface Prediction {
    predictedGlucose: number;
    riskLevel: 'normal' | 'elevated' | 'critical';
    confidence: number;
    recommendation: string;
    modelVersion: string;
    createdAt: string;
}

interface PredictionResponse {
    prediction: Prediction;
}

interface LatestPredictionResponse {
    exists: boolean;
    prediction: Prediction | null;
}

// Trend types
interface TrendData {
    direction: 'rising' | 'stable' | 'declining';
    currentAverage: number;
    previousAverage: number | null;
    percentageChange: number;
    totalReadings: number;
    riskPeriod: string;
    recommendation: string;
}

interface TrendsResponse {
    hasData: boolean;
    trend: TrendData | null;
}

// Meal types
interface MealData {
    _id: string;
    firebaseUid: string;
    carbsEstimate?: number;
    mealType: string;
    mealCategory?: string;
    description?: string;
    timestamp: string;
}

interface MealsResponse {
    meals: MealData[];
    pagination: Pagination;
}

// Activity types
interface ActivityData {
    _id: string;
    firebaseUid: string;
    activityLevel: string;
    activityType?: string;
    durationMinutes?: number;
    timestamp: string;
}

interface ActivitiesResponse {
    activities: ActivityData[];
    pagination: Pagination;
}

// Medication types
interface MedicationData {
    _id: string;
    firebaseUid: string;
    medicationName: string;
    medicationType: string;
    dosage: number;
    doseUnit: string;
    frequency: string;
    isInjectable: boolean;
    isActive: boolean;
    injectionSite?: string;
    prescribedBy?: string;
    notes?: string;
    startDate?: string;
    createdAt: string;
}

interface MedicationsResponse {
    medications: MedicationData[];
}

interface MedicationLogData {
    _id: string;
    firebaseUid: string;
    medicationName: string;
    medicationType: string;
    dosage: number;
    doseUnit: string;
    injectionSite?: string;
    takenAt: string;
    createdAt: string;
}

interface MedicationLogsResponse {
    logs: MedicationLogData[];
    pagination: Pagination;
}

interface InjectionSiteRecommendation {
    recommendedSite: string;
    lastUsedSite: string | null;
    siteUsage: Record<string, { count: number; lastUsed: string | null }>;
    totalInjections: number;
    tip: string;
}

// Notification types
interface NotificationData {
    _id: string;
    firebaseUid: string;
    type: 'prediction' | 'reminder' | 'medication' | 'insight' | 'achievement' | 'system';
    title: string;
    message: string;
    isRead: boolean;
    data?: Record<string, unknown>;
    createdAt: string;
}

interface NotificationsResponse {
    notifications: NotificationData[];
    unreadCount: number;
    pagination: Pagination;
}

// Trend Prediction types
interface TrendPrediction {
    direction: 'rising' | 'stable' | 'dropping';
    predictedNextGlucose: number;
    confidence: number;
    timeframe: string;
    recommendation: string;
    riskAlert?: string;
    factors: string[];
}

// 30-min Glucose Forecast types
interface Glucose30Prediction {
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
}

interface Glucose30Response {
    hasData: boolean;
    prediction: Glucose30Prediction | null;
}

// Wellness log types
interface MoodLogEntry {
    _id: string;
    firebaseUid: string;
    mood: 'Great' | 'Good' | 'Okay' | 'Low' | 'Rough';
    period: 'morning' | 'afternoon' | 'evening';
    note?: string;
    createdAt: string;
}

interface LifestyleLogEntry {
    _id: string;
    firebaseUid: string;
    exerciseFrequency: 'rare' | 'moderate' | 'frequent';
    sleepQuality: number;
    stressLevel: number;
    createdAt: string;
}

interface ForecastLogEntry {
    _id: string;
    firebaseUid: string;
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
    currentGlucose: number;
    triggerEvent: string;
    actualGlucose?: number;
    createdAt: string;
}

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private async request<T>(
        endpoint: string,
        options: FetchOptions = {}
    ): Promise<T> {
        const { token, ...fetchOptions } = options;

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...fetchOptions,
                headers,
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: 'Request failed' }));
                throw new Error(error.error || `HTTP error! status: ${response.status}`);
            }

            return response.json();
        } catch (error) {
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                throw new Error('Unable to connect to server. Please ensure the backend is running.');
            }
            throw error;
        }
    }

    // User endpoints
    async createUser(data: { firebaseUid: string; email: string; displayName?: string }): Promise<UserData> {
        return this.request<UserData>('/users', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getUser(firebaseUid: string): Promise<UserData> {
        return this.request<UserData>(`/users?firebaseUid=${firebaseUid}`);
    }

    async updateUser(firebaseUid: string, data: Record<string, unknown>): Promise<UserData> {
        return this.request<UserData>('/users', {
            method: 'PUT',
            body: JSON.stringify({ firebaseUid, ...data }),
        });
    }

    // Glucose endpoints
    async createGlucoseReading(data: {
        firebaseUid: string;
        value: number;
        unit?: string;
        readingType?: string;
        mealContext?: string;
        activityContext?: string;
        notes?: string;
        recordedAt?: string;
        medicationTaken?: boolean;
        medicationName?: string;
        medicationType?: string;
        medicationDose?: number;
        medicationDoseUnit?: string;
        injectionSite?: string;
    }): Promise<GlucoseReading> {
        return this.request<GlucoseReading>('/glucose', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getGlucoseReadings(params: {
        firebaseUid: string;
        startDate?: string;
        endDate?: string;
        limit?: number;
        page?: number;
    }): Promise<GlucoseReadingsResponse> {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
                searchParams.append(key, String(value));
            }
        });
        return this.request<GlucoseReadingsResponse>(`/glucose?${searchParams.toString()}`);
    }

    async getGlucoseReading(id: string): Promise<GlucoseReading> {
        return this.request<GlucoseReading>(`/glucose/${id}`);
    }

    async updateGlucoseReading(id: string, data: Record<string, unknown>): Promise<GlucoseReading> {
        return this.request<GlucoseReading>(`/glucose/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteGlucoseReading(id: string): Promise<{ message: string }> {
        return this.request<{ message: string }>(`/glucose/${id}`, {
            method: 'DELETE',
        });
    }

    async getGlucoseStats(firebaseUid: string, days: number = 7): Promise<GlucoseStats> {
        return this.request<GlucoseStats>(`/glucose/stats?firebaseUid=${firebaseUid}&days=${days}`);
    }

    // ── Health Profile endpoints ──────────────────────────────────────────

    async getHealthProfile(firebaseUid: string): Promise<HealthProfileResponse> {
        return this.request<HealthProfileResponse>(`/health-profile?firebaseUid=${firebaseUid}`);
    }

    async upsertHealthProfile(
        firebaseUid: string,
        data: Record<string, unknown>
    ): Promise<HealthProfileResponse> {
        return this.request<HealthProfileResponse>('/health-profile', {
            method: 'POST',
            body: JSON.stringify({ firebaseUid, ...data }),
        });
    }

    async dismissHealthPrompt(firebaseUid: string): Promise<{ profile: HealthProfile }> {
        return this.request<{ profile: HealthProfile }>('/health-profile/dismiss', {
            method: 'POST',
            body: JSON.stringify({ firebaseUid }),
        });
    }

    // ── Prediction endpoints ──────────────────────────────────────────────

    async requestPrediction(firebaseUid: string): Promise<PredictionResponse> {
        return this.request<PredictionResponse>('/predict', {
            method: 'POST',
            body: JSON.stringify({ firebaseUid }),
        });
    }

    async getLatestPrediction(firebaseUid: string): Promise<LatestPredictionResponse> {
        return this.request<LatestPredictionResponse>(`/predict/latest?firebaseUid=${firebaseUid}`);
    }

    async getPredictionHistory(firebaseUid: string, limit: number = 10): Promise<{ predictions: Prediction[] }> {
        return this.request<{ predictions: Prediction[] }>(
            `/predict/history?firebaseUid=${firebaseUid}&limit=${limit}`
        );
    }

    async getTrends(firebaseUid: string): Promise<TrendsResponse> {
        return this.request<TrendsResponse>(`/predict/trends?firebaseUid=${firebaseUid}`);
    }

    // ── Meal endpoints ────────────────────────────────────────────────────

    async createMeal(data: {
        firebaseUid: string;
        mealType: string;
        carbsEstimate?: number;
        mealCategory?: string;
        description?: string;
        timestamp?: string;
    }): Promise<MealData> {
        return this.request<MealData>('/meals', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getMeals(firebaseUid: string, limit: number = 50): Promise<MealsResponse> {
        return this.request<MealsResponse>(`/meals?firebaseUid=${firebaseUid}&limit=${limit}`);
    }

    // ── Activity endpoints ────────────────────────────────────────────────

    async createActivity(data: {
        firebaseUid: string;
        activityLevel: string;
        activityType?: string;
        durationMinutes?: number;
        timestamp?: string;
    }): Promise<ActivityData> {
        return this.request<ActivityData>('/activities', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getActivities(firebaseUid: string, limit: number = 50): Promise<ActivitiesResponse> {
        return this.request<ActivitiesResponse>(`/activities?firebaseUid=${firebaseUid}&limit=${limit}`);
    }

    // ── Medication endpoints ──────────────────────────────────────────────

    async createMedication(data: {
        firebaseUid: string;
        medicationName: string;
        medicationType: string;
        dosage: number;
        doseUnit?: string;
        frequency?: string;
        isInjectable?: boolean;
        prescribedBy?: string;
        notes?: string;
    }): Promise<MedicationData> {
        return this.request<MedicationData>('/medications', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getMedications(firebaseUid: string, activeOnly: boolean = true): Promise<MedicationsResponse> {
        return this.request<MedicationsResponse>(
            `/medications?firebaseUid=${firebaseUid}&activeOnly=${activeOnly}`
        );
    }

    async updateMedication(id: string, data: Record<string, unknown>): Promise<MedicationData> {
        return this.request<MedicationData>(`/medications/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteMedication(id: string): Promise<{ message: string }> {
        return this.request<{ message: string }>(`/medications/${id}`, {
            method: 'DELETE',
        });
    }

    async logMedication(data: {
        firebaseUid: string;
        medicationName: string;
        medicationType: string;
        dosage: number;
        doseUnit?: string;
        injectionSite?: string;
        glucoseReadingId?: string;
        takenAt?: string;
        notes?: string;
    }): Promise<MedicationLogData> {
        return this.request<MedicationLogData>('/medications/log', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getMedicationLogs(firebaseUid: string, limit: number = 50): Promise<MedicationLogsResponse> {
        return this.request<MedicationLogsResponse>(
            `/medications/logs?firebaseUid=${firebaseUid}&limit=${limit}`
        );
    }

    async getInjectionSiteRecommendation(firebaseUid: string): Promise<InjectionSiteRecommendation> {
        return this.request<InjectionSiteRecommendation>(
            `/medications/injection-sites?firebaseUid=${firebaseUid}`
        );
    }

    // ── Notification endpoints ────────────────────────────────────────────

    async getNotifications(firebaseUid: string, unreadOnly: boolean = false): Promise<NotificationsResponse> {
        return this.request<NotificationsResponse>(
            `/notifications?firebaseUid=${firebaseUid}&unreadOnly=${unreadOnly}`
        );
    }

    async getUnreadNotificationCount(firebaseUid: string): Promise<{ unreadCount: number }> {
        return this.request<{ unreadCount: number }>(
            `/notifications/unread-count?firebaseUid=${firebaseUid}`
        );
    }

    async markNotificationRead(id: string): Promise<NotificationData> {
        return this.request<NotificationData>(`/notifications/${id}/read`, {
            method: 'PUT',
        });
    }

    async markAllNotificationsRead(firebaseUid: string): Promise<{ message: string }> {
        return this.request<{ message: string }>('/notifications/read-all', {
            method: 'POST',
            body: JSON.stringify({ firebaseUid }),
        });
    }

    async createNotification(data: {
        firebaseUid: string;
        type: string;
        title: string;
        message: string;
        data?: Record<string, unknown>;
    }): Promise<NotificationData> {
        return this.request<NotificationData>('/notifications', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async deleteNotification(id: string): Promise<{ message: string }> {
        return this.request<{ message: string }>(`/notifications/${id}`, {
            method: 'DELETE',
        });
    }

    // ── 30-minute Glucose Forecast ────────────────────────────────────────

    async getGlucose30(firebaseUid: string, trigger?: string): Promise<Glucose30Response> {
        const triggerParam = trigger ? `&trigger=${trigger}` : '';
        return this.request<Glucose30Response>(`/predict/glucose-30?firebaseUid=${firebaseUid}${triggerParam}`);
    }

    async getForecastHistory(firebaseUid: string, limit: number = 20): Promise<{ forecasts: ForecastLogEntry[] }> {
        return this.request<{ forecasts: ForecastLogEntry[] }>(
            `/predict/forecast-history?firebaseUid=${firebaseUid}&limit=${limit}`
        );
    }

    // ── Wellness (Mood + Lifestyle individual logs) ───────────────────────

    async logMood(data: {
        firebaseUid: string;
        mood: string;
        period: string;
        note?: string;
    }): Promise<{ success: boolean; moodLog: MoodLogEntry }> {
        return this.request<{ success: boolean; moodLog: MoodLogEntry }>('/wellness/mood', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getMoodLogs(firebaseUid: string, limit: number = 20): Promise<{ logs: MoodLogEntry[] }> {
        return this.request<{ logs: MoodLogEntry[] }>(
            `/wellness/mood?firebaseUid=${firebaseUid}&limit=${limit}`
        );
    }

    async getLatestMood(firebaseUid: string): Promise<{ exists: boolean; moodLog: MoodLogEntry | null }> {
        return this.request<{ exists: boolean; moodLog: MoodLogEntry | null }>(
            `/wellness/mood/latest?firebaseUid=${firebaseUid}`
        );
    }

    async logLifestyle(data: {
        firebaseUid: string;
        exerciseFrequency: string;
        sleepQuality: number;
        stressLevel: number;
    }): Promise<{ success: boolean; lifestyleLog: LifestyleLogEntry }> {
        return this.request<{ success: boolean; lifestyleLog: LifestyleLogEntry }>('/wellness/lifestyle', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getLifestyleLogs(firebaseUid: string, limit: number = 20): Promise<{ logs: LifestyleLogEntry[] }> {
        return this.request<{ logs: LifestyleLogEntry[] }>(
            `/wellness/lifestyle?firebaseUid=${firebaseUid}&limit=${limit}`
        );
    }

    // Health check
    async healthCheck(): Promise<{ status: string; message: string; timestamp: string }> {
        return this.request<{ status: string; message: string; timestamp: string }>('/health');
    }
}

export const api = new ApiClient(API_URL);
export default api;
