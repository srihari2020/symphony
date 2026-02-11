import React from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

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
                <motion.nav
                    className="sidebar-nav"
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: { opacity: 0 },
                        visible: {
                            opacity: 1,
                            transition: {
                                staggerChildren: 0.1,
                                delayChildren: 0.3
                            }
                        }
                    }}
                >
                    <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}>
                        <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                            <span className="nav-icon">📊</span>
                            Dashboard
                        </NavLink>
                    </motion.div>
                    <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}>
                        <NavLink to="/team" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                            <span className="nav-icon">👥</span>
                            Team
                        </NavLink>
                    </motion.div>
                    <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}>
                        <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                            <span className="nav-icon">⚙️</span>
                            Settings
                        </NavLink>
                    </motion.div>
                </motion.nav>
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
