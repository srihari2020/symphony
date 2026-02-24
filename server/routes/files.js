import express from 'express';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import User from '../models/User.js';
import FileModel from '../models/File.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB max

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

// POST /api/files/upload — Upload a file
router.post('/upload', auth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file provided' });
        const { projectId } = req.body;
        if (!projectId) return res.status(400).json({ error: 'Project ID required' });

        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: `symphony/${projectId}`, resource_type: 'auto' },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            stream.end(req.file.buffer);
        });

        const file = new FileModel({
            name: req.file.originalname,
            url: result.secure_url,
            cloudinaryId: result.public_id,
            size: result.bytes,
            type: req.file.mimetype,
            project: projectId,
            uploadedBy: req.user._id,
        });
        await file.save();

        const populated = await FileModel.findById(file._id).populate('uploadedBy', 'name').lean();
        res.status(201).json({ file: populated });
    } catch (err) {
        console.error('File upload error:', err);
        res.status(500).json({ error: 'File upload failed' });
    }
});

// GET /api/files/:projectId — List project files
router.get('/:projectId', auth, async (req, res) => {
    try {
        const files = await FileModel.find({ project: req.params.projectId })
            .sort({ createdAt: -1 })
            .populate('uploadedBy', 'name')
            .lean();
        res.json({ files });
    } catch (err) {
        console.error('File list error:', err);
        res.status(500).json({ error: 'Failed to fetch files' });
    }
});

// DELETE /api/files/:id — Delete a file
router.delete('/:id', auth, async (req, res) => {
    try {
        const file = await FileModel.findById(req.params.id);
        if (!file) return res.status(404).json({ error: 'File not found' });

        // Delete from Cloudinary
        await cloudinary.uploader.destroy(file.cloudinaryId);
        await FileModel.findByIdAndDelete(req.params.id);

        res.json({ message: 'File deleted' });
    } catch (err) {
        console.error('File delete error:', err);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

export default router;
