import express from 'express';
import Organization from '../models/Organization.js';
import OrganizationMember from '../models/OrganizationMember.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get user's organization
router.get('/current', authenticate, async (req, res) => {
    try {
        if (!req.user.organization) {
            return res.status(404).json({ error: 'No organization found' });
        }

        const org = await Organization.findById(req.user.organization)
            .populate('owner', 'name email')
            .populate('members', 'name email');

        res.json(org);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create organization
router.post('/', authenticate, async (req, res) => {
    try {
        const { name } = req.body;

        const org = new Organization({
            name,
            owner: req.user._id,
            members: [req.user._id]
        });
        await org.save();

        // Create organization member record with owner role
        const member = new OrganizationMember({
            organization: org._id,
            user: req.user._id,
            role: 'owner'
        });
        await member.save();

        // Update user's organization
        await User.findByIdAndUpdate(req.user._id, { organization: org._id });

        res.status(201).json(org);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update organization
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { name } = req.body;
        const org = await Organization.findByIdAndUpdate(
            req.params.id,
            { name },
            { new: true }
        );
        res.json(org);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
