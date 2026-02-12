import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
    const { notifications, unreadCount, markAsRead } = useSocket();
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const handleNotificationClick = (notification) => {
        markAsRead(notification._id);
        setIsOpen(false);
        if (notification.link) {
            navigate(notification.link);
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#a0a0b0',
                    position: 'relative'
                }}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.02 2.90991C8.70997 2.90991 6.01997 5.59991 6.01997 8.90991V11.7999C6.01997 12.4099 5.75997 13.3399 5.44997 13.8599L4.29997 15.7699C3.58997 16.9499 4.07997 18.2599 5.37997 18.2599H18.66C19.96 18.2599 20.45 16.9499 19.74 15.7699L18.59 13.8599C18.28 13.3399 18.02 12.4099 18.02 11.7999V8.90991C18.02 5.60991 15.32 2.90991 12.02 2.90991Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" />
                    <path d="M13.87 3.2C13.56 3.11 13.24 3.04 12.91 3.01C12.62 2.98 12.32 2.98 12.02 3.01C12.02 3.01 12.02 3.01 12.02 3H12" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M15.02 19.0601C15.02 20.7101 13.67 22.0601 12.02 22.0601C11.2 22.0601 10.44 21.7201 9.90002 21.1801C9.36002 20.6401 9.02002 19.8801 9.02002 19.0601" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" />
                </svg>

                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="notification-badge"
                        style={{
                            position: 'absolute',
                            top: -2,
                            right: -2,
                            background: '#ef4444',
                            color: 'white',
                            fontSize: '10px',
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            border: '2px solid var(--bg-secondary)'
                        }}
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                )}
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '0.5rem',
                            width: '320px',
                            background: '#1e1e24',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)',
                            zIndex: 1000,
                            overflow: 'hidden'
                        }}
                    >
                        <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#fff' }}>Notifications</h3>
                            {unreadCount > 0 && (
                                <span style={{ fontSize: '0.75rem', color: '#2dd4bf' }}>{unreadCount} new</span>
                            )}
                        </div>

                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {notifications.length === 0 ? (
                                <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                                    No notifications
                                </div>
                            ) : (
                                notifications.map(notification => (
                                    <div
                                        key={notification._id}
                                        onClick={() => handleNotificationClick(notification)}
                                        style={{
                                            padding: '1rem',
                                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                                            cursor: 'pointer',
                                            background: notification.read ? 'transparent' : 'rgba(45, 212, 191, 0.05)',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = notification.read ? 'transparent' : 'rgba(45, 212, 191, 0.05)'}
                                    >
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: notification.read ? '#ccc' : '#fff', marginBottom: '0.25rem' }}>
                                            {notification.title}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#888', lineHeight: 1.4 }}>
                                            {notification.message}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: '#555', marginTop: '0.5rem' }}>
                                            {new Date(notification.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;
