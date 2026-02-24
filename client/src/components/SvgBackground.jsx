import { useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * Subtle SVG background decoration for page headers.
 * Creates floating shapes that animate gently.
 */
export default function SvgBackground({ variant = 'default', opacity = 0.04, height = 200 }) {
    const shapes = useMemo(() => {
        const items = [];
        const colors = variant === 'teal'
            ? ['#2dd4bf', '#06b6d4', '#22c55e']
            : variant === 'amber'
                ? ['#f59e0b', '#f97316', '#ef4444']
                : ['#6366f1', '#8b5cf6', '#a5b4fc'];

        for (let i = 0; i < 12; i++) {
            items.push({
                x: Math.random() * 100,
                y: Math.random() * 100,
                size: 4 + Math.random() * 16,
                color: colors[Math.floor(Math.random() * colors.length)],
                delay: Math.random() * 3,
                duration: 4 + Math.random() * 6,
                type: Math.random() > 0.5 ? 'circle' : 'rect',
            });
        }
        return items;
    }, [variant]);

    return (
        <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                opacity, pointerEvents: 'none',
                overflow: 'hidden',
            }}
        >
            {shapes.map((s, i) => (
                s.type === 'circle' ? (
                    <motion.circle
                        key={i}
                        cx={s.x} cy={s.y} r={s.size / 2}
                        fill={s.color}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                            opacity: [0, 0.5, 0],
                            scale: [0.5, 1.2, 0.5],
                            cx: [s.x, s.x + (Math.random() - 0.5) * 10, s.x],
                            cy: [s.y, s.y + (Math.random() - 0.5) * 10, s.y],
                        }}
                        transition={{
                            duration: s.duration,
                            delay: s.delay,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />
                ) : (
                    <motion.rect
                        key={i}
                        x={s.x} y={s.y}
                        width={s.size} height={s.size}
                        rx={s.size / 4}
                        fill={s.color}
                        initial={{ opacity: 0, rotate: 0 }}
                        animate={{
                            opacity: [0, 0.4, 0],
                            rotate: [0, 45, 0],
                            x: [s.x, s.x + (Math.random() - 0.5) * 8, s.x],
                        }}
                        transition={{
                            duration: s.duration,
                            delay: s.delay,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />
                )
            ))}

            {/* Decorative path lines */}
            <motion.path
                d="M0,50 Q25,30 50,50 T100,50"
                fill="none"
                stroke={variant === 'teal' ? '#2dd4bf' : '#6366f1'}
                strokeWidth="0.3"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: [0, 1, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.path
                d="M0,70 Q30,40 60,70 T100,60"
                fill="none"
                stroke={variant === 'teal' ? '#06b6d4' : '#8b5cf6'}
                strokeWidth="0.2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: [0, 1, 0] }}
                transition={{ duration: 10, delay: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
        </svg>
    );
}
