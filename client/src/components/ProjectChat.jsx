import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getChatMessages, sendChatMessage } from '../api';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

export default function ProjectChat({ projectId }) {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [typingUsers, setTypingUsers] = useState([]);
    const bottomRef = useRef(null);
    const socketRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Load messages on mount
    useEffect(() => {
        (async () => {
            try {
                const res = await getChatMessages(projectId);
                setMessages(res.data.messages || []);
            } catch (err) {
                console.error('Failed to load messages:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, [projectId]);

    // Setup socket connection
    useEffect(() => {
        const token = localStorage.getItem('token');
        const socket = io(API_BASE.replace('/api', ''), { auth: { token } });
        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('join_project', projectId);
        });

        socket.on('chat_message', (message) => {
            setMessages(prev => [...prev, message]);
        });

        socket.on('typing_start', ({ userName }) => {
            setTypingUsers(prev => prev.includes(userName) ? prev : [...prev, userName]);
        });

        socket.on('typing_stop', ({ userName }) => {
            setTypingUsers(prev => prev.filter(n => n !== userName));
        });

        return () => {
            socket.emit('leave_project', projectId);
            socket.disconnect();
        };
    }, [projectId]);

    // Auto-scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, typingUsers]);

    const handleTyping = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.emit('typing_start', { projectId });
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                socketRef.current?.emit('typing_stop', { projectId });
            }, 2000);
        }
    }, [projectId]);

    const send = async () => {
        if (!input.trim() || sending) return;
        setSending(true);
        const content = input.trim();
        setInput('');

        try {
            const res = await sendChatMessage(projectId, content);
            const msg = res.data.message;
            setMessages(prev => [...prev, msg]);

            // Broadcast to other users
            socketRef.current?.emit('chat_message', { projectId, message: msg });
            socketRef.current?.emit('typing_stop', { projectId });
        } catch (err) {
            console.error('Failed to send message:', err);
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const isOwnMessage = (msg) => msg.sender?._id === user?._id || msg.sender === user?._id;

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--text-tertiary)' }}>
                Loading messages...
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '60vh', minHeight: '400px', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
            {/* Messages area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {messages.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '3rem', fontSize: '0.9rem' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💬</div>
                        No messages yet. Start the conversation!
                    </div>
                )}
                {messages.map((msg, i) => {
                    const own = isOwnMessage(msg);
                    return (
                        <motion.div
                            key={msg._id || i}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ alignSelf: own ? 'flex-end' : 'flex-start', maxWidth: '75%' }}
                        >
                            {!own && (
                                <div style={{ fontSize: '0.7rem', color: '#6366f1', marginBottom: '0.2rem', fontWeight: 600 }}>
                                    {msg.sender?.name || 'Unknown'}
                                </div>
                            )}
                            <div style={{
                                padding: '0.7rem 1rem', borderRadius: own ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                background: own ? 'linear-gradient(135deg, #6366f1, #7c3aed)' : 'var(--bg-card)',
                                border: own ? 'none' : '1px solid var(--border-color)',
                                fontSize: '0.85rem', lineHeight: 1.5, wordBreak: 'break-word',
                                color: own ? 'white' : 'var(--text-primary)',
                            }}>
                                {msg.content}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: '0.2rem', textAlign: own ? 'right' : 'left' }}>
                                {formatTime(msg.createdAt)}
                            </div>
                        </motion.div>
                    );
                })}

                {/* Typing indicator */}
                <AnimatePresence>
                    {typingUsers.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            style={{ fontSize: '0.75rem', color: '#6366f1', fontStyle: 'italic' }}
                        >
                            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        value={input}
                        onChange={e => { setInput(e.target.value); handleTyping(); }}
                        onKeyDown={e => e.key === 'Enter' && send()}
                        placeholder="Type a message..."
                        style={{
                            flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                            borderRadius: '12px', padding: '0.7rem 1rem', color: 'var(--text-primary)', outline: 'none', fontSize: '0.85rem',
                        }}
                    />
                    <button
                        onClick={send}
                        disabled={sending || !input.trim()}
                        style={{
                            background: sending ? 'var(--bg-hover)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            border: 'none', borderRadius: '12px', padding: '0.7rem 1.2rem',
                            color: 'white', cursor: sending ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.9rem',
                        }}
                    >
                        ↑
                    </button>
                </div>
            </div>
        </div>
    );
}
