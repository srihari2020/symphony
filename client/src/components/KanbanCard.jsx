import React from 'react';
import { motion } from 'framer-motion';

const KanbanCard = ({ task, index, onDragStart, onEdit, onDelete, onMove }) => {
    const priorityColors = {
        low: '#22c55e',
        medium: '#f59e0b',
        high: '#ef4444'
    };

    return (
        <motion.div
            layoutId={task._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            drag
            dragSnapToOrigin={true}
            dragElastic={0.1}
            dragMomentum={false}
            onDragStart={() => onDragStart(task, index)}
            whileDrag={{ scale: 1.05, zIndex: 100, cursor: 'grabbing', boxShadow: '0 8px 20px rgba(0,0,0,0.5)', pointerEvents: 'none' }}
            whileHover={{ scale: 1.02, cursor: 'grab', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
            className="kanban-card group"
            style={{
                marginBottom: '0.75rem',
                borderRadius: '12px',
                position: 'relative',
                touchAction: 'none',
                background: '#1a1a20',
                border: '1px solid rgba(255,255,255,0.05)'
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
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {/* Mobile/Quick Move Actions */}
                        {task.status !== 'todo' && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onMove(task, 'prev'); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0a0b0', padding: 0 }}
                                title="Move Previous"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                            </button>
                        )}
                        {task.status !== 'done' && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onMove(task, 'next'); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0a0b0', padding: 0 }}
                                title="Move Next"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </button>
                        )}
                        <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.1)', margin: '0 2px' }}></div>

                        {/* Edit/Delete Actions */}
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0a0b0', padding: 0 }}
                            title="Edit Task"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(task._id); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 0 }}
                            title="Delete Task"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
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
                {task.assignee && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
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
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default KanbanCard;
