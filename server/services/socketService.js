import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

let io;

export const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credenitals: true
        }
    });

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId);

            if (!user) {
                return next(new Error('User not found'));
            }

            socket.user = user;
            next();
        } catch (err) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.user.name} (${socket.user._id})`);

        // Join user to their own room for private notifications
        socket.join(socket.user._id.toString());

        // Join user to their organization room
        if (socket.user.organization) {
            socket.join(socket.user.organization.toString());
        }

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.user.name}`);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

// Notification Helper
export const sendNotification = async (userId, type, payload) => {
    // 1. Create persistent record
    try {
        const titleMap = {
            invite: 'New Invitation',
            mention: 'You were mentioned',
            system: 'System Notification'
        };

        const notification = new Notification({
            recipient: userId,
            type,
            title: payload.title || titleMap[type] || 'New Notification',
            message: payload.message,
            link: payload.link,
            data: payload
        });
        await notification.save();

        // 2. Emit real-time event if connected
        if (io) {
            io.to(userId.toString()).emit('notification', notification);
        }
    } catch (err) {
        console.error('Error saving notification:', err);
    }
};

// Organization Broadcast Helper
export const broadcastToOrg = (orgId, type, payload) => {
    if (!io) return;
    io.to(orgId.toString()).emit('org_update', {
        type,
        ...payload,
        timestamp: new Date()
    });
};
