import React from 'react';
import { motion } from 'framer-motion';
import './AnimatedButton.css';

const AnimatedButton = ({
    children,
    onClick,
    variant = 'primary',
    disabled = false,
    type = 'button',
    className = '',
    spotlight = true,
    ...props
}) => {
    const btnRef = React.useRef(null);
    const [position, setPosition] = React.useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = React.useState(0);

    const handleMouseMove = (e) => {
        if (!btnRef.current || disabled) return;
        const rect = btnRef.current.getBoundingClientRect();
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleMouseEnter = () => {
        if (!disabled) setOpacity(1);
    };

    const handleMouseLeave = () => {
        setOpacity(0);
    };

    return (
        <motion.button
            ref={btnRef}
            type={type}
            className={`animated-btn btn-${variant} ${className}`}
            onClick={onClick}
            disabled={disabled}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            {...props}
        >
            {/* Spotlight Gradient */}
            {spotlight && !disabled && (
                <motion.div
                    className="spotlight-overlay"
                    animate={{ opacity }}
                    style={{
                        background: `radial-gradient(120px circle at ${position.x}px ${position.y}px, rgba(255, 255, 255, 0.15), transparent 60%)`,
                        position: 'absolute',
                        inset: 0,
                        pointerEvents: 'none',
                        zIndex: 1
                    }}
                />
            )}
            <span style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {children}
            </span>
        </motion.button>
    );
};

export default AnimatedButton;
