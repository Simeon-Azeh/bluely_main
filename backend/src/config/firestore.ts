import { getFirebaseAdmin } from './firebase';

export const connectFirestore = async (): Promise<void> => {
    getFirebaseAdmin().firestore();
    console.log(' Firestore initialized');
};

export default connectFirestore;