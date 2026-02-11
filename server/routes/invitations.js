import express from 'express';
import Invitation from '../models/Invitation.js';
import OrganizationMember from '../models/OrganizationMember.js';
import Organization from '../models/Organization.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET /api/invitations/pending - Get user's pending invitations
router.get('/pending', authenticate, async (req, res) => {
    try {
        const user = req.user;

        const invitations = await Invitation.find({
            email: user.email.toLowerCase(),
            status: 'pending',
            expiresAt: { $gt: new Date() }
        })
            .populate('organization', 'name')
            .populate('invitedBy', 'name email')
            .sort({ createdAt: -1 });

        res.json(invitations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/invitations/:token/accept - Accept invitation
router.post('/:token/accept', authenticate, async (req, res) => {
    try {
        const invitation = await Invitation.findOne({
            token: req.params.token,
            status: 'pending'
        }).populate('organization', 'name');

        if (!invitation) {
            return res.status(404).json({ error: 'Invitation not found or already processed' });
        }

        // Check if invitation expired
        if (new Date() > invitation.expiresAt) {
            invitation.status = 'expired';
            await invitation.save();
            return res.status(400).json({ error: 'Invitation has expired' });
        }

        // Check if user email matches
        if (invitation.email.toLowerCase() !== req.user.email.toLowerCase()) {
            return res.status(403).json({ error: 'This invitation is for a different email address' });
        }

        // Check if user is already a member
        const existingMember = await OrganizationMember.findOne({
            organization: invitation.organization._id,
            user: req.user.id
        });

        if (existingMember) {
            invitation.status = 'accepted';
            await invitation.save();
            return res.status(400).json({ error: 'You are already a member of this organization' });
        }

        // Create organization member
        const member = new OrganizationMember({
            organization: invitation.organization._id,
            user: req.user.id,
            role: invitation.role,
            invitedBy: invitation.invitedBy
        });

        await member.save();

        // Update invitation status
        invitation.status = 'accepted';
        await invitation.save();

        // Populate member for response
        await member.populate('organization', 'name');
        await member.populate('user', 'name email');

        res.json({
            message: 'Invitation accepted successfully',
            member,
            organization: invitation.organization
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/invitations/:invitationId/decline - Decline invitation
router.post('/:invitationId/decline', authenticate, async (req, res) => {
    try {
        const invitation = await Invitation.findById(req.params.invitationId);

        if (!invitation) {
            return res.status(404).json({ error: 'Invitation not found' });
        }

        // Check if user email matches
        if (invitation.email.toLowerCase() !== req.user.email.toLowerCase()) {
            return res.status(403).json({ error: 'This invitation is for a different email address' });
        }

        if (invitation.status !== 'pending') {
            return res.status(400).json({ error: 'Invitation already processed' });
        }

        invitation.status = 'declined';
        await invitation.save();

        res.json({ message: 'Invitation declined' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
