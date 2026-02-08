import { Request, Response, NextFunction } from 'express';
import { getFirebaseAdmin } from '../config/firebase';

export interface AuthRequest extends Request {
    user?: {
        uid: string;
        email?: string;
    };
}

export const authMiddleware = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }

        const token = authHeader.split('Bearer ')[1];

        try {
            // Verify Firebase ID token
            const firebaseAdmin = getFirebaseAdmin();
            const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
            req.user = {
                uid: decodedToken.uid,
                email: decodedToken.email,
            };
            next();
        } catch (firebaseError) {
            // For development, allow a simple token format
            if (process.env.NODE_ENV === 'development' && token.startsWith('dev_')) {
                const uid = token.replace('dev_', '');
                req.user = { uid };
                next();
                return;
            }
            throw firebaseError;
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

export default authMiddleware;
