import React from 'react';
import { motion } from 'framer-motion';
import KanbanCard from './KanbanCard';

const KanbanColumn = ({ title, status, tasks, onDragStart, onDrop, onEdit, onDelete }) => {
    const columnColors = {
        'todo': '#6366f1',
        'in-progress': '#f59e0b',
        'done': '#22c55e'
    };

    return (
        <div
            className="kanban-column"
            onMouseEnter={() => onDrop(status)} // Simple drop detection via hover
            style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '16px',
                padding: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                minHeight: '500px'
            }}
        >
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem',
                padding: '0 0.5rem'
            }}>
                <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: columnColors[status]
                }} />
                <h3 style={{
                    margin: 0,
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#fff'
                }}>
                    {title}
                </h3>
                <span style={{
                    marginLeft: 'auto',
                    fontSize: '0.8rem',
                    color: '#6b6b7b',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    padding: '2px 8px',
                    borderRadius: '10px'
                }}>
                    {tasks.length}
                </span>
            </div>

            <motion.div
                layout
                style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
                {tasks.map((task, index) => (
                    <KanbanCard
                        key={task._id}
                        task={task}
                        index={index}
                        onDragStart={onDragStart}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                ))}
            </motion.div>
        </div>
    );
};

export default KanbanColumn;
