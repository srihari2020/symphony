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
        // Redundant with new logic, but kept for fallback
        setDraggedOverColumn(targetStatus);
    };

    const handleDragEnd = async (event) => {
        if (!draggedTask) return;

        // Calculate drop target based on pointer coordinates
        let clientX, clientY;

        if (event.type === 'touchend') {
            const touch = event.changedTouches[0];
            clientX = touch.clientX;
            clientY = touch.clientY;
        } else {
            clientX = event.clientX;
            clientY = event.clientY;
        }

        const elementsUnderCursor = document.elementsFromPoint(clientX, clientY);

        // Find the column element in the stack
        // Look for the attribute we added
        const columnElement = elementsUnderCursor.find(el => el.getAttribute && el.getAttribute('data-status'));
        const targetStatus = columnElement ? columnElement.getAttribute('data-status') : null;

        if (!targetStatus || draggedTask.status === targetStatus) {
            setDraggedTask(null);
            setDraggedOverColumn(null);
            return;
        }

        // Optimistic Update
        const updatedTasks = tasks.map(t =>
            t._id === draggedTask._id ? { ...t, status: targetStatus } : t
        );
        setTasks(updatedTasks);

        setDraggedTask(null);
        setDraggedOverColumn(null);

        // API Update
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/tasks/${draggedTask._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: targetStatus })
            });
        } catch (err) {
            console.error('Error updating task status:', err);
            fetchTasks(); // Revert on error
        }
    };

    // State for editing
    const [editingTask, setEditingTask] = useState(null);

    // ... (existing code) ...

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;

        // Optimistic update
        const previousTasks = [...tasks];
        setTasks(tasks.filter(t => t._id !== taskId));

        try {
            await fetch(`${import.meta.env.VITE_API_URL}/tasks/${taskId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (err) {
            console.error('Error deleting task:', err);
            setTasks(previousTasks); // Revert
        }
    };

    const handleMoveTask = async (task, direction) => {
        const statusOrder = ['todo', 'in-progress', 'done'];
        const currentIndex = statusOrder.indexOf(task.status);
        let newStatus;

        if (direction === 'next' && currentIndex < statusOrder.length - 1) {
            newStatus = statusOrder[currentIndex + 1];
        } else if (direction === 'prev' && currentIndex > 0) {
            newStatus = statusOrder[currentIndex - 1];
        } else {
            return;
        }

        // Optimistic Update
        const updatedTasks = tasks.map(t =>
            t._id === task._id ? { ...t, status: newStatus } : t
        );
        setTasks(updatedTasks);

        try {
            await fetch(`${import.meta.env.VITE_API_URL}/tasks/${task._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
        } catch (err) {
            console.error('Error moving task:', err);
            fetchTasks(); // Revert
        }
    };

    const handleEditTask = (task) => {
        setEditingTask(task);
        setNewTaskTitle(task.title);
        setNewTaskDesc(task.description || '');
        setNewTaskPriority(task.priority);
        setShowTaskModal(true);
    };

    const handleSaveTask = async (e) => {
        e.preventDefault();

        if (editingTask) {
            // Update existing task
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/tasks/${editingTask._id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        title: newTaskTitle,
                        description: newTaskDesc,
                        priority: newTaskPriority
                    })
                });
                const updatedTask = await res.json();
                if (res.ok) {
                    setTasks(tasks.map(t => t._id === editingTask._id ? updatedTask : t));
                    closeModal();
                }
            } catch (err) {
                console.error('Error updating task:', err);
            }
        } else {
            // Create new task (existing logic)
            handleCreateTask(e);
        }
    };

    const closeModal = () => {
        setShowTaskModal(false);
        setEditingTask(null);
        setNewTaskTitle('');
        setNewTaskDesc('');
        setNewTaskPriority('medium');
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
                <AnimatedButton variant="primary" onClick={() => { setEditingTask(null); setShowTaskModal(true); }}>
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
                onMouseUp={handleDragEnd}
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
                        onEdit={handleEditTask}
                        onDelete={handleDeleteTask}
                        onMove={handleMoveTask}
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
                }} onClick={closeModal}>
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
                        <h2 style={{ color: '#fff', margin: '0 0 1.5rem 0' }}>
                            {editingTask ? 'Edit Task' : 'Create New Task'}
                        </h2>
                        <form onSubmit={handleSaveTask}>
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
                                <AnimatedButton variant="secondary" type="button" onClick={closeModal}>
                                    Cancel
                                </AnimatedButton>
                                <AnimatedButton variant="primary" type="submit">
                                    {editingTask ? 'Save Changes' : 'Create Task'}
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
