import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

import { DashboardIcon, TeamIcon, SettingsIcon, CommunityIcon } from './SidebarIcons';
import Magnetic from './Magnetic';
import NotificationBell from './NotificationBell';

const SidebarItem = ({ to, Icon, children, onClick }) => {
    return (
        <NavLink to={to} style={{ textDecoration: 'none' }} onClick={onClick}>
            {({ isActive }) => (
                <motion.li
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

const MenuToggle = ({ toggle, isOpen }) => (
    <button onClick={toggle} style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        zIndex: 100
    }}>
        <svg width="24" height="24" viewBox="0 0 24 24">
            <motion.path
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                variants={{
                    closed: { d: "M4 6L20 6" },
                    open: { d: "M6 18L18 6" }
                }}
                initial="closed"
                animate={isOpen ? "open" : "closed"}
            />
            <motion.path
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                d="M4 12L20 12"
                variants={{
                    closed: { opacity: 1 },
                    open: { opacity: 0 }
                }}
                initial="closed"
                animate={isOpen ? "open" : "closed"}
            />
            <motion.path
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                variants={{
                    closed: { d: "M4 18L20 18" },
                    open: { d: "M6 6L18 18" }
                }}
                initial="closed"
                animate={isOpen ? "open" : "closed"}
            />
        </svg>
    </button>
);

export default function Layout({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);

            // Only auto-correct sidebar state if crossing breakpoint
            if (!mobile && isMobile) {
                setIsSidebarOpen(true);
            }
            if (mobile && !isMobile) {
                setIsSidebarOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isMobile]);

    // Close sidebar on route change for mobile
    useEffect(() => {
        if (isMobile) {
            setIsSidebarOpen(false);
        }
    }, [location, isMobile]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const sidebarContent = (
        <>
            <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <Logo variant="teal" />
                </motion.div>
                {isMobile && (
                    <MenuToggle toggle={() => setIsSidebarOpen(false)} isOpen={true} />
                )}
            </div>
            <nav className="sidebar-nav">
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {[
                        { path: '/', Icon: DashboardIcon, label: 'Dashboard' },
                        { path: '/community', Icon: CommunityIcon, label: 'Community' },
                        { path: '/team', Icon: TeamIcon, label: 'Team' },
                        { path: '/settings', Icon: SettingsIcon, label: 'Settings' }
                    ].map((item) => (
                        <SidebarItem key={item.path} to={item.path} Icon={item.Icon} onClick={() => isMobile && setIsSidebarOpen(false)}>
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
        </>
    );

    return (
        <div className="app-layout">
            {isMobile && (
                <header style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '64px',
                    background: '#1a1b23',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 1rem',
                    zIndex: 90
                }}>
                    <Logo variant="teal" size="small" />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <NotificationBell />
                        <MenuToggle toggle={() => setIsSidebarOpen(!isSidebarOpen)} isOpen={isSidebarOpen} />
                    </div>
                </header>
            )}

            <AnimatePresence>
                {(isSidebarOpen || !isMobile) && (
                    <>
                        {isMobile && isSidebarOpen && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsSidebarOpen(false)}
                                style={{
                                    position: 'fixed',
                                    inset: 0,
                                    background: 'rgba(0,0,0,0.6)',
                                    backdropFilter: 'blur(5px)',
                                    zIndex: 95 // Ensure overlay is below sidebar (which is 100 in style or default)
                                }}
                            />
                        )}
                        <motion.aside
                            className="sidebar"
                            initial={isMobile ? { x: -280 } : { x: 0 }}
                            animate={{
                                x: 0,
                                boxShadow: isMobile ? '5px 0 25px rgba(0,0,0,0.5)' : 'none'
                            }}
                            exit={isMobile ? { x: -280 } : undefined}
                            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                            style={{
                                zIndex: 100 // Explicitly higher than overlay
                            }}
                        >
                            {sidebarContent}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            <motion.main
                className="main-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                style={{
                    marginLeft: isMobile ? 0 : '280px',
                    paddingTop: isMobile ? '80px' : '2rem',
                    width: '100%'
                }}
            >
                {children}
            </motion.main>
        </div>
    );
}
