import express from 'express';
import Task from '../models/Task.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all tasks for a project
router.get('/:projectId', authenticate, async (req, res) => {
    try {
        const tasks = await Task.find({ project: req.params.projectId })
            .populate('assignee', 'name email avatar')
            .sort({ order: 1 });
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new task
router.post('/', authenticate, async (req, res) => {
    try {
        const { title, description, status, priority, projectId, assigneeId } = req.body;

        // Get highest order to append to end
        const lastTask = await Task.findOne({ project: projectId }).sort({ order: -1 });
        const order = lastTask ? lastTask.order + 1 : 0;

        const newTask = new Task({
            title,
            description,
            status,
            priority,
            project: projectId,
            assignee: assigneeId,
            order
        });

        const savedTask = await newTask.save();
        const populatedTask = await savedTask.populate('assignee', 'name email avatar');

        res.status(201).json(populatedTask);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update a task (status, order, details)
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { title, description, status, priority, assigneeId, order } = req.body;

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (status !== undefined) updateData.status = status;
        if (priority !== undefined) updateData.priority = priority;
        if (assigneeId !== undefined) updateData.assignee = assigneeId;
        if (order !== undefined) updateData.order = order;

        const updatedTask = await Task.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate('assignee', 'name email avatar');

        if (!updatedTask) return res.status(404).json({ error: 'Task not found' });

        res.json(updatedTask);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete a task
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const deletedTask = await Task.findByIdAndDelete(req.params.id);
        if (!deletedTask) return res.status(404).json({ error: 'Task not found' });
        res.json({ message: 'Task deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
