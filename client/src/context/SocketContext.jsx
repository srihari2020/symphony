import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const { user, token } = useAuth();
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Initialize Socket Connection
    useEffect(() => {
        if (token && user) {
            const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
                auth: { token },
                withCredentials: true
            });

            newSocket.on('connect', () => {
                console.log('Socket connected');
            });

            newSocket.on('connect_error', (err) => {
                console.error('Socket connection error:', err);
            });

            newSocket.on('notification', (notification) => {
                console.log('New notification:', notification);
                setNotifications(prev => [notification, ...prev]);
                setUnreadCount(prev => prev + 1);

                // Show browser notification if permitted
                if (Notification.permission === 'granted') {
                    new Notification(notification.title, {
                        body: notification.message
                    });
                }
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        }
    }, [token, user]);

    // Fetch initial notifications
    useEffect(() => {
        if (token) {
            fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.notifications) {
                        setNotifications(data.notifications);
                        setUnreadCount(data.unreadCount || 0);
                    }
                })
                .catch(err => console.error('Error fetching notifications:', err));
        }
    }, [token]);

    const markAsRead = async (id) => {
        try {
            await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });

            setNotifications(prev => prev.map(n =>
                n._id === id ? { ...n, read: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Error marking read:', err);
        }
    };

    return (
        <SocketContext.Provider value={{ socket, notifications, unreadCount, markAsRead }}>
            {children}
        </SocketContext.Provider>
    );
};
