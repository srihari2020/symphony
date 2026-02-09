import express from 'express';
import Integration from '../models/Integration.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const SLACK_AUTH_URL = 'https://slack.com/oauth/v2/authorize';
const SLACK_TOKEN_URL = 'https://slack.com/api/oauth.v2.access';

// Get integrations for org
router.get('/', authenticate, async (req, res) => {
    try {
        if (!req.user.organization) {
            return res.json([]);
        }
        const integrations = await Integration.find({ organization: req.user.organization });
        // Don't expose tokens
        const safe = integrations.map(i => ({
            id: i._id,
            type: i.type,
            connected: true,
            metadata: i.metadata,
            updatedAt: i.updatedAt
        }));
        res.json(safe);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GitHub OAuth - Get auth URL
router.get('/github/auth-url', authenticate, (req, res) => {
    const params = new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID,
        redirect_uri: `${process.env.FRONTEND_URL}/integrations/github/callback`,
        scope: 'repo read:org',
        state: req.user.organization?.toString() || ''
    });
    res.json({ url: `${GITHUB_AUTH_URL}?${params}` });
});

// GitHub OAuth - Exchange code for token
router.post('/github/callback', authenticate, async (req, res) => {
    try {
        const { code } = req.body;

        const response = await fetch(GITHUB_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(400).json({ error: data.error_description });
        }

        // Store/update integration
        await Integration.findOneAndUpdate(
            { organization: req.user.organization, type: 'github' },
            {
                accessToken: data.access_token,
                updatedAt: new Date()
            },
            { upsert: true }
        );

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Slack OAuth - Get auth URL
router.get('/slack/auth-url', authenticate, (req, res) => {
    const params = new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID,
        redirect_uri: `${process.env.FRONTEND_URL}/integrations/slack/callback`,
        scope: 'channels:history,channels:read,users:read',
        state: req.user.organization?.toString() || ''
    });
    res.json({ url: `${SLACK_AUTH_URL}?${params}` });
});

// Slack OAuth - Exchange code for token
router.post('/slack/callback', authenticate, async (req, res) => {
    try {
        const { code } = req.body;

        const params = new URLSearchParams({
            client_id: process.env.SLACK_CLIENT_ID,
            client_secret: process.env.SLACK_CLIENT_SECRET,
            code,
            redirect_uri: `${process.env.FRONTEND_URL}/integrations/slack/callback`
        });

        const response = await fetch(`${SLACK_TOKEN_URL}?${params}`, {
            method: 'POST'
        });

        const data = await response.json();

        if (!data.ok) {
            return res.status(400).json({ error: data.error });
        }

        // Store/update integration
        await Integration.findOneAndUpdate(
            { organization: req.user.organization, type: 'slack' },
            {
                accessToken: data.access_token,
                metadata: { team: data.team },
                updatedAt: new Date()
            },
            { upsert: true }
        );

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Disconnect integration
router.delete('/:type', authenticate, async (req, res) => {
    try {
        await Integration.findOneAndDelete({
            organization: req.user.organization,
            type: req.params.type
        });
        res.json({ message: 'Integration disconnected' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get available GitHub repos
router.get('/github/repos', authenticate, async (req, res) => {
    try {
        console.log('Fetching repos for org:', req.user.organization);

        const integration = await Integration.findOne({
            organization: req.user.organization,
            type: 'github'
        });

        if (!integration) {
            console.log('No GitHub integration found');
            return res.json([]);
        }

        console.log('Found integration, fetching from GitHub API...');

        const response = await fetch('https://api.github.com/user/repos?per_page=100', {
            headers: {
                Authorization: `Bearer ${integration.accessToken}`,
                Accept: 'application/vnd.github.v3+json'
            }
        });

        const repos = await response.json();

        // Check if there's an error from GitHub
        if (repos.message) {
            console.log('GitHub API error:', repos.message);
            return res.json([]);
        }

        console.log('Found', repos.length, 'repos');
        res.json(repos.map(r => ({ fullName: r.full_name, name: r.name, private: r.private })));
    } catch (error) {
        console.error('Error fetching repos:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get available Slack channels
router.get('/slack/channels', authenticate, async (req, res) => {
    try {
        const integration = await Integration.findOne({
            organization: req.user.organization,
            type: 'slack'
        });

        if (!integration) {
            return res.json([]);
        }

        const response = await fetch('https://slack.com/api/conversations.list?types=public_channel', {
            headers: {
                Authorization: `Bearer ${integration.accessToken}`
            }
        });

        const data = await response.json();
        if (!data.ok) {
            return res.json([]);
        }

        res.json(data.channels.map(c => ({ id: c.id, name: c.name })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
