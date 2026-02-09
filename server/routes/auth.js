import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Sign up
router.post('/signup', async (req, res) => {
    try {
        const { email, password, name, organizationName } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Create user
        const user = new User({ email, password, name });
        await user.save();

        // Create organization if provided
        if (organizationName) {
            const org = new Organization({
                name: organizationName,
                owner: user._id,
                members: [user._id]
            });
            await org.save();
            user.organization = org._id;
            await user.save();
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                organization: user.organization
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).populate('organization');
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                organization: user.organization
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
    res.json({
        user: {
            id: req.user._id,
            email: req.user.email,
            name: req.user.name,
            avatar: req.user.avatar,
            organization: req.user.organization
        }
    });
});

// Google OAuth login
router.post('/google', async (req, res) => {
    try {
        const { credential } = req.body;

        // Decode Google JWT token (simple decode, in production verify with Google)
        const decoded = JSON.parse(Buffer.from(credential.split('.')[1], 'base64').toString());
        const { email, name, picture, sub: googleId } = decoded;

        // Find or create user
        let user = await User.findOne({ email });

        if (!user) {
            // Create new user
            user = new User({
                email,
                name,
                avatar: picture,
                provider: 'google',
                providerId: googleId
            });
            await user.save();

            // Create default organization
            const org = new Organization({
                name: `${name}'s Org`,
                owner: user._id,
                members: [user._id]
            });
            await org.save();
            user.organization = org._id;
            await user.save();
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                avatar: user.avatar,
                organization: user.organization
            }
        });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GitHub OAuth login
router.post('/github', async (req, res) => {
    try {
        const { code } = req.body;

        // Exchange code for access token
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                client_id: process.env.GITHUB_LOGIN_CLIENT_ID || process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_LOGIN_CLIENT_SECRET || process.env.GITHUB_CLIENT_SECRET,
                code
            })
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            return res.status(400).json({ error: tokenData.error_description });
        }

        // Get user info from GitHub
        const userResponse = await fetch('https://api.github.com/user', {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
                Accept: 'application/vnd.github.v3+json'
            }
        });

        const githubUser = await userResponse.json();

        // Get user email (might be private)
        let email = githubUser.email;
        if (!email) {
            const emailResponse = await fetch('https://api.github.com/user/emails', {
                headers: {
                    Authorization: `Bearer ${tokenData.access_token}`,
                    Accept: 'application/vnd.github.v3+json'
                }
            });
            const emails = await emailResponse.json();
            const primary = emails.find(e => e.primary) || emails[0];
            email = primary?.email || `${githubUser.login}@github.local`;
        }

        // Find or create user
        let user = await User.findOne({ $or: [{ email }, { providerId: String(githubUser.id), provider: 'github' }] });

        if (!user) {
            user = new User({
                email,
                name: githubUser.name || githubUser.login,
                avatar: githubUser.avatar_url,
                provider: 'github',
                providerId: String(githubUser.id)
            });
            await user.save();

            // Create default organization
            const org = new Organization({
                name: `${user.name}'s Org`,
                owner: user._id,
                members: [user._id]
            });
            await org.save();
            user.organization = org._id;
            await user.save();
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                avatar: user.avatar,
                organization: user.organization
            }
        });
    } catch (error) {
        console.error('GitHub auth error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get GitHub OAuth URL for login
router.get('/github/url', (req, res) => {
    const params = new URLSearchParams({
        client_id: process.env.GITHUB_LOGIN_CLIENT_ID || process.env.GITHUB_CLIENT_ID,
        redirect_uri: `${process.env.FRONTEND_URL}/auth/github/callback`,
        scope: 'user:email'
    });
    res.json({ url: `https://github.com/login/oauth/authorize?${params}` });
});

export default router;
