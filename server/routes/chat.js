import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Message from '../models/Message.js';

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

// GET /api/chat/:projectId/messages — Get chat history (paginated)
router.get('/:projectId/messages', auth, async (req, res) => {
    try {
        const { projectId } = req.params;
        const { before, limit = 50 } = req.query;

        const query = { project: projectId };
        if (before) query.createdAt = { $lt: new Date(before) };

        const messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate('sender', 'name email')
            .lean();

        res.json({ messages: messages.reverse() });
    } catch (err) {
        console.error('Chat fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// POST /api/chat/:projectId/messages — Send a message
router.post('/:projectId/messages', auth, async (req, res) => {
    try {
        const { projectId } = req.params;
        const { content, type = 'text' } = req.body;
        if (!content?.trim()) return res.status(400).json({ error: 'Message content required' });

        const message = new Message({
            content: content.trim(),
            sender: req.user._id,
            project: projectId,
            type,
        });
        await message.save();

        const populated = await Message.findById(message._id)
            .populate('sender', 'name email')
            .lean();

        res.status(201).json({ message: populated });
    } catch (err) {
        console.error('Chat send error:', err);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

export default router;
