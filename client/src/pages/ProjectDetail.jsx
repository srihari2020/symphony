import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getProject, getProjectDashboard, refreshProject } from '../api';
import { ListSkeleton } from '../components/LoadingSkeleton';

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
            hour: '2-digit',
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
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
        exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
    };

    return (
        <motion.div
            className="project-detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <header className="page-header">
                <div className="breadcrumb">
                    <Link to="/">Projects</Link>
                    <span>/</span>
                    <span>{project.name}</span>
                </div>
                <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    {project.name}
                </motion.h1>
                <motion.button
                    className="btn btn-primary"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {refreshing ? '🔄 Refreshing...' : '🔄 Refresh Data'}
                </motion.button>
            </header>

            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'prs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('prs')}
                >
                    Pull Requests ({dashboard.pullRequests.length})
                    {activeTab === 'prs' && (
                        <motion.div className="tab-indicator" layoutId="activeTab" />
                    )}
                </button>
                <button
                    className={`tab ${activeTab === 'commits' ? 'active' : ''}`}
                    onClick={() => setActiveTab('commits')}
                >
                    Commits ({dashboard.commits.length})
                    {activeTab === 'commits' && (
                        <motion.div className="tab-indicator" layoutId="activeTab" />
                    )}
                </button>
                <button
                    className={`tab ${activeTab === 'slack' ? 'active' : ''}`}
                    onClick={() => setActiveTab('slack')}
                >
                    Slack ({dashboard.slackMessages.length})
                    {activeTab === 'slack' && (
                        <motion.div className="tab-indicator" layoutId="activeTab" />
                    )}
                </button>
            </div>

            <div className="tab-content">
                <AnimatePresence mode="wait">
                    {activeTab === 'prs' && (
                        <motion.div
                            key="prs"
                            className="data-list"
                            variants={tabVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            {dashboard.pullRequests.length === 0 ? (
                                <div className="empty-list">No pull requests found</div>
                            ) : (
                                dashboard.pullRequests.map((pr, i) => (
                                    <motion.a
                                        key={pr.id}
                                        href={pr.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="list-item pr-item"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        whileHover={{ x: 5, backgroundColor: 'rgba(255,255,255,0.05)' }}
                                    >
                                        <div className="list-item-left">
                                            <span className={`pr-state ${pr.state}`}>{pr.state === 'open' ? '🟢' : '🟣'}</span>
                                            <div>
                                                <div className="list-item-title">#{pr.number} {pr.title}</div>
                                                <div className="list-item-meta">
                                                    {pr.user.login} • {formatDate(pr.createdAt)}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.a>
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
                        >
                            {dashboard.commits.length === 0 ? (
                                <div className="empty-list">No commits found</div>
                            ) : (
                                dashboard.commits.map((commit, i) => (
                                    <motion.a
                                        key={commit.sha}
                                        href={commit.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="list-item commit-item"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        whileHover={{ x: 5, backgroundColor: 'rgba(255,255,255,0.05)' }}
                                    >
                                        <div className="list-item-left">
                                            <span className="commit-icon">📝</span>
                                            <div>
                                                <div className="list-item-title">{commit.message.split('\n')[0]}</div>
                                                <div className="list-item-meta">
                                                    {commit.author.name} • {formatDate(commit.date)} • {commit.sha.substring(0, 7)}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.a>
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
                        >
                            {dashboard.slackMessages.length === 0 ? (
                                <div className="empty-list">No messages found</div>
                            ) : (
                                dashboard.slackMessages.map((msg, i) => (
                                    <motion.div
                                        key={msg.ts}
                                        className="list-item slack-item"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                    >
                                        <div className="slack-avatar">
                                            {msg.user.avatar ? (
                                                <img src={msg.user.avatar} alt={msg.user.name} />
                                            ) : (
                                                <span>{msg.user.name?.[0] || '?'}</span>
                                            )}
                                        </div>
                                        <div className="slack-content">
                                            <div className="slack-header">
                                                <span className="slack-user">{msg.user.name}</span>
                                                <span className="slack-time">{formatDate(msg.date)}</span>
                                            </div>
                                            <div className="slack-text">{msg.text}</div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {dashboard.lastUpdated && (
                <div className="last-updated">
                    Last refreshed: {dashboard.lastUpdated.prs && formatDate(dashboard.lastUpdated.prs)}
                </div>
            )}
        </motion.div>
    );
}
