import React from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

import Magnetic from './Magnetic';

const SidebarItem = ({ to, Icon, children }) => {
    return (
        <NavLink to={to} style={{ textDecoration: 'none' }}>
            {({ isActive }) => (
                <motion.li
                    // ... existing styles ...
                    style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.875rem 1rem',
                        borderRadius: '12px',
                        color: isActive ? '#fff' : '#a0a0b0',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        fontWeight: 500,
                        fontSize: '0.95rem'
                    }}
                    whileHover={{ scale: 1.02, x: 4, color: '#fff', backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                    {isActive && (
                        <motion.div
                            layoutId="active-nav-bg"
                            style={{
                                position: 'absolute',
                                inset: 0,
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, rgba(45, 212, 191, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)', // Teal transparent gradient
                                border: '1px solid rgba(45, 212, 191, 0.3)',
                                zIndex: 0
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        />
                    )}
                    <Magnetic strength={0.3}>
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, filter: isActive ? 'drop-shadow(0 0 8px rgba(45, 212, 191, 0.5))' : 'none' }}>
                            <Icon isActive={isActive} />
                        </span>
                    </Magnetic>
                    <span style={{ zIndex: 1 }}>{children}</span>
                    {isActive && (
                        <motion.div
                            layoutId="active-nav-indicator"
                            // ... existing styles ...
                            style={{
                                position: 'absolute',
                                left: 0,
                                top: '15%',
                                bottom: '15%',
                                width: '4px',
                                borderRadius: '0 4px 4px 0',
                                background: '#2dd4bf', // Teal accent
                                zIndex: 1
                            }}
                        />
                    )}
                </motion.li>
            )}
        </NavLink>
    );
};

export default function Layout({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="app-layout">
            <motion.aside
                className="sidebar"
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                <div className="sidebar-header">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Logo variant="teal" />
                    </motion.div>
                </div>
                <nav className="sidebar-nav">
                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {[
                            { path: '/', Icon: DashboardIcon, label: 'Dashboard' },
                            { path: '/team', Icon: TeamIcon, label: 'Team' },
                            { path: '/settings', Icon: SettingsIcon, label: 'Settings' }
                        ].map((item) => (
                            <SidebarItem key={item.path} to={item.path} Icon={item.Icon}>
                                {item.label}
                            </SidebarItem>
                        ))}
                    </ul>
                </nav>
                <motion.div
                    className="sidebar-footer"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <div className="user-info">
                        <motion.span
                            className="user-avatar"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                        >
                            {user?.name?.[0] || 'U'}
                        </motion.span>
                        <span className="user-name">{user?.name || 'User'}</span>
                    </div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <button onClick={handleLogout} className="logout-btn">Logout</button>
                    </motion.div>
                </motion.div>
            </motion.aside>
            <motion.main
                className="main-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
            >
                {children}
            </motion.main>
        </div>
    );
}
