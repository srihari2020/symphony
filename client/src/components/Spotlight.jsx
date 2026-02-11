import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Spotlight({
    children,
    className = "",
    color = "rgba(99, 102, 241, 0.15)",
    clickEffect = false
}) {
    const divRef = useRef(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e) => {
        if (!divRef.current) return;

        const rect = divRef.current.getBoundingClientRect();
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleMouseEnter = () => {
        setOpacity(1);
    };

    const handleMouseLeave = () => {
        setOpacity(0);
    };

    return (
        <motion.div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`relative overflow-hidden ${className}`}
            style={{ position: 'relative', overflow: 'hidden' }}
            {...props}
        >
            <motion.div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
                animate={{ opacity }}
                style={{
                    background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${color}, transparent 40%)`,
                    position: 'absolute',
                    inset: 0,
                    zIndex: 1,
                    pointerEvents: 'none',
                    mixBlendMode: 'screen'
                }}
            />
            <div style={{ position: 'relative', zIndex: 2 }}>
                {children}
            </div>
        </motion.div>
    );
}
