import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import userRoutes from './routes/user.routes';
import glucoseRoutes from './routes/glucose.routes';
import { errorHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

// Initialize Firebase after env is loaded
import { initializeFirebase } from './config/firebase';
initializeFirebase();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Bluely API is running',
        timestamp: new Date().toISOString(),
    });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/glucose', glucoseRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Connect to database and start server
const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(` Server running on port ${PORT}`);
            console.log(` Health check: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

export default app;
