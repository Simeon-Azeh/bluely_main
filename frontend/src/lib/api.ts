const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface FetchOptions extends RequestInit {
    token?: string;
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

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...fetchOptions,
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || `HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    // User endpoints
    async createUser(data: { firebaseUid: string; email: string; displayName: string }) {
        return this.request('/users', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getUser(firebaseUid: string) {
        return this.request(`/users?firebaseUid=${firebaseUid}`);
    }

    async updateUser(firebaseUid: string, data: Record<string, unknown>) {
        return this.request('/users', {
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
    }) {
        return this.request('/glucose', {
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
    }) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
                searchParams.append(key, String(value));
            }
        });
        return this.request(`/glucose?${searchParams.toString()}`);
    }

    async getGlucoseReading(id: string) {
        return this.request(`/glucose/${id}`);
    }

    async updateGlucoseReading(id: string, data: Record<string, unknown>) {
        return this.request(`/glucose/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteGlucoseReading(id: string) {
        return this.request(`/glucose/${id}`, {
            method: 'DELETE',
        });
    }

    async getGlucoseStats(firebaseUid: string, days: number = 7) {
        return this.request(`/glucose/stats?firebaseUid=${firebaseUid}&days=${days}`);
    }

    // Health check
    async healthCheck() {
        return this.request('/health');
    }
}

export const api = new ApiClient(API_URL);
export default api;
