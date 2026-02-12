import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createServer } from 'http'; // Moved to top

import authRoutes from './routes/auth.js';
import orgRoutes from './routes/organizations.js';
import projectRoutes from './routes/projects.js';
import integrationRoutes from './routes/integrations.js';
import memberRoutes from './routes/members.js';
import invitationRoutes from './routes/invitations.js';
import taskRoutes from './routes/taskRoutes.js';
import notificationRoutes from './routes/notifications.js'; // Moved to top
import postRoutes from './routes/posts.js'; // Moved to top
import { startScheduler } from './services/scheduler.js';
import { initSocket } from './services/socketService.js'; // Moved to top

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
app.use('/api/organizations', memberRoutes); // Member routes use org prefix
app.use('/api/projects', projectRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/posts', postRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Create HTTP Server
const httpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer);

// Connect to MongoDB and start server
async function startServer() {
    console.log('=== Starting Symphony Server ===');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('PORT:', process.env.PORT || 5000);

    let mongoUri = process.env.MONGODB_URI;
    console.log('MongoDB URI provided:', mongoUri ? 'Yes (length: ' + mongoUri.length + ')' : 'No');

    const mongoOptions = {
        serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
        socketTimeoutMS: 45000,
    };

    // If using localhost MongoDB, try to connect; if it fails, use in-memory MongoDB
    if (!mongoUri || mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1')) {
        console.log('Attempting local MongoDB connection...');
        try {
            // Try connecting to local MongoDB first
            await mongoose.connect(mongoUri || 'mongodb://localhost:27017/symphony', mongoOptions);
            console.log('✓ Connected to local MongoDB');
        } catch (err) {
            console.log('Local MongoDB not available, starting in-memory MongoDB server...');
            const mongod = await MongoMemoryServer.create();
            mongoUri = mongod.getUri();
            await mongoose.connect(mongoUri, mongoOptions);
            console.log('✓ Connected to in-memory MongoDB (data will not persist after restart)');
        }
    } else {
        // For remote MongoDB (like Atlas), connect directly with retries
        console.log('Attempting remote MongoDB connection...');
        let retries = 3;
        while (retries > 0) {
            try {
                console.log(`Connection attempt ${4 - retries} of 3...`);
                await mongoose.connect(mongoUri, mongoOptions);
                console.log('✓ Connected to MongoDB Atlas');
                break;
            } catch (err) {
                retries--;
                console.error(`✗ MongoDB connection failed:`, err.message);
                console.log(`Retries left: ${retries}`);
                if (retries === 0) {
                    console.error('!!! Failed to connect to MongoDB after 3 attempts');
                    throw err;
                }
                console.log('Waiting 5 seconds before retry...');
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retry
            }
        }
    }

    httpServer.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
        // Start scheduler after server is listening
        try {
            startScheduler();
            console.log('Scheduler started successfully');
        } catch (err) {
            console.error('Scheduler failed to start, but server is running:', err.message);
        }
    });
}

startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
