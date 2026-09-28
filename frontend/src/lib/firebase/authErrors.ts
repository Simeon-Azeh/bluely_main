type FieldFeedback = { target: 'email' | 'password' | 'form'; message: string; emailInUse?: boolean };

function authCode(error: unknown): string | null {
    if (!error || typeof error !== 'object' || !('code' in error)) return null;
    const code = error.code;
    return typeof code === 'string' && code.startsWith('auth/') ? code : null;
}

export function signupFeedback(error: unknown): FieldFeedback {
    switch (authCode(error)) {
        case 'auth/email-already-in-use':
            return { target: 'email', message: 'This email already has a Bluely account.', emailInUse: true };
        case 'auth/invalid-email':
            return { target: 'email', message: 'Check the email address and try again.' };
        case 'auth/weak-password':
            return { target: 'password', message: 'Choose a stronger password and try again.' };
        case 'auth/network-request-failed':
            return { target: 'form', message: 'We could not connect. Check your internet and try again.' };
        case 'auth/too-many-requests':
            return { target: 'form', message: 'Too many attempts right now. Please wait a little before trying again.' };
        case 'auth/operation-not-allowed':
            return { target: 'form', message: 'Email signup is unavailable right now. Please try again later.' };
        default:
            return { target: 'form', message: 'We could not finish signup. Please try signing in, or try again.' };
    }
}

export function loginFeedback(error: unknown): FieldFeedback {
    switch (authCode(error)) {
        case 'auth/invalid-email':
            return { target: 'email', message: 'Check the email address and try again.' };
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
            return { target: 'password', message: 'Those details did not match. Check them or reset your password.' };
        case 'auth/user-disabled':
            return { target: 'form', message: 'This account is unavailable. Please contact Bluely support.' };
        case 'auth/network-request-failed':
            return { target: 'form', message: 'We could not connect. Check your internet and try again.' };
        case 'auth/too-many-requests':
            return { target: 'form', message: 'Too many sign-in attempts. Please wait a little before trying again.' };
        default:
            return { target: 'form', message: 'We could not sign you in right now. Please try again.' };
    }
}

export function googleSignInFeedback(error: unknown): string | null {
    switch (authCode(error)) {
        case 'auth/popup-closed-by-user':
        case 'auth/cancelled-popup-request':
            return null;
        case 'auth/popup-blocked':
            return 'Your browser blocked the Google window. Allow pop-ups and try again.';
        case 'auth/account-exists-with-different-credential':
            return 'An account with this email uses another sign-in method. Try signing in with email.';
        case 'auth/network-request-failed':
            return 'We could not connect to Google. Check your internet and try again.';
        case 'auth/too-many-requests':
            return 'Too many attempts right now. Please wait a little before trying again.';
        case 'auth/unauthorized-domain':
        case 'auth/operation-not-allowed':
            return 'Google sign in is unavailable here right now. Please use your email instead.';
        default:
            return 'Google sign in did not finish. Please try again.';
    }
}
