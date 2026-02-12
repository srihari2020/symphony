import express from 'express';
import Post from '../models/Post.js';
import { authenticate } from '../middleware/auth.js';
import { sendNotification } from '../services/socketService.js';

const router = express.Router();

import { fetchDevToPosts } from '../services/externalContent.js';

// GET /api/posts - Get all posts (Global Feed)
router.get('/', authenticate, async (req, res) => {
    try {
        // Fetch local posts
        const localPosts = await Post.find()
            .populate('author', 'name email avatar')
            .populate('organization', 'name')
            .populate('comments.author', 'name avatar')
            .sort({ createdAt: -1 })
            .limit(50);

        // Fetch external posts (real-world data)
        // We catch errors here so local posts still load if Dev.to is down
        let externalPosts = [];
        try {
            externalPosts = await fetchDevToPosts('career');
        } catch (extErr) {
            console.error('External feed failed:', extErr);
        }

        // Merge: Interleave or just append?
        // Let's sort combined list by date
        const allPosts = [...localPosts, ...externalPosts].sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        res.json(allPosts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/posts - Create a new post
router.post('/', authenticate, async (req, res) => {
    try {
        const { content, type, organizationId } = req.body;

        const post = new Post({
            author: req.user._id,
            content,
            type,
            organization: organizationId || req.user.organization?._id // Optional link to org
        });

        await post.save();
        await post.populate('author', 'name email avatar');

        res.status(201).json(post);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PUT /api/posts/:id/like - Like/Unlike a post
router.put('/:id/like', authenticate, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        const likeIndex = post.likes.indexOf(req.user._id);

        if (likeIndex === -1) {
            post.likes.push(req.user._id);
            // Notify author if not self
            if (post.author.toString() !== req.user._id.toString()) {
                await sendNotification(post.author, 'post_like', {
                    message: `${req.user.name} liked your post`,
                    link: '/community',
                    postId: post._id
                });
            }
        } else {
            post.likes.splice(likeIndex, 1);
        }

        await post.save();
        res.json(post.likes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
