import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Bluely API Documentation',
            version: '1.0.0',
            description: 'API documentation for Bluely - Diabetes Self-Management System',
            contact: {
                name: 'Bluely Support',
                email: 'support@bluely.com',
            },
        },
        servers: [
            {
                url: 'http://localhost:5000/api',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', description: 'MongoDB ObjectId' },
                        firebaseUid: { type: 'string', description: 'Firebase User ID' },
                        email: { type: 'string', format: 'email', description: 'User email' },
                        displayName: { type: 'string', description: 'User display name' },
                        diabetesType: {
                            type: 'string',
                            enum: ['type1', 'type2', 'gestational', 'prediabetes', 'other'],
                            description: 'Type of diabetes'
                        },
                        diagnosisYear: { type: 'number', description: 'Year of diagnosis' },
                        preferredUnit: {
                            type: 'string',
                            enum: ['mg/dL', 'mmol/L'],
                            description: 'Preferred glucose measurement unit'
                        },
                        targetGlucoseMin: { type: 'number', description: 'Minimum target glucose level' },
                        targetGlucoseMax: { type: 'number', description: 'Maximum target glucose level' },
                        onboardingCompleted: { type: 'boolean', description: 'Whether user completed onboarding' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                GlucoseReading: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', description: 'MongoDB ObjectId' },
                        userId: { type: 'string', description: 'Reference to User' },
                        firebaseUid: { type: 'string', description: 'Firebase User ID' },
                        value: { type: 'number', description: 'Glucose reading value' },
                        unit: {
                            type: 'string',
                            enum: ['mg/dL', 'mmol/L'],
                            description: 'Measurement unit'
                        },
                        readingType: {
                            type: 'string',
                            enum: ['fasting', 'before_meal', 'after_meal', 'bedtime', 'random'],
                            description: 'Type of reading'
                        },
                        mealContext: { type: 'string', description: 'Meal context information' },
                        activityContext: { type: 'string', description: 'Activity context information' },
                        notes: { type: 'string', description: 'Additional notes' },
                        recordedAt: { type: 'string', format: 'date-time', description: 'When the reading was taken' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                GlucoseStats: {
                    type: 'object',
                    properties: {
                        totalReadings: { type: 'number', description: 'Total number of readings' },
                        averageGlucose: { type: 'number', nullable: true, description: 'Average glucose value' },
                        minGlucose: { type: 'number', nullable: true, description: 'Minimum glucose value' },
                        maxGlucose: { type: 'number', nullable: true, description: 'Maximum glucose value' },
                        inRangePercentage: { type: 'number', nullable: true, description: 'Percentage of readings in target range' },
                        belowRangePercentage: { type: 'number', nullable: true, description: 'Percentage below target range' },
                        aboveRangePercentage: { type: 'number', nullable: true, description: 'Percentage above target range' },
                        targetMin: { type: 'number', description: 'Target minimum glucose' },
                        targetMax: { type: 'number', description: 'Target maximum glucose' },
                        readingsByDay: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    date: { type: 'string', format: 'date' },
                                    average: { type: 'number' },
                                    readings: { type: 'array', items: { type: 'object' } },
                                },
                            },
                        },
                    },
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'string', description: 'Error message' },
                    },
                },
            },
        },
        tags: [
            { name: 'Health', description: 'Health check endpoints' },
            { name: 'Users', description: 'User management endpoints' },
            { name: 'Glucose', description: 'Glucose reading endpoints' },
        ],
    },
    apis: ['./src/routes/*.ts', './src/server.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
