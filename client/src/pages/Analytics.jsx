import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getProjects, getProjectAnalytics } from '../api';
import SvgBackground from '../components/SvgBackground';

// SVG Donut Chart
function DonutChart({ data, colors, size = 180 }) {
    const total = data.reduce((s, d) => s + d.value, 0);
    if (total === 0) return <svg width={size} height={size}><circle cx={size / 2} cy={size / 2} r={size / 2 - 20} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="20" /></svg>;
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
                        fill="none" stroke={colors[i]} strokeWidth="18"
                        strokeDasharray={dashArray}
                        strokeDashoffset={dashOffset}
                        strokeLinecap="round"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.2, duration: 0.5 }}
                        style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                    />
                );
            })}
            <text x={size / 2} y={size / 2 - 6} textAnchor="middle" fill="white" fontSize="1.8rem" fontWeight="700">{total}</text>
            <text x={size / 2} y={size / 2 + 16} textAnchor="middle" fill="#888" fontSize="0.7rem">Total Tasks</text>
        </svg>
    );
}

// SVG Bar Chart
function BarChart({ data, maxBars = 8 }) {
    const sliced = data.slice(0, maxBars);
    const max = Math.max(...sliced.map(d => d.count), 1);
    const barWidth = 100 / (sliced.length * 2);

    return (
        <svg viewBox="0 0 300 160" style={{ width: '100%' }}>
            {sliced.map((d, i) => {
                const barHeight = (d.count / max) * 120;
                const x = 20 + i * (260 / sliced.length);
                return (
                    <g key={d.name}>
                        <motion.rect
                            x={x} y={140 - barHeight} width={barWidth + '%'} height={barHeight}
                            rx="4" fill="url(#barGrad)"
                            initial={{ height: 0, y: 140 }}
                            animate={{ height: barHeight, y: 140 - barHeight }}
                            transition={{ delay: i * 0.1, type: 'spring', damping: 15 }}
                        />
                        <text x={x + 12} y={155} textAnchor="middle" fill="#888" fontSize="7" style={{ overflow: 'hidden' }}>
                            {d.name.length > 8 ? d.name.slice(0, 8) + '…' : d.name}
                        </text>
                        <text x={x + 12} y={135 - barHeight} textAnchor="middle" fill="#a0a0b0" fontSize="8" fontWeight="600">{d.count}</text>
                    </g>
                );
            })}
            <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
            </defs>
        </svg>
    );
}

// SVG Sparkline
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
                fill="none" stroke={color} strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
            />
            <polygon points={`0,${height} ${points} ${width},${height}`} fill="url(#sparkGrad)" opacity="0.5" />
        </svg>
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

    if (loading) return <div style={{ padding: '2rem', color: '#888' }}>Loading...</div>;

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
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>📊 Analytics</h1>
                        <p style={{ color: '#888', fontSize: '0.85rem' }}>Track your team's progress and productivity</p>
                    </div>
                    <select
                        value={selectedProject || ''}
                        onChange={e => setSelectedProject(e.target.value)}
                        style={{
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '10px', padding: '0.6rem 1rem', color: '#e0e0e0',
                            fontSize: '0.85rem', outline: 'none', cursor: 'pointer',
                        }}
                    >
                        {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                </div>
            </header>

            {analytics ? (
                <>
                    {/* Summary cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                        {[
                            { label: 'Total Tasks', value: analytics.total, color: '#6366f1', icon: '📋' },
                            { label: 'Completion', value: analytics.completionRate + '%', color: '#22c55e', icon: '✅' },
                            { label: 'In Progress', value: analytics.statusCounts?.['in-progress'] || 0, color: '#f59e0b', icon: '⏳' },
                            { label: 'High Priority', value: analytics.priorityCounts?.high || 0, color: '#ef4444', icon: '🔴' },
                        ].map((card, i) => (
                            <motion.div
                                key={card.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ y: -4, borderColor: card.color + '33' }}
                                style={{
                                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: '16px', padding: '1.25rem', transition: 'border-color 0.2s',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '1.5rem' }}>{card.icon}</span>
                                    <span style={{ fontSize: '0.7rem', color: card.color, fontWeight: 600 }}>{card.label}</span>
                                </div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{card.value}</div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Charts grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
                        {/* Status Donut */}
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '1.5rem' }}
                        >
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem' }}>Tasks by Status</h3>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <DonutChart data={statusData} colors={['#6366f1', '#f59e0b', '#22c55e']} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                                {statusData.map((d, i) => (
                                    <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#a0a0b0' }}>
                                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: ['#6366f1', '#f59e0b', '#22c55e'][i] }} />
                                        {d.label}: {d.value}
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Priority Donut */}
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '1.5rem' }}
                        >
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem' }}>Tasks by Priority</h3>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <DonutChart data={priorityData} colors={['#22c55e', '#f59e0b', '#ef4444']} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                                {priorityData.map((d, i) => (
                                    <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#a0a0b0' }}>
                                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: ['#22c55e', '#f59e0b', '#ef4444'][i] }} />
                                        {d.label}: {d.value}
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Team Members Bar Chart */}
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '1.5rem' }}
                        >
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem' }}>Tasks by Team Member</h3>
                            {analytics.memberStats?.length > 0 ? (
                                <BarChart data={analytics.memberStats} />
                            ) : (
                                <div style={{ textAlign: 'center', color: '#555', padding: '2rem' }}>No assigned tasks</div>
                            )}
                        </motion.div>

                        {/* Timeline Sparkline */}
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '1.5rem' }}
                        >
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem' }}>Tasks Created (Last 30 Days)</h3>
                            {analytics.timeline?.length > 0 ? (
                                <Sparkline data={analytics.timeline} />
                            ) : (
                                <div style={{ textAlign: 'center', color: '#555', padding: '2rem' }}>No timeline data</div>
                            )}
                        </motion.div>
                    </div>
                </>
            ) : (
                <div style={{ textAlign: 'center', color: '#555', padding: '3rem' }}>
                    Select a project to view analytics.
                </div>
            )}
        </motion.div>
    );
}
