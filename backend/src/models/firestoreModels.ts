import { FirestoreModel } from '../services/firestoreModel';
import type {
    IUser,
    IGlucoseReading,
    IMeal,
    IActivity,
    IUserHealthProfile,
    IPredictionAnalysis,
    IMedication,
    IMedicationLog,
    INotification,
    IMoodLog,
    ILifestyleLog,
    IForecastLog,
    IPatientModelProfile,
    IStorySubmission,
    INewsletterSubscription,
    IContactMessage,
    IVolunteerApplication,
} from './types';

export type {
    IUser,
    IGlucoseReading,
    IMeal,
    IActivity,
    IUserHealthProfile,
    IPredictionAnalysis,
    IMedication,
    IMedicationLog,
    INotification,
    IMoodLog,
    ILifestyleLog,
    IForecastLog,
    IPatientModelProfile,
    IStorySubmission,
    INewsletterSubscription,
    IContactMessage,
    IVolunteerApplication,
} from './types';

export const User = new FirestoreModel<IUser>('users');
export const GlucoseReading = new FirestoreModel<IGlucoseReading>('glucoseReadings');
export const Meal = new FirestoreModel<IMeal>('meals');
export const Activity = new FirestoreModel<IActivity>('activities');
export const UserHealthProfile = new FirestoreModel<IUserHealthProfile>('userHealthProfiles');
export const PredictionAnalysis = new FirestoreModel<IPredictionAnalysis>('predictionAnalyses');
export const Medication = new FirestoreModel<IMedication>('medications');
export const MedicationLog = new FirestoreModel<IMedicationLog>('medicationLogs');
export const Notification = new FirestoreModel<INotification>('notifications');
export const MoodLog = new FirestoreModel<IMoodLog>('moodLogs');
export const LifestyleLog = new FirestoreModel<ILifestyleLog>('lifestyleLogs');
export const ForecastLog = new FirestoreModel<IForecastLog>('forecastLogs');
export const PatientModelProfile = new FirestoreModel<IPatientModelProfile>('patientModelProfiles');
export const StorySubmission = new FirestoreModel<IStorySubmission>('storySubmissions');
export const NewsletterSubscription = new FirestoreModel<INewsletterSubscription>('newsletterSubscriptions');
export const ContactMessage = new FirestoreModel<IContactMessage>('contactMessages');
export const VolunteerApplication = new FirestoreModel<IVolunteerApplication>('volunteerApplications');
