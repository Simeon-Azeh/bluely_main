import admin from 'firebase-admin';

let firebaseInitialized = false;

export const initializeFirebase = () => {
    if (admin.apps.length === 0 && !firebaseInitialized) {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

        if (projectId && clientEmail && privateKey) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
            });
            console.log('✅ Firebase Admin initialized');
            firebaseInitialized = true;
        } else {
            console.warn('⚠️ Firebase Admin SDK credentials not configured');
            // Initialize without credentials for development
            admin.initializeApp({
                projectId: projectId || 'bluely-development',
            });
            firebaseInitialized = true;
        }
    }
    return admin;
};

// Lazy getter for firebase admin
export const getFirebaseAdmin = () => {
    if (!firebaseInitialized) {
        initializeFirebase();
    }
    return admin;
};

export default admin;
