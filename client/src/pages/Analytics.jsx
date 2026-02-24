import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { getProjects, getProjectAnalytics } from '../api';
import SvgBackground from '../components/SvgBackground';

// Animated counter hook
function useAnimatedCounter(end, duration = 1500, startOnView = true) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const inView = useInView(ref, { once: true });

    useEffect(() => {
        if (!startOnView || !inView) return;
        const startTime = Date.now();
        const step = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * end));
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [end, duration, inView, startOnView]);

    return { count, ref };
}

// SVG Donut Chart with hover effects
function DonutChart({ data, colors, size = 180 }) {
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const total = data.reduce((s, d) => s + d.value, 0);
    if (total === 0) return (
        <svg width={size} height={size}>
            <circle cx={size / 2} cy={size / 2} r={size / 2 - 20} fill="none" stroke="var(--border-color)" strokeWidth="20" strokeDasharray="4 4" />
            <text x={size / 2} y={size / 2 + 4} textAnchor="middle" fill="var(--text-tertiary)" fontSize="0.8rem">No Data</text>
        </svg>
    );
    const radius = size / 2 - 20;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {data.map((d, i) => {
                const pct = d.value / total;
                const dashArray = `${circumference * pct} ${circumference * (1 - pct)}`;
                const dashOffset = -circumference * offset;
                offset += pct;
                return (
                    <motion.circle
                        key={d.label}
                        cx={size / 2} cy={size / 2} r={radius}
                        fill="none" stroke={colors[i]}
                        strokeWidth={hoveredIndex === i ? 24 : 18}
                        strokeDasharray={dashArray}
                        strokeDashoffset={dashOffset}
                        strokeLinecap="round"
                        initial={{ opacity: 0, strokeDashoffset: dashOffset + circumference * pct }}
                        animate={{ opacity: 1, strokeDashoffset: dashOffset, strokeWidth: hoveredIndex === i ? 24 : 18 }}
                        transition={{ delay: i * 0.2, duration: 0.8, ease: 'easeOut' }}
                        style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', cursor: 'pointer' }}
                        onMouseEnter={() => setHoveredIndex(i)}
                        onMouseLeave={() => setHoveredIndex(null)}
                    />
                );
            })}
            <text x={size / 2} y={size / 2 - 6} textAnchor="middle" fill="var(--text-primary)" fontSize="1.8rem" fontWeight="700">{total}</text>
            <text x={size / 2} y={size / 2 + 16} textAnchor="middle" fill="var(--text-tertiary)" fontSize="0.7rem">
                {hoveredIndex !== null ? `${data[hoveredIndex].label}: ${data[hoveredIndex].value}` : 'Total Tasks'}
            </text>
        </svg>
    );
}

// SVG Bar Chart with hover tooltips
function BarChart({ data, maxBars = 8 }) {
    const [hoveredBar, setHoveredBar] = useState(null);
    const sliced = data.slice(0, maxBars);
    const max = Math.max(...sliced.map(d => d.count), 1);
    const barW = 24;
    const gap = (260 - sliced.length * barW) / (sliced.length + 1);

    return (
        <svg viewBox="0 0 300 170" style={{ width: '100%' }}>
            <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
                <linearGradient id="barGradHover" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
                <filter id="barGlow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
                <line key={i} x1="15" y1={140 - pct * 120} x2="290" y2={140 - pct * 120} stroke="var(--border-color)" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.3" />
            ))}
            {sliced.map((d, i) => {
                const barHeight = (d.count / max) * 120;
                const x = 20 + gap + i * (barW + gap);
                const isHovered = hoveredBar === i;
                return (
                    <g key={d.name} onMouseEnter={() => setHoveredBar(i)} onMouseLeave={() => setHoveredBar(null)} style={{ cursor: 'pointer' }}>
                        <motion.rect
                            x={x} y={140 - barHeight} width={barW} height={barHeight}
                            rx="4" fill={isHovered ? 'url(#barGradHover)' : 'url(#barGrad)'}
                            filter={isHovered ? 'url(#barGlow)' : 'none'}
                            initial={{ height: 0, y: 140 }}
                            animate={{ height: barHeight, y: 140 - barHeight, opacity: isHovered ? 1 : 0.85 }}
                            transition={{ delay: i * 0.1, type: 'spring', damping: 15 }}
                        />
                        {isHovered && (
                            <g>
                                <rect x={x - 10} y={125 - barHeight} width={barW + 20} height="18" rx="4" fill="var(--bg-card)" stroke="var(--border-color)" />
                                <text x={x + barW / 2} y={137 - barHeight} textAnchor="middle" fill="var(--text-primary)" fontSize="8" fontWeight="600">{d.count} tasks</text>
                            </g>
                        )}
                        {!isHovered && (
                            <text x={x + barW / 2} y={133 - barHeight} textAnchor="middle" fill="var(--text-secondary)" fontSize="8" fontWeight="600">{d.count}</text>
                        )}
                        <text x={x + barW / 2} y={155} textAnchor="middle" fill="var(--text-tertiary)" fontSize="7">
                            {d.name.length > 8 ? d.name.slice(0, 8) + '…' : d.name}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

// SVG Sparkline with animated gradient fill
function Sparkline({ data, width = 300, height = 80, color = '#6366f1' }) {
    const max = Math.max(...data.map(d => d.created), 1);
    const points = data.map((d, i) => `${(i / (data.length - 1)) * width},${height - (d.created / max) * (height - 10) - 5}`).join(' ');

    return (
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%' }}>
            <defs>
                <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <motion.polyline
                points={points}
                fill="none" stroke={color} strokeWidth="2.5"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
            />
            <motion.polygon
                points={`0,${height} ${points} ${width},${height}`}
                fill="url(#sparkGrad)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: 1, duration: 0.5 }}
            />
            {/* Animated dots on data points */}
            {data.map((d, i) => {
                const x = (i / (data.length - 1)) * width;
                const y = height - (d.created / max) * (height - 10) - 5;
                return (
                    <motion.circle
                        key={i}
                        cx={x} cy={y} r="3"
                        fill={color} stroke="var(--bg-card)" strokeWidth="1.5"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.05, type: 'spring' }}
                    />
                );
            })}
        </svg>
    );
}

// NEW: Animated Gauge Chart
function GaugeChart({ value, max = 100, label = 'Completion', size = 160 }) {
    const radius = size / 2 - 16;
    const circumference = Math.PI * radius;
    const pct = Math.min(value / max, 1);
    const color = pct > 0.7 ? '#22c55e' : pct > 0.4 ? '#f59e0b' : '#ef4444';

    return (
        <svg width={size} height={size / 2 + 30} viewBox={`0 0 ${size} ${size / 2 + 30}`}>
            <defs>
                <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
            </defs>
            {/* Background arc */}
            <path
                d={`M ${16} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 16} ${size / 2}`}
                fill="none" stroke="var(--border-color)" strokeWidth="12" strokeLinecap="round"
            />
            {/* Animated value arc */}
            <motion.path
                d={`M ${16} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 16} ${size / 2}`}
                fill="none" stroke="url(#gaugeGrad)" strokeWidth="12" strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: circumference * (1 - pct) }}
                transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
            />
            {/* Needle */}
            <motion.g
                initial={{ rotate: -90 }}
                animate={{ rotate: -90 + 180 * pct }}
                transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
                style={{ transformOrigin: `${size / 2}px ${size / 2}px` }}
            >
                <line x1={size / 2} y1={size / 2} x2={size / 2} y2={size / 2 - radius + 22} stroke={color} strokeWidth="2" strokeLinecap="round" />
                <circle cx={size / 2} cy={size / 2} r="5" fill={color} />
            </motion.g>
            <text x={size / 2} y={size / 2 + 20} textAnchor="middle" fill="var(--text-primary)" fontSize="1.2rem" fontWeight="700">{value}%</text>
            <text x={size / 2} y={size / 2 + 34} textAnchor="middle" fill="var(--text-tertiary)" fontSize="0.6rem">{label}</text>
        </svg>
    );
}

// NEW: Weekly Heatmap
function WeeklyHeatmap({ data }) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeks = 4;
    const cellSize = 28;
    const gap = 4;
    const max = Math.max(...data.flat(), 1);

    return (
        <svg width={(cellSize + gap) * weeks + 40} height={(cellSize + gap) * 7 + 20} viewBox={`0 0 ${(cellSize + gap) * weeks + 40} ${(cellSize + gap) * 7 + 20}`}>
            {days.map((day, di) => (
                <text key={day} x="0" y={10 + di * (cellSize + gap) + cellSize / 2 + 4} fontSize="8" fill="var(--text-tertiary)">{day}</text>
            ))}
            {Array.from({ length: weeks }, (_, wi) =>
                days.map((_, di) => {
                    const val = data[wi]?.[di] || 0;
                    const intensity = val / max;
                    return (
                        <motion.rect
                            key={`${wi}-${di}`}
                            x={35 + wi * (cellSize + gap)}
                            y={di * (cellSize + gap)}
                            width={cellSize}
                            height={cellSize}
                            rx="6"
                            fill={val === 0 ? 'var(--bg-hover)' : `rgba(99, 102, 241, ${0.2 + intensity * 0.8})`}
                            stroke={val > 0 ? 'rgba(99, 102, 241, 0.3)' : 'transparent'}
                            strokeWidth="1"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: (wi * 7 + di) * 0.02, type: 'spring', damping: 15 }}
                            style={{ cursor: 'pointer' }}
                        >
                            <title>{val} tasks</title>
                        </motion.rect>
                    );
                })
            )}
        </svg>
    );
}

// NEW: Animated Radar / Skill Polygon
function RadarChart({ data, size = 200 }) {
    const cx = size / 2, cy = size / 2;
    const radius = size / 2 - 30;
    const n = data.length;
    if (n < 3) return null;
    const max = Math.max(...data.map(d => d.value), 1);

    const getPoint = (index, value) => {
        const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
        const r = (value / max) * radius;
        return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
    };

    // Grid rings
    const rings = [0.25, 0.5, 0.75, 1];

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Grid */}
            {rings.map((ring, ri) => (
                <polygon
                    key={ri}
                    points={data.map((_, i) => { const p = getPoint(i, max * ring); return `${p.x},${p.y}`; }).join(' ')}
                    fill="none" stroke="var(--border-color)" strokeWidth="0.5" opacity="0.5"
                />
            ))}
            {/* Axes */}
            {data.map((d, i) => {
                const p = getPoint(i, max);
                const labelP = getPoint(i, max * 1.2);
                return (
                    <g key={i}>
                        <line x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--border-color)" strokeWidth="0.5" opacity="0.3" />
                        <text x={labelP.x} y={labelP.y + 3} textAnchor="middle" fill="var(--text-tertiary)" fontSize="7">{d.label}</text>
                    </g>
                );
            })}
            {/* Data polygon */}
            <motion.polygon
                points={data.map((d, i) => { const p = getPoint(i, d.value); return `${p.x},${p.y}`; }).join(' ')}
                fill="rgba(99, 102, 241, 0.15)"
                stroke="#6366f1"
                strokeWidth="2"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{ transformOrigin: 'center' }}
            />
            {/* Data points */}
            {data.map((d, i) => {
                const p = getPoint(i, d.value);
                return (
                    <motion.circle
                        key={i}
                        cx={p.x} cy={p.y} r="4"
                        fill="#6366f1" stroke="var(--bg-card)" strokeWidth="2"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.1, type: 'spring' }}
                    />
                );
            })}
        </svg>
    );
}

// Stat card with animated counter
function StatCard({ label, value, color, icon, delay = 0 }) {
    const numericValue = typeof value === 'number' ? value : parseInt(value) || 0;
    const isPercentage = typeof value === 'string' && value.includes('%');
    const { count, ref } = useAnimatedCounter(numericValue, 1200);

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            whileHover={{ y: -6, borderColor: color + '44', boxShadow: `0 8px 30px ${color}15` }}
            style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '1.25rem',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Subtle color glow */}
            <div style={{
                position: 'absolute', top: '-20px', right: '-20px',
                width: '80px', height: '80px', borderRadius: '50%',
                background: color, opacity: 0.05, filter: 'blur(20px)'
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{icon}</span>
                <span style={{ fontSize: '0.7rem', color, fontWeight: 600 }}>{label}</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {count}{isPercentage ? '%' : ''}
            </div>
        </motion.div>
    );
}

export default function Analytics() {
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await getProjects();
                const projs = res.data.projects || res.data || [];
                setProjects(projs);
                if (projs.length > 0) {
                    setSelectedProject(projs[0]._id);
                }
            } catch (err) {
                console.error('Failed to load projects:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    useEffect(() => {
        if (!selectedProject) return;
        (async () => {
            try {
                const res = await getProjectAnalytics(selectedProject);
                setAnalytics(res.data);
            } catch (err) {
                console.error('Failed to load analytics:', err);
            }
        })();
    }, [selectedProject]);

    const statusData = analytics ? [
        { label: 'To Do', value: analytics.statusCounts?.todo || 0 },
        { label: 'In Progress', value: analytics.statusCounts?.['in-progress'] || 0 },
        { label: 'Done', value: analytics.statusCounts?.done || 0 },
    ] : [];

    const priorityData = analytics ? [
        { label: 'Low', value: analytics.priorityCounts?.low || 0 },
        { label: 'Medium', value: analytics.priorityCounts?.medium || 0 },
        { label: 'High', value: analytics.priorityCounts?.high || 0 },
    ] : [];

    // Generate sample heatmap from timeline data
    const heatmapData = analytics?.timeline ? (() => {
        const weeks = [[], [], [], []];
        analytics.timeline.slice(-28).forEach((d, i) => {
            const week = Math.floor(i / 7);
            if (weeks[week]) weeks[week].push(d.created || 0);
        });
        // Pad to 7 days per week
        return weeks.map(w => { while (w.length < 7) w.push(0); return w; });
    })() : [[0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0]];

    // Radar chart data from status and priority
    const radarData = analytics ? [
        { label: 'To Do', value: analytics.statusCounts?.todo || 0 },
        { label: 'Active', value: analytics.statusCounts?.['in-progress'] || 0 },
        { label: 'Done', value: analytics.statusCounts?.done || 0 },
        { label: 'High P', value: analytics.priorityCounts?.high || 0 },
        { label: 'Med P', value: analytics.priorityCounts?.medium || 0 },
        { label: 'Low P', value: analytics.priorityCounts?.low || 0 },
    ] : [];

    if (loading) return <div style={{ padding: '2rem', color: 'var(--text-tertiary)' }}>Loading...</div>;

    const cardStyle = {
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '1.5rem'
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ padding: '0' }}
        >
            <header className="page-header" style={{ position: 'relative', overflow: 'hidden', marginBottom: '1.5rem' }}>
                <SvgBackground variant="default" opacity={0.03} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>📊 Analytics</h1>
                        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Track your team's progress and productivity</p>
                    </div>
                    <select
                        value={selectedProject || ''}
                        onChange={e => setSelectedProject(e.target.value)}
                        style={{
                            background: 'var(--bg-hover)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '10px',
                            padding: '0.6rem 1rem',
                            color: 'var(--text-primary)',
                            fontSize: '0.85rem',
                            outline: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                </div>
            </header>

            {analytics ? (
                <>
                    {/* Summary cards with animated counters */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                        <StatCard label="Total Tasks" value={analytics.total} color="#6366f1" icon="📋" delay={0} />
                        <StatCard label="Completion" value={analytics.completionRate + '%'} color="#22c55e" icon="✅" delay={0.1} />
                        <StatCard label="In Progress" value={analytics.statusCounts?.['in-progress'] || 0} color="#f59e0b" icon="⏳" delay={0.2} />
                        <StatCard label="High Priority" value={analytics.priorityCounts?.high || 0} color="#ef4444" icon="🔴" delay={0.3} />
                    </div>

                    {/* Gauge + Radar Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                            style={cardStyle}
                        >
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>Completion Rate</h3>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <GaugeChart value={analytics.completionRate || 0} label="Project Progress" />
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
                            style={cardStyle}
                        >
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>Task Distribution</h3>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <RadarChart data={radarData} />
                            </div>
                        </motion.div>
                    </div>

                    {/* Donut Charts Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                        {/* Status Donut */}
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                            style={cardStyle}
                        >
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>Tasks by Status</h3>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <DonutChart data={statusData} colors={['#6366f1', '#f59e0b', '#22c55e']} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                                {statusData.map((d, i) => (
                                    <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: ['#6366f1', '#f59e0b', '#22c55e'][i] }} />
                                        {d.label}: {d.value}
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Priority Donut */}
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                            style={cardStyle}
                        >
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>Tasks by Priority</h3>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <DonutChart data={priorityData} colors={['#22c55e', '#f59e0b', '#ef4444']} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                                {priorityData.map((d, i) => (
                                    <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: ['#22c55e', '#f59e0b', '#ef4444'][i] }} />
                                        {d.label}: {d.value}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* Bar Chart + Heatmap Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                        {/* Team Members Bar Chart */}
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                            style={cardStyle}
                        >
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>Tasks by Team Member</h3>
                            {analytics.memberStats?.length > 0 ? (
                                <BarChart data={analytics.memberStats} />
                            ) : (
                                <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '2rem' }}>No assigned tasks</div>
                            )}
                        </motion.div>

                        {/* Weekly Heatmap */}
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                            style={cardStyle}
                        >
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>Activity Heatmap</h3>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <WeeklyHeatmap data={heatmapData} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', marginTop: '0.75rem' }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Less</span>
                                {[0.1, 0.3, 0.6, 1].map((op, i) => (
                                    <div key={i} style={{ width: 12, height: 12, borderRadius: '3px', background: `rgba(99, 102, 241, ${op})` }} />
                                ))}
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>More</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Timeline Sparkline */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                        style={cardStyle}
                    >
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>Tasks Created (Last 30 Days)</h3>
                        {analytics.timeline?.length > 0 ? (
                            <Sparkline data={analytics.timeline} />
                        ) : (
                            <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '2rem' }}>No timeline data</div>
                        )}
                    </motion.div>
                </>
            ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '3rem' }}>
                    Select a project to view analytics.
                </div>
            )}
        </motion.div>
    );
}
