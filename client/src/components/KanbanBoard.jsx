import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import KanbanColumn from './KanbanColumn';
import AnimatedButton from './AnimatedButton';
import { useAuth } from '../context/AuthContext';

const KanbanBoard = ({ projectId }) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [draggedTask, setDraggedTask] = useState(null);
    const [draggedOverColumn, setDraggedOverColumn] = useState(null);
    const [showTaskModal, setShowTaskModal] = useState(false);

    // New Task Form State
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDesc, setNewTaskDesc] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState('medium');

    const { user } = useAuth();
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchTasks();
    }, [projectId]);

    const fetchTasks = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/tasks/${projectId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setTasks(data);
            }
        } catch (err) {
            console.error('Error fetching tasks:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: newTaskTitle,
                    description: newTaskDesc,
                    priority: newTaskPriority,
                    projectId,
                    assigneeId: user._id || user.id // Auto-assign to self for now
                })
            });
            const data = await res.json();
            if (res.ok) {
                setTasks([...tasks, data]);
                setShowTaskModal(false);
                setNewTaskTitle('');
                setNewTaskDesc('');
            }
        } catch (err) {
            console.error('Error creating task:', err);
        }
    };

    const handleDragStart = (task) => {
        setDraggedTask(task);
    };

    const handleDrop = (targetStatus) => {
        setDraggedOverColumn(targetStatus);
    };

    const handleDragEnd = async () => {
        if (!draggedTask || !draggedOverColumn || draggedTask.status === draggedOverColumn) {
            setDraggedTask(null);
            setDraggedOverColumn(null);
            return;
        }

        // Optimistic Update
        const updatedTasks = tasks.map(t =>
            t._id === draggedTask._id ? { ...t, status: draggedOverColumn } : t
        );
        setTasks(updatedTasks);

        // API Update
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/tasks/${draggedTask._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: draggedOverColumn })
            });
        } catch (err) {
            console.error('Error updating task status:', err);
            fetchTasks(); // Revert on error
        }

        setDraggedTask(null);
        setDraggedOverColumn(null);
    };

    // Columns config
    const columns = [
        { id: 'todo', title: 'To Do' },
        { id: 'in-progress', title: 'In Progress' },
        { id: 'done', title: 'Done' }
    ];

    if (loading) return <div style={{ color: '#fff', padding: '2rem' }}>Loading board...</div>;

    return (
        <div className="kanban-board" style={{ marginTop: '1rem', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <AnimatedButton variant="primary" onClick={() => setShowTaskModal(true)}>
                    + New Task
                </AnimatedButton>
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '1.5rem',
                    alignItems: 'start'
                }}
                onMouseUp={handleDragEnd} // Global drop handler
                onTouchEnd={handleDragEnd}
            >
                {columns.map(col => (
                    <KanbanColumn
                        key={col.id}
                        title={col.title}
                        status={col.id}
                        tasks={tasks.filter(t => t.status === col.id)}
                        onDragStart={handleDragStart}
                        onDrop={handleDrop}
                    />
                ))}
            </div>

            {/* Task Modal */}
            {showTaskModal && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(5px)'
                }} onClick={() => setShowTaskModal(false)}>
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        style={{
                            background: '#1a1a20',
                            padding: '2rem',
                            borderRadius: '16px',
                            width: '100%',
                            maxWidth: '500px',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h2 style={{ color: '#fff', margin: '0 0 1.5rem 0' }}>Create New Task</h2>
                        <form onSubmit={handleCreateTask}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', color: '#a0a0b0', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Title</label>
                                <input
                                    type="text"
                                    value={newTaskTitle}
                                    onChange={e => setNewTaskTitle(e.target.value)}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', color: '#a0a0b0', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Description</label>
                                <textarea
                                    value={newTaskDesc}
                                    onChange={e => setNewTaskDesc(e.target.value)}
                                    rows={3}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        fontFamily: 'inherit',
                                        fontSize: '0.95rem'
                                    }}
                                />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', color: '#a0a0b0', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Priority</label>
                                <select
                                    value={newTaskPriority}
                                    onChange={e => setNewTaskPriority(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        fontSize: '1rem'
                                    }}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <AnimatedButton variant="secondary" type="button" onClick={() => setShowTaskModal(false)}>
                                    Cancel
                                </AnimatedButton>
                                <AnimatedButton variant="primary" type="submit">
                                    Create Task
                                </AnimatedButton>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default KanbanBoard;
