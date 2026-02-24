import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

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

// GET /api/unsplash/search?q=...
router.get('/search', auth, async (req, res) => {
    try {
        const { q = 'technology', page = 1, per_page = 12 } = req.query;
        const response = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&page=${page}&per_page=${per_page}&orientation=landscape`,
            { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } }
        );
        const data = await response.json();
        const photos = (data.results || []).map(p => ({
            id: p.id,
            url: p.urls.regular,
            thumb: p.urls.thumb,
            small: p.urls.small,
            author: p.user?.name,
            authorUrl: p.user?.links?.html,
        }));
        res.json({ photos, total: data.total });
    } catch (err) {
        console.error('Unsplash search error:', err);
        res.status(500).json({ error: 'Unsplash service unavailable' });
    }
});

// GET /api/unsplash/random
router.get('/random', auth, async (req, res) => {
    try {
        const response = await fetch(
            'https://api.unsplash.com/photos/random?query=technology&orientation=landscape&count=6',
            { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } }
        );
        const data = await response.json();
        const photos = (Array.isArray(data) ? data : []).map(p => ({
            id: p.id,
            url: p.urls.regular,
            thumb: p.urls.thumb,
            small: p.urls.small,
            author: p.user?.name,
        }));
        res.json({ photos });
    } catch (err) {
        console.error('Unsplash random error:', err);
        res.status(500).json({ error: 'Unsplash service unavailable' });
    }
});

export default router;
