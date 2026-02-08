import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    updateProfile,
    User,
    UserCredential,
    GoogleAuthProvider,
    signInWithPopup,
} from 'firebase/auth';
import { auth } from './config';

const googleProvider = new GoogleAuthProvider();

// Sign up with email and password
export const signUp = async (
    email: string,
    password: string,
    displayName: string
): Promise<UserCredential> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // Update user profile with display name
    await updateProfile(userCredential.user, { displayName });

    return userCredential;
};

// Sign in with email and password
export const signIn = async (
    email: string,
    password: string
): Promise<UserCredential> => {
    return signInWithEmailAndPassword(auth, email, password);
};

// Sign out
export const logOut = async (): Promise<void> => {
    return signOut(auth);
};

// Send password reset email
export const resetPassword = async (email: string): Promise<void> => {
    return sendPasswordResetEmail(auth, email);
};

// Get current user
export const getCurrentUser = (): User | null => {
    return auth.currentUser;
};

// Get ID token for API calls
export const getIdToken = async (): Promise<string | null> => {
    const user = auth.currentUser;
    if (!user) return null;
    return user.getIdToken();
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<UserCredential> => {
    return signInWithPopup(auth, googleProvider);
};
