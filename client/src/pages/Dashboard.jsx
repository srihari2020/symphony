import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProjects, createProject, deleteProject, getIntegrations, getGitHubRepos, getSlackChannels } from '../api';

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
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="dashboard">
            <header className="page-header">
                <h1>Projects</h1>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    + New Project
                </button>
            </header>

            {(!hasGithub || !hasSlack) && (
                <div className="alert alert-warning">
                    <span>⚠️</span>
                    <div>
                        Connect your integrations to get started.
                        {!hasGithub && <span> GitHub not connected.</span>}
                        {!hasSlack && <span> Slack not connected.</span>}
                        <Link to="/settings"> Go to Settings →</Link>
                    </div>
                </div>
            )}

            {projects.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📁</div>
                    <h2>No projects yet</h2>
                    <p>Create your first project to start tracking GitHub and Slack activity.</p>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        Create Project
                    </button>
                </div>
            ) : (
                <div className="project-grid">
                    {projects.map(project => (
                        <div key={project._id} className="project-card">
                            <div className="project-card-header">
                                <h3>{project.name}</h3>
                                <button
                                    className="btn-icon"
                                    onClick={() => handleDeleteProject(project._id)}
                                    title="Delete project"
                                >
                                    🗑️
                                </button>
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
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
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
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Create Project
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
