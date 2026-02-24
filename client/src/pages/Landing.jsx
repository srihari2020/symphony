import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

/* ─── tiny reusable scroll-reveal wrapper ─── */
const Reveal = ({ children, delay = 0, direction = 'up', ...rest }) => {
    const y = direction === 'up' ? 60 : direction === 'down' ? -60 : 0;
    const x = direction === 'left' ? 60 : direction === 'right' ? -60 : 0;
    return (
        <motion.div
            initial={{ opacity: 0, y, x }}
            whileInView={{ opacity: 1, y: 0, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
            {...rest}
        >
            {children}
        </motion.div>
    );
};

/* ─── animated counter ─── */
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
        let start = 0;
        const step = target / (duration * 60);
        const id = setInterval(() => {
            start += step;
            if (start >= target) { setCount(target); clearInterval(id); }
            else setCount(Math.floor(start));
        }, 1000 / 60);
        return () => clearInterval(id);
    }, [started, target, duration]);

    return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

/* ─── floating particles background ─── */
const Particles = () => (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
                key={i}
                style={{
                    position: 'absolute',
                    width: Math.random() * 4 + 2,
                    height: Math.random() * 4 + 2,
                    borderRadius: '50%',
                    background: `rgba(${99 + Math.random() * 60}, ${102 + Math.random() * 100}, 241, ${0.15 + Math.random() * 0.25})`,
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                }}
                animate={{
                    y: [0, -30 - Math.random() * 50, 0],
                    x: [0, (Math.random() - 0.5) * 40, 0],
                    opacity: [0.2, 0.6, 0.2],
                }}
                transition={{
                    duration: 4 + Math.random() * 6,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: Math.random() * 3,
                }}
            />
        ))}
    </div>
);

/* ─── grid glow lines ─── */
const GridLines = () => (
    <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0,
        opacity: 0.06,
        backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.5) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
    }} />
);

export default function Landing() {
    const navigate = useNavigate();
    const { scrollYProgress } = useScroll();
    const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);
    const heroY = useTransform(scrollYProgress, [0, 0.15], [0, -80]);

    const features = [
        {
            icon: '📋', title: 'Smart Kanban Boards',
            desc: 'Drag-and-drop project management with real-time collaboration. Track tasks from idea to completion.',
            color: '#6366f1'
        },
        {
            icon: '👥', title: 'Team Discovery',
            desc: 'Find and connect with talented developers. Build dream teams with AI-powered candidate matching.',
            color: '#2dd4bf'
        },
        {
            icon: '💬', title: 'Community Hub',
            desc: 'Share insights, discuss trends, and get help from the global developer community. Integrated with Dev.to.',
            color: '#f59e0b'
        },
        {
            icon: '🔗', title: 'GitHub & Slack',
            desc: 'Native integrations with the tools you already use. Auto-sync repos and get notifications in Slack.',
            color: '#ef4444'
        },
        {
            icon: '🎨', title: 'Stunning UI',
            desc: 'Premium dark & light themes with smooth animations. A workspace that\'s a pleasure to look at.',
            color: '#8b5cf6'
        },
        {
            icon: '🔔', title: 'Smart Notifications',
            desc: 'Real-time alerts via WebSocket. Customizable email digests — daily, weekly, or real-time.',
            color: '#06b6d4'
        },
    ];

    const steps = [
        { num: '01', title: 'Create your workspace', desc: 'Sign up in seconds. Create your organization and invite your team.', icon: '🚀' },
        { num: '02', title: 'Build your projects', desc: 'Kanban boards, task assignments, deadlines — everything in one place.', icon: '🏗️' },
        { num: '03', title: 'Collaborate & grow', desc: 'Team chat, community posts, and integrations keep everyone in sync.', icon: '🌱' },
    ];

    return (
        <div style={{
            background: '#0a0a10',
            color: 'white',
            overflowX: 'hidden',
            fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}>

            {/* ═══════════ HERO ═══════════ */}
            <motion.section style={{
                minHeight: '100vh',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
                textAlign: 'center',
                padding: '2rem',
                scale: heroScale,
                opacity: heroOpacity,
                y: heroY,
            }}>
                <Particles />
                <GridLines />

                {/* Glow orbs */}
                <div style={{
                    position: 'absolute', top: '20%', left: '20%', width: '400px', height: '400px',
                    background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
                    borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none',
                }} />
                <div style={{
                    position: 'absolute', bottom: '20%', right: '15%', width: '350px', height: '350px',
                    background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
                    borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none',
                }} />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                        background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)',
                        borderRadius: '999px', padding: '0.4rem 1.2rem', marginBottom: '2rem',
                        fontSize: '0.85rem', color: '#818cf8', zIndex: 1,
                    }}
                >
                    <motion.span
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >●</motion.span>
                    Now in public beta
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                    style={{
                        fontSize: 'clamp(3rem, 8vw, 6rem)',
                        fontWeight: 800,
                        lineHeight: 1.05,
                        marginBottom: '1.5rem',
                        zIndex: 1,
                        background: 'linear-gradient(135deg, #ffffff 0%, #a5b4fc 50%, #6366f1 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-0.03em',
                    }}
                >
                    Build Together.<br />Ship Faster.
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    style={{
                        fontSize: 'clamp(1rem, 2vw, 1.3rem)',
                        color: '#8888aa',
                        maxWidth: '600px',
                        lineHeight: 1.7,
                        marginBottom: '2.5rem',
                        zIndex: 1,
                    }}
                >
                    Symphony is the all-in-one platform for developer teams.
                    Manage projects, discover talent, and collaborate — all from one beautiful workspace.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', zIndex: 1 }}
                >
                    <motion.button
                        whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(99,102,241,0.4)' }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => navigate('/signup')}
                        style={{
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            border: 'none',
                            color: 'white',
                            padding: '1rem 2.5rem',
                            borderRadius: '14px',
                            fontSize: '1.05rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            letterSpacing: '-0.01em',
                        }}
                    >
                        Get Started Free →
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.08)' }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => navigate('/login')}
                        style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            color: 'white',
                            padding: '1rem 2.5rem',
                            borderRadius: '14px',
                            fontSize: '1.05rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        Sign In
                    </motion.button>
                </motion.div>

                {/* Scroll indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    style={{
                        position: 'absolute', bottom: '2rem', zIndex: 1,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                    }}
                >
                    <span style={{ fontSize: '0.75rem', color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        Scroll to explore
                    </span>
                    <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        style={{
                            width: '24px', height: '40px', borderRadius: '12px',
                            border: '2px solid rgba(255,255,255,0.2)',
                            display: 'flex', justifyContent: 'center', paddingTop: '8px',
                        }}
                    >
                        <motion.div
                            animate={{ opacity: [1, 0], y: [0, 12] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            style={{ width: '3px', height: '8px', borderRadius: '3px', background: '#6366f1' }}
                        />
                    </motion.div>
                </motion.div>
            </motion.section>

            {/* ═══════════ FEATURES ═══════════ */}
            <section style={{ padding: '8rem 2rem', position: 'relative' }}>
                <GridLines />
                <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                    <Reveal>
                        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                            <span style={{
                                fontSize: '0.8rem', color: '#6366f1', letterSpacing: '0.15em',
                                textTransform: 'uppercase', fontWeight: 600,
                            }}>
                                Features
                            </span>
                            <h2 style={{
                                fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 700,
                                marginTop: '0.75rem', letterSpacing: '-0.02em',
                                background: 'linear-gradient(135deg, #fff 0%, #999 100%)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            }}>
                                Everything you need,<br />nothing you don't
                            </h2>
                        </div>
                    </Reveal>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '1.5rem',
                    }}>
                        {features.map((f, i) => (
                            <Reveal key={f.title} delay={i * 0.1}>
                                <motion.div
                                    whileHover={{
                                        y: -8,
                                        boxShadow: `0 20px 60px rgba(0,0,0,0.4), 0 0 40px ${f.color}15`,
                                    }}
                                    style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        borderRadius: '20px',
                                        padding: '2rem',
                                        cursor: 'default',
                                        transition: 'border-color 0.3s',
                                        position: 'relative',
                                        overflow: 'hidden',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = `${f.color}40`}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
                                >
                                    {/* Glow dot */}
                                    <div style={{
                                        position: 'absolute', top: '-30px', right: '-30px',
                                        width: '100px', height: '100px', borderRadius: '50%',
                                        background: `radial-gradient(circle, ${f.color}15, transparent 70%)`,
                                    }} />
                                    <div style={{
                                        fontSize: '2.2rem', marginBottom: '1rem',
                                        width: '56px', height: '56px', borderRadius: '16px',
                                        background: `${f.color}12`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        {f.icon}
                                    </div>
                                    <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.75rem', color: '#fff' }}>
                                        {f.title}
                                    </h3>
                                    <p style={{ color: '#777', lineHeight: 1.7, fontSize: '0.92rem' }}>
                                        {f.desc}
                                    </p>
                                </motion.div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════ HOW IT WORKS ═══════════ */}
            <section style={{
                padding: '8rem 2rem',
                position: 'relative',
                background: 'linear-gradient(180deg, transparent 0%, rgba(99,102,241,0.03) 50%, transparent 100%)',
            }}>
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <Reveal>
                        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                            <span style={{
                                fontSize: '0.8rem', color: '#2dd4bf', letterSpacing: '0.15em',
                                textTransform: 'uppercase', fontWeight: 600,
                            }}>
                                How it works
                            </span>
                            <h2 style={{
                                fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 700,
                                marginTop: '0.75rem', letterSpacing: '-0.02em',
                            }}>
                                Up and running in minutes
                            </h2>
                        </div>
                    </Reveal>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                        {steps.map((s, i) => (
                            <Reveal key={s.num} delay={i * 0.15} direction={i % 2 === 0 ? 'left' : 'right'}>
                                <motion.div
                                    whileHover={{ x: 8 }}
                                    style={{
                                        display: 'flex', alignItems: 'flex-start', gap: '2rem',
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        borderRadius: '20px',
                                        padding: '2.5rem',
                                        position: 'relative',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <div style={{
                                        position: 'absolute', top: 0, left: 0, width: '4px', height: '100%',
                                        background: `linear-gradient(180deg, #6366f1, #2dd4bf)`,
                                        borderRadius: '4px',
                                    }} />
                                    <div style={{
                                        fontSize: '2.5rem', flexShrink: 0,
                                        width: '70px', height: '70px', borderRadius: '20px',
                                        background: 'rgba(99,102,241,0.08)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        {s.icon}
                                    </div>
                                    <div>
                                        <span style={{
                                            fontSize: '0.75rem', color: '#6366f1', fontWeight: 700,
                                            letterSpacing: '0.1em',
                                        }}>
                                            STEP {s.num}
                                        </span>
                                        <h3 style={{ fontSize: '1.3rem', fontWeight: 600, margin: '0.5rem 0', color: '#fff' }}>
                                            {s.title}
                                        </h3>
                                        <p style={{ color: '#777', lineHeight: 1.7, fontSize: '0.95rem' }}>
                                            {s.desc}
                                        </p>
                                    </div>
                                </motion.div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════ STATS ═══════════ */}
            <section style={{ padding: '6rem 2rem', position: 'relative' }}>
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '2rem', textAlign: 'center',
                    }}>
                        {[
                            { value: 1200, suffix: '+', label: 'Active Users' },
                            { value: 350, suffix: '+', label: 'Projects Managed' },
                            { value: 15, suffix: 'k+', label: 'Tasks Completed' },
                            { value: 99, suffix: '%', label: 'Uptime' },
                        ].map((s, i) => (
                            <Reveal key={s.label} delay={i * 0.1}>
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    style={{
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        borderRadius: '20px',
                                        padding: '2rem 1.5rem',
                                    }}
                                >
                                    <div style={{
                                        fontSize: 'clamp(2rem, 4vw, 3rem)',
                                        fontWeight: 800,
                                        background: 'linear-gradient(135deg, #6366f1, #2dd4bf)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        marginBottom: '0.5rem',
                                    }}>
                                        <Counter target={s.value} suffix={s.suffix} />
                                    </div>
                                    <div style={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>{s.label}</div>
                                </motion.div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════ TESTIMONIAL-STYLE QUOTE ═══════════ */}
            <section style={{
                padding: '6rem 2rem',
                background: 'linear-gradient(180deg, transparent 0%, rgba(99,102,241,0.04) 50%, transparent 100%)',
            }}>
                <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
                    <Reveal>
                        <motion.div
                            style={{
                                fontSize: '5rem',
                                lineHeight: 1,
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                marginBottom: '1.5rem',
                            }}
                        >
                            "
                        </motion.div>
                        <p style={{
                            fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
                            color: '#bbb',
                            lineHeight: 1.8,
                            fontStyle: 'italic',
                            marginBottom: '2rem',
                        }}>
                            Symphony replaced five different tools for our team. Project boards, team discovery,
                            community — it's all here, and the UI is gorgeous.
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, #6366f1, #2dd4bf)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 700, fontSize: '1.1rem',
                            }}>
                                A
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem' }}>Alex Chen</div>
                                <div style={{ color: '#666', fontSize: '0.8rem' }}>Engineering Lead, Acme Corp</div>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ═══════════ FINAL CTA ═══════════ */}
            <section style={{ padding: '8rem 2rem', position: 'relative', textAlign: 'center' }}>
                <Particles />
                <div style={{ maxWidth: '700px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                    <Reveal>
                        <h2 style={{
                            fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800,
                            marginBottom: '1.5rem', letterSpacing: '-0.02em',
                            background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 50%, #6366f1 100%)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>
                            Ready to build something amazing?
                        </h2>
                        <p style={{ color: '#777', fontSize: '1.15rem', marginBottom: '2.5rem', lineHeight: 1.7 }}>
                            Join thousands of developers. Free to get started — no credit card required.
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: '0 0 60px rgba(99,102,241,0.5)' }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => navigate('/signup')}
                            style={{
                                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                border: 'none', color: 'white',
                                padding: '1.1rem 3rem', borderRadius: '14px',
                                fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer',
                                letterSpacing: '-0.01em',
                            }}
                        >
                            Start Building for Free →
                        </motion.button>
                    </Reveal>
                </div>
            </section>

            {/* ═══════════ FOOTER ═══════════ */}
            <footer style={{
                padding: '3rem 2rem',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                textAlign: 'center',
            }}>
                <div style={{
                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem',
                    marginBottom: '1rem',
                }}>
                    <div style={{
                        width: '28px', height: '28px', borderRadius: '8px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.85rem',
                    }}>
                        S
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Symphony</span>
                </div>
                <p style={{ color: '#444', fontSize: '0.8rem' }}>
                    © 2026 Symphony. Built with ❤️ for developer teams.
                </p>
            </footer>
        </div>
    );
}
