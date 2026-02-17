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

    // Health check
    async healthCheck(): Promise<{ status: string; message: string; timestamp: string }> {
        return this.request<{ status: string; message: string; timestamp: string }>('/health');
    }
}

export const api = new ApiClient(API_URL);
export default api;
