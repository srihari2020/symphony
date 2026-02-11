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
    ...props
}) => {
    return (
        <motion.button
            type={type}
            className={`animated-btn btn-${variant} ${className}`}
            onClick={onClick}
            disabled={disabled}
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            {...props}
        >
            {children}
        </motion.button>
    );
};

export default AnimatedButton;
