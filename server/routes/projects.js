import express from 'express';
import Project from '../models/Project.js';
import Cache from '../models/Cache.js';
import { authenticate } from '../middleware/auth.js';
import { refreshProjectData } from '../services/scheduler.js';

const router = express.Router();

// Get all projects for user's org
router.get('/', authenticate, async (req, res) => {
    try {
        if (!req.user.organization) {
            return res.json([]);
        }
        const projects = await Project.find({ organization: req.user.organization });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single project
router.get('/:id', authenticate, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create project
router.post('/', authenticate, async (req, res) => {
    try {
        const { name, githubRepo, slackChannel } = req.body;

        if (!req.user.organization) {
            return res.status(400).json({ error: 'User must belong to an organization' });
        }

        const project = new Project({
            name,
            organization: req.user.organization,
            githubRepo,
            slackChannel
        });
        await project.save();

        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update project
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { name, githubRepo, slackChannel } = req.body;
        const project = await Project.findByIdAndUpdate(
            req.params.id,
            { name, githubRepo, slackChannel },
            { new: true }
        );
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete project
router.delete('/:id', authenticate, async (req, res) => {
    try {
        await Project.findByIdAndDelete(req.params.id);
        await Cache.deleteMany({ project: req.params.id });
        res.json({ message: 'Project deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get project dashboard data (cached)
router.get('/:id/dashboard', authenticate, async (req, res) => {
    try {
        const projectId = req.params.id;

        const [prs, commits, messages] = await Promise.all([
            Cache.findOne({ project: projectId, type: 'github_prs' }),
            Cache.findOne({ project: projectId, type: 'github_commits' }),
            Cache.findOne({ project: projectId, type: 'slack_messages' })
        ]);

        res.json({
            pullRequests: prs?.data || [],
            commits: commits?.data || [],
            slackMessages: messages?.data || [],
            lastUpdated: {
                prs: prs?.lastUpdated,
                commits: commits?.lastUpdated,
                messages: messages?.lastUpdated
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Manual refresh - fetch latest data from GitHub/Slack
router.post('/:id/refresh', authenticate, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        await refreshProjectData(project);

        // Return fresh data
        const [prs, commits, messages] = await Promise.all([
            Cache.findOne({ project: req.params.id, type: 'github_prs' }),
            Cache.findOne({ project: req.params.id, type: 'github_commits' }),
            Cache.findOne({ project: req.params.id, type: 'slack_messages' })
        ]);

        res.json({
            pullRequests: prs?.data || [],
            commits: commits?.data || [],
            slackMessages: messages?.data || [],
            lastUpdated: {
                prs: prs?.lastUpdated,
                commits: commits?.lastUpdated,
                messages: messages?.lastUpdated
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
