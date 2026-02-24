import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, useScroll, useTransform, useInView, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

/* ════════════════════════════════════════════════
   SVG ANIMATED COMPONENTS
   ════════════════════════════════════════════════ */

/* ─── SVG path-draw animation (anime.js style) ─── */
const DrawPath = ({ d, stroke = '#6366f1', strokeWidth = 1.5, delay = 0, duration = 2, fill = 'none' }) => (
    <motion.path
        d={d}
        stroke={stroke}
        strokeWidth={strokeWidth}
        fill={fill}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration, delay, ease: [0.43, 0.13, 0.23, 0.96] }}
    />
);

/* ─── Animated constellation / network graph ─── */
const ConstellationHero = () => {
    const nodes = useMemo(() => {
        const pts = [];
        for (let i = 0; i < 18; i++) {
            pts.push({
                x: 100 + Math.random() * 1000,
                y: 50 + Math.random() * 500,
                r: 2 + Math.random() * 4,
                delay: Math.random() * 2,
            });
        }
        return pts;
    }, []);

    const edges = useMemo(() => {
        const e = [];
        nodes.forEach((a, i) => {
            nodes.forEach((b, j) => {
                if (j > i) {
                    const dist = Math.hypot(a.x - b.x, a.y - b.y);
                    if (dist < 280) e.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, delay: Math.random() * 1.5 });
                }
            });
        });
        return e;
    }, [nodes]);

    return (
        <svg viewBox="0 0 1200 600" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.35 }}>
            <defs>
                <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.3" />
                </linearGradient>
            </defs>

            {/* Animated edges */}
            {edges.map((e, i) => (
                <motion.line
                    key={`e-${i}`}
                    x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                    stroke="url(#edgeGrad)" strokeWidth="0.8"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: [0, 0.5, 0.3] }}
                    transition={{ duration: 2 + Math.random(), delay: e.delay, ease: 'easeOut' }}
                />
            ))}

            {/* Animated nodes with pulse */}
            {nodes.map((n, i) => (
                <g key={`n-${i}`}>
                    <motion.circle
                        cx={n.x} cy={n.y} r={n.r * 4}
                        fill="url(#nodeGlow)"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [0, 1.5, 1], opacity: [0, 0.4, 0.2] }}
                        transition={{ duration: 2, delay: n.delay, repeat: Infinity, repeatType: 'reverse', repeatDelay: 2 + Math.random() * 3 }}
                    />
                    <motion.circle
                        cx={n.x} cy={n.y} r={n.r}
                        fill="#a5b4fc"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5, delay: n.delay + 0.5, type: 'spring' }}
                    />
                </g>
            ))}

            {/* Traveling data pulses along edges */}
            {edges.slice(0, 6).map((e, i) => (
                <motion.circle
                    key={`pulse-${i}`}
                    r="2.5"
                    fill="#2dd4bf"
                    initial={{ cx: e.x1, cy: e.y1, opacity: 0 }}
                    animate={{
                        cx: [e.x1, e.x2],
                        cy: [e.y1, e.y2],
                        opacity: [0, 0.9, 0],
                    }}
                    transition={{
                        duration: 2 + Math.random() * 2,
                        delay: 2 + i * 0.8,
                        repeat: Infinity,
                        repeatDelay: 3 + Math.random() * 4,
                        ease: 'linear',
                    }}
                />
            ))}
        </svg>
    );
};

/* ─── Orbiting rings (Google Antigravity-style) ─── */
const OrbitRings = () => (
    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
        {[280, 360, 450].map((size, i) => (
            <motion.svg
                key={size}
                width={size} height={size}
                viewBox={`0 0 ${size} ${size}`}
                style={{ position: 'absolute', top: '50%', left: '50%', marginTop: -size / 2, marginLeft: -size / 2 }}
                animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                transition={{ duration: 20 + i * 10, repeat: Infinity, ease: 'linear' }}
            >
                <circle
                    cx={size / 2} cy={size / 2} r={size / 2 - 2}
                    fill="none"
                    stroke={`rgba(99, 102, 241, ${0.08 - i * 0.02})`}
                    strokeWidth="1"
                    strokeDasharray={`${10 + i * 5} ${20 + i * 10}`}
                />
                {/* Orbiting dot */}
                <circle
                    cx={size / 2} cy={2}
                    r="3"
                    fill={i === 0 ? '#6366f1' : i === 1 ? '#2dd4bf' : '#8b5cf6'}
                    opacity="0.7"
                />
            </motion.svg>
        ))}
    </div>
);

/* ─── Wave section divider SVG ─── */
const WaveDivider = ({ flip = false, color = '#0a0a10' }) => (
    <div style={{ transform: flip ? 'rotate(180deg)' : 'none', marginTop: flip ? 0 : '-1px', marginBottom: flip ? '-1px' : 0, lineHeight: 0 }}>
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none" style={{ width: '100%', height: '80px', display: 'block' }}>
            <motion.path
                d="M0,64 C200,20 400,100 600,60 C800,20 1000,90 1200,50 C1300,30 1400,70 1440,64 L1440,120 L0,120 Z"
                fill={color}
                initial={{ d: "M0,80 C200,80 400,80 600,80 C800,80 1000,80 1200,80 C1300,80 1400,80 1440,80 L1440,120 L0,120 Z" }}
                whileInView={{ d: "M0,64 C200,20 400,100 600,60 C800,20 1000,90 1200,50 C1300,30 1400,70 1440,64 L1440,120 L0,120 Z" }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: [0.43, 0.13, 0.23, 0.96] }}
            />
        </svg>
    </div>
);

/* ─── SVG feature icons with path drawing ─── */
const FeatureIcon = ({ paths, viewBox = '0 0 24 24', color = '#6366f1', delay = 0 }) => (
    <svg viewBox={viewBox} width="32" height="32" style={{ overflow: 'visible' }}>
        {paths.map((d, i) => (
            <DrawPath key={i} d={d} stroke={color} strokeWidth={1.8} delay={delay + i * 0.15} duration={1.2} />
        ))}
    </svg>
);

/* ─── Scroll-reveal wrapper ─── */
const Reveal = ({ children, delay = 0, direction = 'up', ...rest }) => {
    const y = direction === 'up' ? 60 : direction === 'down' ? -60 : 0;
    const x = direction === 'left' ? 80 : direction === 'right' ? -80 : 0;
    return (
        <motion.div
            initial={{ opacity: 0, y, x, filter: 'blur(6px)' }}
            whileInView={{ opacity: 1, y: 0, x: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
            {...rest}
        >
            {children}
        </motion.div>
    );
};

/* ─── Animated counter ─── */
const Counter = ({ target, suffix = '', duration = 2 }) => {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const [started, setStarted] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
            { threshold: 0.5 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [started]);

    useEffect(() => {
        if (!started) return;
        let v = 0;
        const step = target / (duration * 60);
        const id = setInterval(() => {
            v += step;
            if (v >= target) { setCount(target); clearInterval(id); }
            else setCount(Math.floor(v));
        }, 1000 / 60);
        return () => clearInterval(id);
    }, [started, target, duration]);

    return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

/* ─── Animated SVG logo ─── */
const AnimatedLogo = () => (
    <motion.svg
        viewBox="0 0 60 60" width="48" height="48"
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
        <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
        </defs>
        <motion.rect
            x="4" y="4" width="52" height="52" rx="16"
            fill="url(#logoGrad)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, type: 'spring', stiffness: 200 }}
        />
        <DrawPath d="M20 38 L20 22 Q20 18 24 18 L30 18 Q34 18 34 22 L34 28 Q34 32 30 32 L24 32" stroke="white" strokeWidth={2.5} delay={0.5} duration={1.5} />
        <DrawPath d="M38 18 L38 38" stroke="white" strokeWidth={2.5} delay={0.8} duration={0.8} />
        <motion.circle
            cx="38" cy="14" r="2" fill="white"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.2, type: 'spring', stiffness: 300 }}
        />
    </motion.svg>
);

/* ─── Large SVG background circuit lines ─── */
const CircuitLines = () => (
    <svg viewBox="0 0 1200 800" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.04, pointerEvents: 'none' }}>
        {[
            "M0,400 L200,400 L200,200 L500,200 L500,350 L700,350",
            "M1200,300 L1000,300 L1000,500 L800,500 L800,250 L600,250",
            "M100,600 L300,600 L300,450 L550,450 L550,550 L750,550",
            "M1100,100 L900,100 L900,300 L700,300 L700,150",
        ].map((d, i) => (
            <DrawPath key={i} d={d} stroke="#6366f1" strokeWidth={1} delay={i * 0.4} duration={3} />
        ))}
        {/* Junction dots */}
        {[[200, 200], [500, 350], [1000, 500], [300, 450], [700, 300], [900, 100]].map(([x, y], i) => (
            <motion.circle
                key={`jn-${i}`} cx={x} cy={y} r="3" fill="#6366f1"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 1 + i * 0.3, type: 'spring' }}
            />
        ))}
    </svg>
);

/* ════════════════════════════════════════════════
   MAIN LANDING COMPONENT
   ════════════════════════════════════════════════ */
export default function Landing() {
    const navigate = useNavigate();
    const { scrollYProgress } = useScroll();
    const heroScale = useTransform(scrollYProgress, [0, 0.12], [1, 0.92]);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
    const heroY = useTransform(scrollYProgress, [0, 0.12], [0, -100]);
    const heroRotateX = useTransform(scrollYProgress, [0, 0.12], [0, 8]);

    const features = [
        {
            paths: ['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2', 'M9 5a2 2 0 002 2h2a2 2 0 002-2', 'M9 5a2 2 0 012-2h2a2 2 0 012 2', 'M9 14l2 2 4-4'],
            title: 'Smart Kanban Boards',
            desc: 'Drag-and-drop project management with real-time sync. Track every task from idea to deploy.',
            color: '#6366f1',
        },
        {
            paths: ['M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2', 'M9 7a4 4 0 100-8 4 4 0 000 8', 'M23 21v-2a4 4 0 00-3-3.87', 'M16 3.13a4 4 0 010 7.75'],
            title: 'Team Discovery',
            desc: 'Find and connect with talented developers worldwide. Build dream teams in seconds.',
            color: '#2dd4bf',
        },
        {
            paths: ['M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z'],
            title: 'Community Hub',
            desc: 'Share insights, discuss trends, get feedback. Integrated with Dev.to in real-time.',
            color: '#f59e0b',
        },
        {
            paths: ['M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71', 'M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71'],
            title: 'GitHub & Slack',
            desc: 'First-class integrations with your existing toolchain. Auto-sync repos. Slack alerts.',
            color: '#ef4444',
        },
        {
            paths: ['M12 2L2 7l10 5 10-5-10-5z', 'M2 17l10 5 10-5', 'M2 12l10 5 10-5'],
            title: 'Stunning Design',
            desc: 'Premium dark & light themes with buttery-smooth animations. A workspace you love.',
            color: '#8b5cf6',
        },
        {
            paths: ['M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9', 'M13.73 21a2 2 0 01-3.46 0'],
            title: 'Real-time Alerts',
            desc: 'WebSocket-powered notifications. Customizable email digests — daily, weekly, or instant.',
            color: '#06b6d4',
        },
    ];

    const steps = [
        { num: '01', title: 'Create your workspace', desc: 'Sign up in seconds. Set up your org. Invite collaborators.', icon: ['M13 2L3 14h9l-1 8 10-12h-9l1-8'] },
        { num: '02', title: 'Build your projects', desc: 'Kanban boards, milestones, deadlines — everything in one elegant view.', icon: ['M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z', 'M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z'] },
        { num: '03', title: 'Collaborate & ship', desc: 'Team chat, community posts, GitHub sync — ship faster together.', icon: ['M22 11.08V12a10 10 0 11-5.93-9.14', 'M22 4L12 14.01l-3-3'] },
    ];

    return (
        <div style={{
            background: '#0a0a10',
            color: 'white',
            overflowX: 'hidden',
            fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            position: 'relative',
        }}>

            {/* ═══════════ HERO ═══════════ */}
            <motion.section style={{
                minHeight: '100vh',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
                textAlign: 'center',
                padding: '2rem',
                scale: heroScale, opacity: heroOpacity, y: heroY,
                perspective: '1200px',
            }}>
                {/* Constellation background */}
                <ConstellationHero />
                <OrbitRings />

                {/* Animated Logo */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    style={{ marginBottom: '2rem', zIndex: 1 }}
                >
                    <AnimatedLogo />
                </motion.div>

                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.6, type: 'spring' }}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                        background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)',
                        borderRadius: '999px', padding: '0.35rem 1rem', marginBottom: '1.5rem',
                        fontSize: '0.8rem', color: '#818cf8', zIndex: 1, backdropFilter: 'blur(8px)',
                    }}
                >
                    <motion.div
                        style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }}
                        animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                    Now in public beta
                </motion.div>

                {/* Headline with staggered letter reveal */}
                <motion.h1
                    style={{
                        fontSize: 'clamp(3rem, 8vw, 6.5rem)',
                        fontWeight: 800, lineHeight: 1.0,
                        marginBottom: '1.5rem', zIndex: 1,
                        letterSpacing: '-0.04em',
                    }}
                >
                    {['Build', ' ', 'Together.'].map((word, wi) => (
                        <span key={wi}>
                            {word === ' ' ? <br /> : word.split('').map((ch, ci) => (
                                <motion.span
                                    key={`${wi}-${ci}`}
                                    initial={{ opacity: 0, y: 40, rotateX: -90 }}
                                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                                    transition={{
                                        duration: 0.5,
                                        delay: 0.8 + wi * 0.3 + ci * 0.04,
                                        ease: [0.25, 0.46, 0.45, 0.94],
                                    }}
                                    style={{
                                        display: 'inline-block',
                                        background: wi === 0
                                            ? 'linear-gradient(135deg, #ffffff 0%, #c7d2fe 100%)'
                                            : 'linear-gradient(135deg, #a5b4fc 0%, #6366f1 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}
                                >
                                    {ch}
                                </motion.span>
                            ))}
                        </span>
                    ))}
                    <br />
                    {['Ship', ' ', 'Faster.'].map((word, wi) => (
                        <span key={`s-${wi}`}>
                            {word === ' ' ? ' ' : word.split('').map((ch, ci) => (
                                <motion.span
                                    key={`s-${wi}-${ci}`}
                                    initial={{ opacity: 0, y: 40, rotateX: -90 }}
                                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                                    transition={{
                                        duration: 0.5,
                                        delay: 1.5 + wi * 0.25 + ci * 0.04,
                                        ease: [0.25, 0.46, 0.45, 0.94],
                                    }}
                                    style={{
                                        display: 'inline-block',
                                        background: 'linear-gradient(135deg, #2dd4bf 0%, #06b6d4 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}
                                >
                                    {ch}
                                </motion.span>
                            ))}
                        </span>
                    ))}
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 2.2 }}
                    style={{
                        fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                        color: '#6b6b8a', maxWidth: '550px', lineHeight: 1.7,
                        marginBottom: '2.5rem', zIndex: 1,
                    }}
                >
                    The all-in-one platform for developer teams — manage projects, discover talent,
                    and collaborate from one beautiful workspace.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 2.5 }}
                    style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', zIndex: 1 }}
                >
                    <motion.button
                        whileHover={{ scale: 1.06, boxShadow: '0 0 50px rgba(99,102,241,0.5)' }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => navigate('/signup')}
                        style={{
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            border: 'none', color: 'white',
                            padding: '1rem 2.5rem', borderRadius: '14px',
                            fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
                            position: 'relative', overflow: 'hidden',
                        }}
                    >
                        {/* Shine effect */}
                        <motion.div
                            style={{
                                position: 'absolute', top: 0, left: '-100%', width: '100%', height: '100%',
                                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                            }}
                            animate={{ left: ['100%', '-100%'] }}
                            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: 'linear' }}
                        />
                        Get Started Free →
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.06, borderColor: 'rgba(99,102,241,0.5)' }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => navigate('/login')}
                        style={{
                            background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.12)', color: 'white',
                            padding: '1rem 2.5rem', borderRadius: '14px',
                            fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
                        }}
                    >
                        Sign In
                    </motion.button>
                </motion.div>

                {/* Scroll indicator with SVG chevron */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 3 }}
                    style={{
                        position: 'absolute', bottom: '2.5rem', zIndex: 1,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                    }}
                >
                    <span style={{ fontSize: '0.7rem', color: '#444', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                        Scroll to explore
                    </span>
                    <motion.svg
                        width="20" height="30" viewBox="0 0 20 30"
                        animate={{ y: [0, 6, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        <rect x="1" y="1" width="18" height="28" rx="9" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                        <motion.circle
                            cx="10" cy="10" r="2.5" fill="#6366f1"
                            animate={{ cy: [8, 18, 8], opacity: [1, 0.3, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                    </motion.svg>
                </motion.div>
            </motion.section>

            {/* ═══════════ WAVE DIVIDER ═══════════ */}
            <WaveDivider color="rgba(99,102,241,0.03)" />

            {/* ═══════════ FEATURES ═══════════ */}
            <section style={{ padding: '6rem 2rem 4rem', position: 'relative', background: 'rgba(99,102,241,0.03)' }}>
                <CircuitLines />

                <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                    <Reveal>
                        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                            <motion.div
                                initial={{ width: 0 }}
                                whileInView={{ width: 60 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                style={{ height: 3, background: 'linear-gradient(90deg, #6366f1, #2dd4bf)', borderRadius: 2, margin: '0 auto 1rem' }}
                            />
                            <span style={{ fontSize: '0.8rem', color: '#6366f1', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700 }}>
                                Powerful Features
                            </span>
                            <h2 style={{
                                fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 700,
                                marginTop: '0.75rem', letterSpacing: '-0.02em',
                                background: 'linear-gradient(180deg, #fff 0%, #888 100%)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            }}>
                                Everything you need,<br />nothing you don't
                            </h2>
                        </div>
                    </Reveal>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '1.5rem' }}>
                        {features.map((f, i) => (
                            <Reveal key={f.title} delay={i * 0.08}>
                                <motion.div
                                    whileHover={{ y: -10, borderColor: `${f.color}50` }}
                                    style={{
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        borderRadius: '20px', padding: '2rem',
                                        cursor: 'default', position: 'relative', overflow: 'hidden',
                                        transition: 'border-color 0.4s',
                                    }}
                                >
                                    {/* Corner glow */}
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        whileHover={{ opacity: 1 }}
                                        style={{
                                            position: 'absolute', top: '-40px', right: '-40px',
                                            width: '120px', height: '120px', borderRadius: '50%',
                                            background: `radial-gradient(circle, ${f.color}20, transparent 70%)`,
                                            pointerEvents: 'none',
                                        }}
                                    />
                                    <div style={{
                                        width: '56px', height: '56px', borderRadius: '16px',
                                        background: `${f.color}10`, border: `1px solid ${f.color}20`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        marginBottom: '1.25rem',
                                    }}>
                                        <FeatureIcon paths={f.paths} color={f.color} delay={i * 0.1} />
                                    </div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.6rem', color: '#fff' }}>{f.title}</h3>
                                    <p style={{ color: '#666', lineHeight: 1.7, fontSize: '0.9rem' }}>{f.desc}</p>
                                </motion.div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            <WaveDivider flip color="rgba(99,102,241,0.03)" />

            {/* ═══════════ HOW IT WORKS ═══════════ */}
            <section style={{ padding: '6rem 2rem', position: 'relative' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <Reveal>
                        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                            <motion.div
                                initial={{ width: 0 }}
                                whileInView={{ width: 60 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                style={{ height: 3, background: 'linear-gradient(90deg, #2dd4bf, #06b6d4)', borderRadius: 2, margin: '0 auto 1rem' }}
                            />
                            <span style={{ fontSize: '0.8rem', color: '#2dd4bf', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700 }}>
                                How it works
                            </span>
                            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700, marginTop: '0.75rem', letterSpacing: '-0.02em' }}>
                                Up and running in minutes
                            </h2>
                        </div>
                    </Reveal>

                    {/* Connection line svg between steps */}
                    <div style={{ position: 'relative' }}>
                        <svg style={{
                            position: 'absolute', left: '39px', top: 0, width: '2px', height: '100%', zIndex: 0,
                        }} viewBox="0 0 2 600" preserveAspectRatio="none">
                            <motion.line
                                x1="1" y1="0" x2="1" y2="600"
                                stroke="url(#lineGrad)" strokeWidth="2"
                                strokeDasharray="8 4"
                                initial={{ pathLength: 0 }}
                                whileInView={{ pathLength: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 2, delay: 0.3 }}
                            />
                            <defs>
                                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#6366f1" />
                                    <stop offset="100%" stopColor="#2dd4bf" />
                                </linearGradient>
                            </defs>
                        </svg>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', position: 'relative', zIndex: 1 }}>
                            {steps.map((s, i) => (
                                <Reveal key={s.num} delay={i * 0.2}>
                                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                                        {/* Step number circle with SVG icon */}
                                        <motion.div
                                            whileHover={{ scale: 1.15, rotate: 5 }}
                                            style={{
                                                width: '80px', height: '80px', borderRadius: '24px',
                                                background: i === 0 ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                                                    : i === 1 ? 'linear-gradient(135deg, #2dd4bf, #06b6d4)'
                                                        : 'linear-gradient(135deg, #22c55e, #16a34a)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0, position: 'relative',
                                                boxShadow: `0 8px 30px ${i === 0 ? 'rgba(99,102,241,0.3)' : i === 1 ? 'rgba(45,212,191,0.3)' : 'rgba(34,197,94,0.3)'}`,
                                            }}
                                        >
                                            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                {s.icon.map((d, j) => (
                                                    <DrawPath key={j} d={d} stroke="white" strokeWidth={2} delay={0.5 + i * 0.3 + j * 0.1} duration={1} />
                                                ))}
                                            </svg>
                                        </motion.div>
                                        <div style={{ paddingTop: '0.5rem' }}>
                                            <span style={{ fontSize: '0.7rem', color: '#6366f1', fontWeight: 700, letterSpacing: '0.12em' }}>
                                                STEP {s.num}
                                            </span>
                                            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, margin: '0.4rem 0', color: '#fff' }}>{s.title}</h3>
                                            <p style={{ color: '#666', lineHeight: 1.6, fontSize: '0.92rem' }}>{s.desc}</p>
                                        </div>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════ STATS ═══════════ */}
            <section style={{ padding: '5rem 2rem', background: 'rgba(99,102,241,0.02)' }}>
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', textAlign: 'center' }}>
                        {[
                            { value: 1200, suffix: '+', label: 'Active Users', color: '#6366f1' },
                            { value: 350, suffix: '+', label: 'Projects', color: '#2dd4bf' },
                            { value: 15, suffix: 'k+', label: 'Tasks Done', color: '#8b5cf6' },
                            { value: 99, suffix: '%', label: 'Uptime', color: '#22c55e' },
                        ].map((s, i) => (
                            <Reveal key={s.label} delay={i * 0.1}>
                                <motion.div
                                    whileHover={{ y: -6, borderColor: `${s.color}40` }}
                                    style={{
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        borderRadius: '20px', padding: '2rem 1.5rem',
                                        transition: 'border-color 0.3s',
                                    }}
                                >
                                    {/* SVG ring decoration */}
                                    <svg width="60" height="60" viewBox="0 0 60 60" style={{ margin: '0 auto 0.75rem', display: 'block' }}>
                                        <circle cx="30" cy="30" r="28" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="2" />
                                        <motion.circle
                                            cx="30" cy="30" r="28" fill="none"
                                            stroke={s.color} strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeDasharray={`${175 * (parseInt(s.value === 99 ? '99' : s.value > 100 ? '80' : s.value) / 100)} 175`}
                                            transform="rotate(-90 30 30)"
                                            initial={{ pathLength: 0 }}
                                            whileInView={{ pathLength: 1 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 1.5, delay: 0.3 + i * 0.15 }}
                                        />
                                    </svg>
                                    <div style={{
                                        fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)',
                                        fontWeight: 800,
                                        background: `linear-gradient(135deg, ${s.color}, ${s.color}88)`,
                                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                        marginBottom: '0.3rem',
                                    }}>
                                        <Counter target={s.value} suffix={s.suffix} />
                                    </div>
                                    <div style={{ color: '#555', fontSize: '0.85rem', fontWeight: 500 }}>{s.label}</div>
                                </motion.div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════ FINAL CTA ═══════════ */}
            <section style={{ padding: '8rem 2rem', position: 'relative', textAlign: 'center' }}>
                <ConstellationHero />
                <div style={{ maxWidth: '650px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                    <Reveal>
                        <motion.svg viewBox="0 0 100 100" width="60" height="60" style={{ margin: '0 auto 2rem', display: 'block' }}>
                            <motion.circle
                                cx="50" cy="50" r="45" fill="none" stroke="#6366f1" strokeWidth="1.5"
                                initial={{ pathLength: 0 }}
                                whileInView={{ pathLength: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1.5 }}
                            />
                            <DrawPath d="M35 50 L45 60 L65 40" stroke="#2dd4bf" strokeWidth={3} delay={0.8} duration={0.8} />
                        </motion.svg>

                        <h2 style={{
                            fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800,
                            marginBottom: '1rem', letterSpacing: '-0.02em',
                            background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 60%, #6366f1 100%)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>
                            Ready to build<br />something amazing?
                        </h2>
                        <p style={{ color: '#555', fontSize: '1.1rem', marginBottom: '2.5rem', lineHeight: 1.7 }}>
                            Join thousands of developers. Free forever — no credit card needed.
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.06, boxShadow: '0 0 60px rgba(99,102,241,0.5)' }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => navigate('/signup')}
                            style={{
                                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                border: 'none', color: 'white',
                                padding: '1.1rem 3rem', borderRadius: '14px',
                                fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer',
                                position: 'relative', overflow: 'hidden',
                            }}
                        >
                            <motion.div
                                style={{
                                    position: 'absolute', top: 0, left: '-100%', width: '100%', height: '100%',
                                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                                }}
                                animate={{ left: ['100%', '-100%'] }}
                                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: 'linear' }}
                            />
                            Start Building for Free →
                        </motion.button>
                    </Reveal>
                </div>
            </section>

            {/* ═══════════ FOOTER ═══════════ */}
            <footer style={{
                padding: '2.5rem 2rem',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                textAlign: 'center',
            }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <AnimatedLogo />
                    <span style={{ fontWeight: 700, fontSize: '1rem' }}>Symphony</span>
                </div>
                <p style={{ color: '#333', fontSize: '0.78rem' }}>
                    © 2026 Symphony. Built with ❤ for developer teams.
                </p>
            </footer>
        </div>
    );
}
