import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getProject, getProjectDashboard, refreshProject } from '../api';
import { ListSkeleton } from '../components/LoadingSkeleton';
import AnimatedButton from '../components/AnimatedButton';
import Spotlight from '../components/Spotlight';

export default function ProjectDetail() {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [dashboard, setDashboard] = useState({ pullRequests: [], commits: [], slackMessages: [] });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('prs');

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const [projectRes, dashboardRes] = await Promise.all([
                getProject(id),
                getProjectDashboard(id)
            ]);
            setProject(projectRes.data);
            setDashboard(dashboardRes.data);
        } catch (err) {
            console.error('Error loading project:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            const res = await refreshProject(id);
            setDashboard(res.data);
        } catch (err) {
            console.error('Error refreshing:', err);
        } finally {
            setRefreshing(false);
        }
    };

    if (loading) {
        return <div className="project-detail"><ListSkeleton count={5} /></div>;
    }

    if (!project) {
        return <div className="error-page">Project not found</div>;
    }

    const tabVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
        exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
    };

    const TabButton = ({ id, label, count }) => (
        <button
            className={`tab ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
            style={{
                position: 'relative',
                background: 'transparent',
                border: 'none',
                padding: '0.75rem 1.5rem',
                color: activeTab === id ? '#fff' : '#a0a0b0',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: 500,
                transition: 'color 0.2s',
                zIndex: 1
            }}
        >
            {activeTab === id && (
                <motion.div
                    layoutId="activeTab"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'rgba(45, 212, 191, 0.15)',
                        border: '1px solid rgba(45, 212, 191, 0.3)',
                        borderRadius: '12px',
                        zIndex: -1
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {label}
                <span style={{
                    background: activeTab === id ? '#2dd4bf' : 'rgba(255,255,255,0.1)',
                    color: activeTab === id ? '#0f0f14' : '#a0a0b0',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontSize: '0.75rem',
                    fontWeight: 600
                }}>
                    {count}
                </span>
            </span>
        </button>
    );

    return (
        <motion.div
            className="project-detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{ padding: '0.5rem' }}
        >
            <header className="page-header" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div className="breadcrumb" style={{ marginBottom: '0.5rem', color: '#6b6b7b', fontSize: '0.9rem' }}>
                        <Link to="/" style={{ color: '#a0a0b0', textDecoration: 'none' }}>Projects</Link>
                        <span style={{ margin: '0 0.5rem' }}>/</span>
                        <span style={{ color: '#2dd4bf' }}>{project.name}</span>
                    </div>
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        style={{ fontSize: '2rem', background: 'linear-gradient(135deg, #fff 0%, #a0a0b0 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                    >
                        {project.name}
                    </motion.h1>
                </div>
                <AnimatedButton
                    variant="primary"
                    onClick={handleRefresh}
                    disabled={refreshing}
                >
                    {refreshing ? 'Refreshing...' : 'Refresh Data'}
                </AnimatedButton>
            </header>

            <div className="tabs" style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '2rem',
                background: 'rgba(255,255,255,0.02)',
                padding: '0.375rem',
                borderRadius: '16px',
                width: 'fit-content',
                border: '1px solid rgba(255,255,255,0.05)'
            }}>
                <TabButton id="prs" label="Pull Requests" count={dashboard.pullRequests.length} />
                <TabButton id="commits" label="Commits" count={dashboard.commits.length} />
                <TabButton id="slack" label="Slack" count={dashboard.slackMessages.length} />
            </div>

            <div className="tab-content" style={{ minHeight: '400px' }}>
                <AnimatePresence mode="wait">
                    {activeTab === 'prs' && (
                        <motion.div
                            key="prs"
                            className="data-list"
                            variants={tabVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
                        >
                            {dashboard.pullRequests.length === 0 ? (
                                <div className="empty-list" style={{ textAlign: 'center', padding: '4rem', color: '#6b6b7b' }}>No pull requests found</div>
                            ) : (
                                dashboard.pullRequests.map((pr, i) => (
                                    <Spotlight key={pr.id} className="list-item-spotlight">
                                        <a
                                            href={pr.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="list-item pr-item"
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '1rem',
                                                textDecoration: 'none',
                                                color: 'inherit',
                                                width: '100%',
                                                padding: '0.5rem'
                                            }}
                                        >
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '10px',
                                                background: pr.state === 'open' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(124, 58, 237, 0.1)',
                                                color: pr.state === 'open' ? '#22c55e' : '#7c3aed',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '1.25rem'
                                            }}>
                                                {pr.state === 'open' ? 'git-pull-request' : 'git-merge'}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '0.25rem', color: '#fff' }}>
                                                    {pr.title} <span style={{ color: '#6b6b7b', fontWeight: 400 }}>#{pr.number}</span>
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: '#6b6b7b' }}>
                                                    Opened by <span style={{ color: '#a0a0b0' }}>{pr.user.login}</span> • {formatDate(pr.createdAt)}
                                                </div>
                                            </div>
                                            <div style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '20px',
                                                backgroundColor: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                fontSize: '0.8rem'
                                            }}>
                                                {pr.state}
                                            </div>
                                        </a>
                                    </Spotlight>
                                ))
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'commits' && (
                        <motion.div
                            key="commits"
                            className="data-list"
                            variants={tabVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
                        >
                            {dashboard.commits.length === 0 ? (
                                <div className="empty-list" style={{ textAlign: 'center', padding: '4rem', color: '#6b6b7b' }}>No commits found</div>
                            ) : (
                                dashboard.commits.map((commit, i) => (
                                    <Spotlight key={commit.sha} className="list-item-spotlight">
                                        <a
                                            href={commit.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="list-item commit-item"
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '1rem',
                                                textDecoration: 'none',
                                                color: 'inherit',
                                                width: '100%',
                                                padding: '0.5rem'
                                            }}
                                        >
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '10px',
                                                background: 'rgba(99, 102, 241, 0.1)',
                                                color: '#6366f1',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '1.25rem'
                                            }}>
                                                code
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '0.25rem', color: '#fff', fontFamily: 'monospace' }}>
                                                    {commit.message.split('\n')[0]}
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: '#6b6b7b' }}>
                                                    {commit.author.name} • {formatDate(commit.date)} • <span style={{ fontFamily: 'monospace', color: '#2dd4bf' }}>{commit.sha.substring(0, 7)}</span>
                                                </div>
                                            </div>
                                        </a>
                                    </Spotlight>
                                ))
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'slack' && (
                        <motion.div
                            key="slack"
                            className="data-list"
                            variants={tabVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
                        >
                            {dashboard.slackMessages.length === 0 ? (
                                <div className="empty-list" style={{ textAlign: 'center', padding: '4rem', color: '#6b6b7b' }}>No messages found</div>
                            ) : (
                                dashboard.slackMessages.map((msg, i) => (
                                    <Spotlight key={msg.ts} className="list-item-spotlight">
                                        <div
                                            className="list-item slack-item"
                                            style={{
                                                display: 'flex',
                                                gap: '1rem',
                                                width: '100%',
                                                padding: '0.5rem'
                                            }}
                                        >
                                            <div className="slack-avatar" style={{ flexShrink: 0 }}>
                                                {msg.user.avatar ? (
                                                    <img src={msg.user.avatar} alt={msg.user.name} style={{ width: '40px', height: '40px', borderRadius: '10px' }} />
                                                ) : (
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                        {msg.user.name?.[0] || '?'}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="slack-content" style={{ flex: 1 }}>
                                                <div className="slack-header" style={{ marginBottom: '0.25rem', display: 'flex', justifyContent: 'space-between' }}>
                                                    <span className="slack-user" style={{ color: '#fff', fontWeight: 500 }}>{msg.user.name}</span>
                                                    <span className="slack-time" style={{ fontSize: '0.8rem', color: '#6b6b7b' }}>{formatDate(msg.date)}</span>
                                                </div>
                                                <div className="slack-text" style={{ color: '#a0a0b0', lineHeight: '1.4' }}>{msg.text}</div>
                                            </div>
                                        </div>
                                    </Spotlight>
                                ))
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {dashboard.lastUpdated && (
                <div className="last-updated" style={{ marginTop: '2rem', textAlign: 'center', color: '#6b6b7b', fontSize: '0.85rem' }}>
                    Last refreshed: {dashboard.lastUpdated.prs && formatDate(dashboard.lastUpdated.prs)}
                </div>
            )}
        </motion.div>
    );
}
