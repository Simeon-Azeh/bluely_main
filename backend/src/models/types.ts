export interface FirestoreDocument {
    _id: string;
    id: string;
    toObject(): Record<string, any>;
}

export interface IUser extends FirestoreDocument {
    firebaseUid: string;
    email: string;
    displayName: string;
    dateOfBirth?: Date;
    diabetesType?: 'type1' | 'type2' | 'gestational' | 'prediabetes' | 'other';
    diagnosisYear?: number;
    targetGlucoseMin: number;
    targetGlucoseMax: number;
    preferredUnit: 'mg/dL' | 'mmol/L';
    timezone?: string;
    shareDataWithDiaBuddy: boolean;
    onboardingCompleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface IGlucoseReading extends FirestoreDocument {
    userId: string;
    firebaseUid: string;
    value: number;
    unit: 'mg/dL' | 'mmol/L';
    readingType: 'fasting' | 'before_meal' | 'after_meal' | 'bedtime' | 'random' | 'other';
    mealContext?: string;
    activityContext?: string;
    notes?: string;
    medicationTaken?: boolean;
    medicationTiming?: string;
    medicationName?: string;
    medicationType?: string;
    medicationDose?: number;
    medicationDoseUnit?: string;
    injectionSite?: string;
    recordedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface IMeal extends FirestoreDocument {
    userId: string;
    firebaseUid: string;
    carbsEstimate?: number;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    mealCategory?: 'home_cooked' | 'processed' | 'restaurant' | 'other';
    description?: string;
    timestamp: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface IActivity extends FirestoreDocument {
    userId: string;
    firebaseUid: string;
    activityLevel: 'low' | 'medium' | 'high';
    activityType?: 'walking' | 'running' | 'gym' | 'sports' | 'other';
    durationMinutes?: number;
    timestamp: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface IUserHealthProfile extends FirestoreDocument {
    userId: string;
    firebaseUid: string;
    activityLevel?: 'low' | 'medium' | 'high';
    exerciseFrequency?: 'rare' | 'moderate' | 'frequent';
    sleepQuality?: number;
    stressLevel?: number;
    mealPreference?: 'home_cooked' | 'processed' | 'mixed';
    onMedication: boolean;
    medicationCategory?: 'none' | 'insulin' | 'oral' | 'other';
    medicationFrequency?: 'daily' | 'occasionally' | 'none';
    lastPromptShown?: Date;
    promptsDismissed: number;
    profileCompleteness: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IPredictionAnalysis extends FirestoreDocument {
    userId: string;
    firebaseUid: string;
    predictedGlucose: number;
    riskLevel: 'normal' | 'elevated' | 'critical';
    confidence: number;
    features: Record<string, unknown>;
    modelVersion: string;
    recommendation?: string;
    createdAt: Date;
}

export interface IMedication extends FirestoreDocument {
    userId: string;
    firebaseUid: string;
    medicationName: string;
    medicationType: 'insulin_rapid' | 'insulin_long' | 'insulin_mixed' | 'metformin' | 'sulfonylurea' | 'other';
    dosage: number;
    doseUnit: string;
    frequency: 'once_daily' | 'twice_daily' | 'three_daily' | 'before_meals' | 'after_meals' | 'at_bedtime' | 'as_needed' | 'weekly';
    isInjectable: boolean;
    isActive: boolean;
    prescribedBy?: string;
    notes?: string;
    startDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface IMedicationLog extends FirestoreDocument {
    userId: string;
    firebaseUid: string;
    medicationName: string;
    medicationType: string;
    dosage: number;
    doseUnit: string;
    injectionSite?: string;
    glucoseReadingId?: string;
    takenAt: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface INotification extends FirestoreDocument {
    userId: string;
    firebaseUid: string;
    type: 'prediction' | 'reminder' | 'medication' | 'insight' | 'achievement' | 'system';
    title: string;
    message: string;
    isRead: boolean;
    data?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

export interface IMoodLog extends FirestoreDocument {
    userId: string;
    firebaseUid: string;
    mood: 'Great' | 'Good' | 'Okay' | 'Low' | 'Rough';
    period: 'morning' | 'afternoon' | 'evening';
    note?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ILifestyleLog extends FirestoreDocument {
    userId: string;
    firebaseUid: string;
    exerciseFrequency: 'rare' | 'moderate' | 'frequent';
    sleepQuality: number;
    stressLevel: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IForecastLog extends FirestoreDocument {
    userId: string;
    firebaseUid: string;
    predictedGlucose: number;
    direction: string;
    directionArrow: string;
    directionLabel: string;
    confidence: number;
    timeframe: string;
    recommendation: string;
    riskAlert?: string | null;
    factors: string[];
    modelUsed: string;
    currentGlucose: number;
    triggerEvent: 'glucose_log' | 'meal_log' | 'activity_log' | 'medication_log' | 'manual' | 'auto';
    actualGlucose?: number;
    actualLoggedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface IPatientModelProfile extends FirestoreDocument {
    userId: string;
    firebaseUid: string;
    trainingSamples: number;
    isPersonalized: boolean;
    baselineGlucoseBias: number;
    insulinSensitivityFactor: number;
    carbResponseFactor: number;
    activityResponseFactor: number;
    ewmaResidual: number;
    lastPredictionAccuracy: number | null;
    lastUpdated: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface IStorySubmission extends FirestoreDocument {
    name: string;
    email: string;
    phone?: string;
    location: string;
    diabetesType: 'type1' | 'type2' | 'gestational' | 'prediabetes' | 'other' | 'prefer_not_to_say';
    diagnosisYear?: number;
    story: string;
    permissionToContact: boolean;
    status: 'new' | 'reviewed' | 'published' | 'archived';
    createdAt: Date;
    updatedAt: Date;
}

export interface INewsletterSubscription extends FirestoreDocument {
    email: string;
    source: 'homepage';
    status: 'active' | 'unsubscribed';
    subscribedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
