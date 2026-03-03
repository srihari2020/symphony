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

// Initialize Gemini with fallback models
const getModel = () => {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not configured');
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Try gemini-1.5-flash as it's widely available
    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    return genAI.getGenerativeModel({ model: modelName });
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

        // Use generateContent for simpler, more reliable requests
        const prompt = `${context}\n\nConversation:\n${history.map(h => `${h.role}: ${h.content}`).join('\n')}\nuser: ${message}\n\nRespond as the AI assistant:`;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        res.json({ response });
    } catch (err) {
        console.error('AI Chat error:', err.message || err);
        if (err.message === 'GEMINI_API_KEY is not configured') {
            return res.status(503).json({ error: 'AI service is not configured. Please set up the Gemini API key.' });
        }
        // Include actual error detail for debugging
        const detail = err.message || 'Unknown error';
        res.status(500).json({ error: `AI error: ${detail}` });
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
        if (err.message === 'GEMINI_API_KEY is not configured') {
            return res.status(503).json({ error: 'AI service is not configured. Please set up the Gemini API key.' });
        }
        const detail = err.message || 'Unknown error';
        res.status(500).json({ error: `AI error: ${detail}` });
    }
});

export default router;
