import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Task from '../models/Task.js';

const router = express.Router();

const auth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.userId);
        next();
    } catch (err) {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// GET /api/analytics/:projectId — Project analytics
router.get('/:projectId', auth, async (req, res) => {
    try {
        const { projectId } = req.params;
        const tasks = await Task.find({ project: projectId }).populate('assignee', 'name').lean();

        // Status distribution
        const statusCounts = { todo: 0, 'in-progress': 0, done: 0 };
        tasks.forEach(t => { statusCounts[t.status] = (statusCounts[t.status] || 0) + 1; });

        // Priority distribution
        const priorityCounts = { low: 0, medium: 0, high: 0 };
        tasks.forEach(t => { priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1; });

        // Tasks per team member
        const memberMap = {};
        tasks.forEach(t => {
            const name = t.assignee?.name || 'Unassigned';
            memberMap[name] = (memberMap[name] || 0) + 1;
        });
        const memberStats = Object.entries(memberMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

        // Tasks created over last 30 days
        const now = new Date();
        const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
        const timeline = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date(now - i * 24 * 60 * 60 * 1000);
            const dayStr = date.toISOString().split('T')[0];
            const created = tasks.filter(t => t.createdAt && new Date(t.createdAt).toISOString().split('T')[0] === dayStr).length;
            timeline.push({ date: dayStr, created });
        }

        // Completion rate
        const total = tasks.length;
        const completed = statusCounts.done;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        res.json({
            total,
            completionRate,
            statusCounts,
            priorityCounts,
            memberStats,
            timeline,
        });
    } catch (err) {
        console.error('Analytics error:', err);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

export default router;
