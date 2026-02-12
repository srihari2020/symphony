import express from 'express';
import OrganizationMember from '../models/OrganizationMember.js';
import Invitation from '../models/Invitation.js';
import Organization from '../models/Organization.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { sendInvitationEmail } from '../services/emailService.js';

import { fetchRandomUsers } from '../services/externalContent.js';

const router = express.Router();

// GET /api/organizations/:orgId/members/candidates - Get external candidates (Real-world API)
router.get('/:orgId/members/candidates', authenticate, async (req, res) => {
    try {
        const candidates = await fetchRandomUsers(5);
        res.json(candidates);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch external candidates' });
    }
});

// Middleware to check if user is member of organization
async function checkOrgMembership(req, res, next) {
    try {
        const member = await OrganizationMember.findOne({
            organization: req.params.orgId,
            user: req.user.id
        });

        if (!member) {
            return res.status(403).json({ error: 'Not a member of this organization' });
        }

        req.orgMember = member;
        next();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Middleware to check if user has admin/owner role
function requireAdmin(req, res, next) {
    if (!['admin', 'owner'].includes(req.orgMember.role)) {
        return res.status(403).json({ error: 'Requires admin or owner role' });
    }
    next();
}

// GET /api/organizations/:orgId/members - List all members
router.get('/:orgId/members', authenticate, checkOrgMembership, async (req, res) => {
    try {
        const members = await OrganizationMember.find({
            organization: req.params.orgId
        })
            .populate('user', 'name email')
            .populate('invitedBy', 'name')
            .sort({ joinedAt: -1 });

        res.json(members);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/organizations/:orgId/members/invite - Invite new member
router.post('/:orgId/members/invite', authenticate, checkOrgMembership, requireAdmin, async (req, res) => {
    try {
        const { email, role = 'member' } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            // Check if already a member
            const existingMember = await OrganizationMember.findOne({
                organization: req.params.orgId,
                user: existingUser._id
            });

            if (existingMember) {
                return res.status(400).json({ error: 'User is already a member' });
            }
        }

        // Check for existing pending invitation
        const existingInvitation = await Invitation.findOne({
            organization: req.params.orgId,
            email: email.toLowerCase(),
            status: 'pending'
        });

        if (existingInvitation) {
            return res.status(400).json({ error: 'Invitation already sent to this email' });
        }

        // Create invitation
        const invitation = new Invitation({
            organization: req.params.orgId,
            email: email.toLowerCase(),
            role: role === 'owner' ? 'admin' : role, // Don't allow owner role via invitation
            invitedBy: req.user.id
        });

        await invitation.save();

        // Populate organization for response
        await invitation.populate('organization', 'name');
        await invitation.populate('invitedBy', 'name email');

        // Send Email Notification
        try {
            await sendInvitationEmail({
                email: invitation.email,
                organizationName: invitation.organization.name,
                invitedBy: req.user.name,
                token: invitation.token,
                role: invitation.role
            });

            // Send Real-time Notification if user exists
            const invitedUser = await User.findOne({ email: invitation.email });
            if (invitedUser) {
                await sendNotification(invitedUser._id, 'invite', {
                    message: `${req.user.name} invited you to join ${invitation.organization.name}`,
                    link: `/accept-invite/${invitation.token}`,
                    organizationId: invitation.organization._id
                });
            }
        } catch (emailErr) {
            console.error('Failed to send invitation email:', emailErr);
            // Don't fail the request if email fails, but log it
        }

        res.status(201).json(invitation);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/organizations/:orgId/members/:memberId - Remove member
router.delete('/:orgId/members/:memberId', authenticate, checkOrgMembership, requireAdmin, async (req, res) => {
    try {
        const memberToRemove = await OrganizationMember.findOne({
            organization: req.params.orgId,
            user: req.params.memberId
        });

        if (!memberToRemove) {
            return res.status(404).json({ error: 'Member not found' });
        }

        // Cannot remove organization owner
        if (memberToRemove.role === 'owner') {
            return res.status(403).json({ error: 'Cannot remove organization owner' });
        }

        // Admins cannot remove other admins (only owner can)
        if (memberToRemove.role === 'admin' && req.orgMember.role !== 'owner') {
            return res.status(403).json({ error: 'Only owner can remove admins' });
        }

        await OrganizationMember.deleteOne({ _id: memberToRemove._id });

        res.json({ message: 'Member removed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/organizations/:orgId/members/:memberId/role - Update member role
router.put('/:orgId/members/:memberId/role', authenticate, checkOrgMembership, async (req, res) => {
    try {
        // Only owner can change roles
        if (req.orgMember.role !== 'owner') {
            return res.status(403).json({ error: 'Only owner can change member roles' });
        }

        const { role } = req.body;

        if (!['admin', 'member'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const memberToUpdate = await OrganizationMember.findOne({
            organization: req.params.orgId,
            user: req.params.memberId
        });

        if (!memberToUpdate) {
            return res.status(404).json({ error: 'Member not found' });
        }

        // Cannot change owner role
        if (memberToUpdate.role === 'owner') {
            return res.status(403).json({ error: 'Cannot change owner role' });
        }

        memberToUpdate.role = role;
        await memberToUpdate.save();

        await memberToUpdate.populate('user', 'name email');

        res.json(memberToUpdate);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
