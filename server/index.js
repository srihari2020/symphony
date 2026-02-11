import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import authRoutes from './routes/auth.js';
import orgRoutes from './routes/organizations.js';
import projectRoutes from './routes/projects.js';
import integrationRoutes from './routes/integrations.js';
import { startScheduler } from './services/scheduler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
    'http://localhost:5173',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc)
        if (!origin) return callback(null, true);
        if (allowedOrigins.some(allowed => origin.includes(allowed.replace('https://', '').replace('http://', '')))) {
            return callback(null, true);
        }
        callback(null, true); // Allow all for development
    },
    credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/organizations', orgRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/integrations', integrationRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Connect to MongoDB and start server
async function startServer() {
    let mongoUri = process.env.MONGODB_URI;

    const mongoOptions = {
        serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
        socketTimeoutMS: 45000,
    };

    // If using localhost MongoDB, try to connect; if it fails, use in-memory MongoDB
    if (!mongoUri || mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1')) {
        try {
            // Try connecting to local MongoDB first
            await mongoose.connect(mongoUri || 'mongodb://localhost:27017/symphony', mongoOptions);
            console.log('Connected to local MongoDB');
        } catch (err) {
            console.log('Local MongoDB not available, starting in-memory MongoDB server...');
            const mongod = await MongoMemoryServer.create();
            mongoUri = mongod.getUri();
            await mongoose.connect(mongoUri, mongoOptions);
            console.log('Connected to in-memory MongoDB (data will not persist after restart)');
        }
    } else {
        // For remote MongoDB (like Atlas), connect directly with retries
        let retries = 3;
        while (retries > 0) {
            try {
                await mongoose.connect(mongoUri, mongoOptions);
                console.log('Connected to MongoDB');
                break;
            } catch (err) {
                retries--;
                console.log(`MongoDB connection failed. Retries left: ${retries}`);
                if (retries === 0) {
                    throw err;
                }
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retry
            }
        }
    }

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
        startScheduler();
    });
}

startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
