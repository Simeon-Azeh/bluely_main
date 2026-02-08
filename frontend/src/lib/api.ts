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

    // Health check
    async healthCheck(): Promise<{ status: string; message: string; timestamp: string }> {
        return this.request<{ status: string; message: string; timestamp: string }>('/health');
    }
}

export const api = new ApiClient(API_URL);
export default api;
