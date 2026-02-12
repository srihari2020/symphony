import React from 'react';
import { motion } from 'framer-motion';
import Spotlight from './Spotlight';

const KanbanCard = ({ task, index, onDragStart }) => {
    const priorityColors = {
        low: '#22c55e',
        medium: '#f59e0b',
        high: '#ef4444'
    };

    return (
        <Spotlight
            as={motion.div}
            layoutId={task._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.2}
            dragMomentum={false}
            onDragStart={() => onDragStart(task, index)}
            whileDrag={{ scale: 1.05, zIndex: 100, cursor: 'grabbing' }}
            whileHover={{ scale: 1.02, cursor: 'grab' }}
            className="kanban-card"
            style={{
                marginBottom: '0.75rem',
                borderRadius: '12px',
                position: 'relative',
                touchAction: 'none' // Prevent scrolling while dragging on touch
            }}
        >
            <div style={{ padding: '1rem' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.5rem'
                }}>
                    <span style={{
                        fontSize: '0.75rem',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        backgroundColor: `${priorityColors[task.priority]}20`,
                        color: priorityColors[task.priority],
                        fontWeight: 600,
                        textTransform: 'uppercase'
                    }}>
                        {task.priority}
                    </span>
                    {task.assignee && (
                        <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: '#3b82f6',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                        }} title={task.assignee.name}>
                            {task.assignee.name[0]}
                        </div>
                    )}
                </div>
                <h4 style={{
                    margin: '0 0 0.5rem 0',
                    fontSize: '0.95rem',
                    color: '#fff',
                    fontWeight: 500
                }}>
                    {task.title}
                </h4>
                {task.description && (
                    <p style={{
                        margin: 0,
                        fontSize: '0.8rem',
                        color: '#a0a0b0',
                        lineHeight: '1.4',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                    }}>
                        {task.description}
                    </p>
                )}
            </div>
        </Spotlight>
    );
};

export default KanbanCard;
