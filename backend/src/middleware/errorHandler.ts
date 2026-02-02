import { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
    statusCode?: number;
    status?: string;
    isOperational?: boolean;
}

export const errorHandler = (
    err: AppError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const statusCode = err.statusCode || 500;
    const status = err.status || 'error';

    console.error('Error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });

    if (process.env.NODE_ENV === 'development') {
        res.status(statusCode).json({
            status,
            error: err.message,
            stack: err.stack,
        });
    } else {
        // Production: don't leak error details
        res.status(statusCode).json({
            status,
            error: statusCode === 500 ? 'Internal server error' : err.message,
        });
    }
};

export class ApiError extends Error {
    statusCode: number;
    status: string;
    isOperational: boolean;

    constructor(statusCode: number, message: string) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

export default errorHandler;
