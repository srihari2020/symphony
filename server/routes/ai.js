import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';

const router = express.Router();

// Auth middleware
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

// Initialize Gemini
const getModel = () => {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not configured');
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite';
    return genAI.getGenerativeModel({ model: modelName });
};

// Parse user-friendly error from Gemini API errors
const parseAIError = (err) => {
    const msg = err.message || '';
    if (msg.includes('quota') || msg.includes('429') || msg.includes('Too Many Requests')) {
        return { status: 429, error: 'AI rate limit reached. Please wait a moment and try again.' };
    }
    if (msg.includes('API_KEY_INVALID') || msg.includes('401')) {
        return { status: 503, error: 'AI API key is invalid. Please check the Gemini API key configuration.' };
    }
    if (msg.includes('not found') || msg.includes('404')) {
        return { status: 503, error: 'AI model not available. Please check the server configuration.' };
    }
    if (msg === 'GEMINI_API_KEY is not configured') {
        return { status: 503, error: 'AI service is not configured. Please set up the Gemini API key.' };
    }
    return { status: 500, error: `AI service error: ${msg.substring(0, 150)}` };
};

// POST /api/ai/chat — Chat with AI about a project
router.post('/chat', auth, async (req, res) => {
    try {
        const { message, projectId, history = [] } = req.body;
        if (!message) return res.status(400).json({ error: 'Message required' });

        let context = 'You are Symphony AI, a helpful project management assistant. Be concise and practical.';

        // Add project context if provided
        if (projectId) {
            const project = await Project.findById(projectId);
            if (project) {
                const tasks = await Task.find({ project: projectId }).populate('assignee', 'name');
                const taskSummary = tasks.map(t => `- [${t.status}] ${t.title} (${t.priority}) ${t.assignee ? '→ ' + t.assignee.name : ''}`).join('\n');
                context += `\n\nCurrent project: "${project.name}"\nTasks:\n${taskSummary || 'No tasks yet.'}`;
            }
        }

        const model = getModel();

        // Build prompt with conversation history
        const historyText = history
            .filter(h => h.role !== 'system')
            .map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`)
            .join('\n');

        const prompt = `${context}\n\n${historyText ? 'Previous conversation:\n' + historyText + '\n\n' : ''}User: ${message}\n\nAssistant:`;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        res.json({ response });
    } catch (err) {
        console.error('AI Chat error:', err.message || err);
        const { status, error } = parseAIError(err);
        res.status(status).json({ error });
    }
});

// POST /api/ai/generate-tasks — Generate task suggestions
router.post('/generate-tasks', auth, async (req, res) => {
    try {
        const { description, projectId } = req.body;
        if (!description) return res.status(400).json({ error: 'Description required' });

        const model = getModel();
        const prompt = `Given this project description, suggest 5-8 actionable tasks for a development team. Return ONLY a JSON array of objects with "title", "description", "priority" (low/medium/high), and "status" ("todo"). No markdown, no explanation, just the JSON array.\n\nProject: ${description}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Parse JSON from response
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const tasks = JSON.parse(jsonMatch[0]);
            res.json({ tasks });
        } else {
            res.status(500).json({ error: 'Could not parse AI response' });
        }
    } catch (err) {
        console.error('AI Generate Tasks error:', err.message || err);
        const { status, error } = parseAIError(err);
        res.status(status).json({ error });
    }
});

export default router;
