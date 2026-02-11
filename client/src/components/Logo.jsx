import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

export default function Logo({ className = '', size = 'medium', showText = true, variant = 'primary' }) {
    const sizes = {
        small: { width: 32, height: 32, fontSize: '1.25rem' },
        medium: { width: 42, height: 42, fontSize: '1.75rem' },
        large: { width: 64, height: 64, fontSize: '3rem' }
    };

    const { width, height, fontSize } = sizes[size] || sizes.medium;
    const controls = useAnimation();

    // Gradient configurations
    const gradients = {
        primary: { start: '#6366f1', end: '#8b5cf6', id: 'logo-gradient-primary' },
        teal: { start: '#2dd4bf', end: '#06b6d4', id: 'logo-gradient-teal' },
        pink: { start: '#ec4899', end: '#f43f5e', id: 'logo-gradient-pink' }
    };

    const currentGradient = gradients[variant] || gradients.primary;

    useEffect(() => {
        controls.start(i => ({
            pathLength: 1,
            opacity: 1,
            transition: { pathLength: { delay: i * 0.2, type: "spring", duration: 1.5, bounce: 0 }, opacity: { duration: 0.01 } }
        }));
    }, [controls]);

    return (
        <div className={`logo-container ${className}`} style={{ display: 'flex', alignItems: 'center', gap: size === 'small' ? '0.5rem' : '0.75rem' }}>
            <motion.div
                className="logo-icon"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                    width,
                    height,
                    position: 'relative',
                    filter: `drop-shadow(0 0 15px ${variant === 'teal' ? 'rgba(45, 212, 191, 0.4)' : 'rgba(99, 102, 241, 0.4)'})`
                }}
            >
                <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Background Glow */}
                    <defs>
                        <linearGradient id={currentGradient.id} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={currentGradient.start} />
                            <stop offset="100%" stopColor={currentGradient.end} />
                        </linearGradient>
                        <filter id={`glow-${variant}`}>
                            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Outer Shape - Squircle */}
                    <motion.path
                        d="M20 0H80C91.0457 0 100 8.9543 100 20V80C100 91.0457 91.0457 100 80 100H20C8.9543 100 0 91.0457 0 80V20C0 8.9543 8.9543 0 20 0Z"
                        stroke={`url(#${currentGradient.id})`}
                        strokeWidth="4"
                        fill="rgba(15, 15, 20, 0.8)" // Dark background for contrast
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={controls}
                        custom={0}
                    />

                    {/* Inner Path - Abstract S / Wave */}
                    <motion.path
                        d="M30 35C30 35 40 20 60 25C80 30 80 50 60 50C40 50 40 70 60 75C80 80 75 90 75 90"
                        stroke={`url(#${currentGradient.id})`}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={controls}
                        custom={1}
                        style={{ filter: `url(#glow-${variant})` }}
                    />

                    {/* Decorative Dot */}
                    <motion.circle
                        cx="75" cy="25" r="5"
                        fill="#fff"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 1, type: 'spring' }}
                    />
                </svg>
            </motion.div>

            {showText && (
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    style={{ position: 'relative' }}
                >
                    <span style={{
                        fontSize,
                        fontWeight: 800,
                        letterSpacing: '-0.03em',
                        background: 'linear-gradient(to right, #fff, #c7d2fe)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                    }}>
                        Symphony
                    </span>
                    {/* Tiny accent dot */}
                    <motion.div
                        style={{
                            position: 'absolute',
                            top: 0,
                            right: -6,
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: '#22c55e'
                        }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1.2, type: 'spring' }}
                    />
                </motion.div>
            )}
        </div>
    );
}
