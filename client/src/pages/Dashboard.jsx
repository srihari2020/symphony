import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getProjects, createProject, deleteProject, getIntegrations, getGitHubRepos, getSlackChannels } from '../api';
import { GridSkeleton } from '../components/LoadingSkeleton';
import AnimatedButton from '../components/AnimatedButton';
import Spotlight from '../components/Spotlight';
import Logo from '../components/Logo';

export default function Dashboard() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', githubRepo: '', slackChannel: '' });
    const [repos, setRepos] = useState([]);
    const [channels, setChannels] = useState([]);
    const [integrations, setIntegrations] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [projectsRes, integrationsRes] = await Promise.all([
                getProjects(),
                getIntegrations()
            ]);
            setProjects(projectsRes.data);
            setIntegrations(integrationsRes.data);

            // Load repos/channels if integrations exist
            const hasGithub = integrationsRes.data.some(i => i.type === 'github');
            const hasSlack = integrationsRes.data.some(i => i.type === 'slack');

            if (hasGithub) {
                const reposRes = await getGitHubRepos();
                setRepos(reposRes.data);
            }
            if (hasSlack) {
                const channelsRes = await getSlackChannels();
                setChannels(channelsRes.data);
            }
        } catch (err) {
            console.error('Error loading data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            await createProject(newProject);
            setShowModal(false);
            setNewProject({ name: '', githubRepo: '', slackChannel: '' });
            loadData();
        } catch (err) {
            console.error('Error creating project:', err);
        }
    };

    const handleDeleteProject = async (id) => {
        if (!confirm('Are you sure you want to delete this project?')) return;
        try {
            await deleteProject(id);
            loadData();
        } catch (err) {
            console.error('Error deleting project:', err);
        }
    };

    const hasGithub = integrations.some(i => i.type === 'github');
    const hasSlack = integrations.some(i => i.type === 'slack');

    if (loading) {
        return <GridSkeleton count={6} />;
    }

    return (
        <motion.div
            className="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <header className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Logo size="small" variant="primary" showText={false} />
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        Projects
                    </motion.h1>
                </div>
                <AnimatedButton variant="primary" onClick={() => setShowModal(true)}>
                    + New Project
                </AnimatedButton>
            </header>

            {(!hasGithub || !hasSlack) && (
                <motion.div
                    className="alert alert-warning"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <span>⚠️</span>
                    <div>
                        Connect your integrations to get started.
                        {!hasGithub && <span> GitHub not connected.</span>}
                        {!hasSlack && <span> Slack not connected.</span>}
                        <Link to="/settings"> Go to Settings →</Link>
                    </div>
                </motion.div>
            )}

            {projects.length === 0 ? (
                <motion.div
                    className="empty-state"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <Logo size="large" variant="teal" />
                    </div>
                    <h2>No projects yet</h2>
                    <p>Create your first project to start tracking GitHub and Slack activity.</p>
                    <AnimatedButton variant="primary" onClick={() => setShowModal(true)}>
                        Create Project
                    </AnimatedButton>
                </motion.div>
            ) : (
                <motion.div
                    className="project-grid"
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: { opacity: 0 },
                        visible: {
                            opacity: 1,
                            transition: {
                                staggerChildren: 0.1
                            }
                        }
                    }}
                >
                    {projects.map((project, index) => (
                        <Spotlight
                            key={project._id}
                            className="project-card"
                            variants={{
                                hidden: { opacity: 0, y: 20 },
                                visible: { opacity: 1, y: 0 }
                            }}
                            whileHover={{
                                y: -5,
                                transition: { duration: 0.2 }
                            }}
                        >
                            <div className="project-card-header">
                                <h3>{project.name}</h3>
                                <motion.button
                                    className="btn-icon"
                                    onClick={() => handleDeleteProject(project._id)}
                                    title="Delete project"
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    🗑️
                                </motion.button>
                            </div>
                            <div className="project-card-body">
                                {project.githubRepo && (
                                    <div className="project-integration">
                                        <span className="integration-icon">📦</span>
                                        {project.githubRepo}
                                    </div>
                                )}
                                {project.slackChannel && (
                                    <div className="project-integration">
                                        <span className="integration-icon">💬</span>
                                        #{channels.find(c => c.id === project.slackChannel)?.name || project.slackChannel}
                                    </div>
                                )}
                            </div>
                            <Link to={`/project/${project._id}`} className="btn btn-secondary">
                                View Dashboard →
                            </Link>
                        </Spotlight>
                    ))}
                </motion.div>
            )}

            <AnimatePresence>
                {showModal && (
                    <motion.div
                        className="modal-overlay"
                        onClick={() => setShowModal(false)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="modal"
                            onClick={e => e.stopPropagation()}
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        >
                            <h2>Create New Project</h2>
                            <form onSubmit={handleCreateProject}>
                                <div className="form-group">
                                    <label>Project Name</label>
                                    <input
                                        type="text"
                                        value={newProject.name}
                                        onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                        placeholder="My Awesome Project"
                                        required
                                    />
                                </div>
                                {hasGithub && (
                                    <div className="form-group">
                                        <label>GitHub Repository</label>
                                        <select
                                            value={newProject.githubRepo}
                                            onChange={(e) => setNewProject({ ...newProject, githubRepo: e.target.value })}
                                        >
                                            <option value="">Select a repository</option>
                                            {repos.map(repo => (
                                                <option key={repo.fullName} value={repo.fullName}>
                                                    {repo.fullName} {repo.private && '🔒'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                {hasSlack && (
                                    <div className="form-group">
                                        <label>Slack Channel</label>
                                        <select
                                            value={newProject.slackChannel}
                                            onChange={(e) => setNewProject({ ...newProject, slackChannel: e.target.value })}
                                        >
                                            <option value="">Select a channel</option>
                                            {channels.map(channel => (
                                                <option key={channel.id} value={channel.id}>
                                                    #{channel.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div className="modal-actions">
                                    <AnimatedButton variant="secondary" type="button" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </AnimatedButton>
                                    <AnimatedButton variant="primary" type="submit">
                                        Create Project
                                    </AnimatedButton>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
