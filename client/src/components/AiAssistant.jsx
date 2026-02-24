import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiChat, aiGenerateTasks } from '../api';

export default function AiAssistant({ projectId, projectName, onClose, onTasksGenerated }) {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: `Hi! I'm Symphony AI 🤖 — your project assistant for **${projectName || 'this project'}**. Ask me anything about task planning, code help, or project strategy!` }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState('chat'); // 'chat' or 'generate'
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;
        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            if (mode === 'generate') {
                const res = await aiGenerateTasks({ description: input, projectId });
                const tasks = res.data.tasks;
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `I generated **${tasks.length} tasks** for you:\n\n${tasks.map((t, i) => `${i + 1}. **${t.title}** (${t.priority}) — ${t.description}`).join('\n')}`,
                    tasks,
                }]);
            } else {
                const history = messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content }));
                const res = await aiChat({ message: input, projectId, history });
                setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
            }
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Sorry, I couldn\'t process that. Try again!' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
                position: 'fixed', top: 0, right: 0, bottom: 0, width: '400px', maxWidth: '100vw',
                background: '#12121a', borderLeft: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', flexDirection: 'column', zIndex: 1000,
                boxShadow: '-10px 0 40px rgba(0,0,0,0.5)',
            }}
        >
            {/* Header */}
            <div style={{
                padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                        style={{ width: 36, height: 36, borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}
                    >
                        🤖
                    </motion.div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Symphony AI</div>
                        <div style={{ fontSize: '0.7rem', color: '#6366f1' }}>{mode === 'generate' ? 'Task Generator' : 'Chat Mode'}</div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={() => setMode(mode === 'chat' ? 'generate' : 'chat')}
                        style={{
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px', padding: '0.4rem 0.7rem', color: '#a0a0b0', cursor: 'pointer', fontSize: '0.72rem',
                        }}
                    >
                        {mode === 'chat' ? '✨ Generate' : '💬 Chat'}
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px', padding: '0.4rem 0.7rem', color: '#a0a0b0', cursor: 'pointer', fontSize: '0.9rem',
                        }}
                    >✕</button>
                </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {messages.map((msg, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '85%', padding: '0.8rem 1rem', borderRadius: '16px',
                            background: msg.role === 'user' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.04)',
                            border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.06)',
                            fontSize: '0.85rem', lineHeight: 1.6, color: '#e0e0e0',
                            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        }}
                    >
                        {msg.content}
                        {msg.tasks && onTasksGenerated && (
                            <button
                                onClick={() => onTasksGenerated(msg.tasks)}
                                style={{
                                    display: 'block', marginTop: '0.75rem', padding: '0.5rem 1rem',
                                    background: '#22c55e', color: 'white', border: 'none', borderRadius: '8px',
                                    cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem',
                                }}
                            >
                                ➕ Add these tasks to project
                            </button>
                        )}
                    </motion.div>
                ))}
                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ alignSelf: 'flex-start', padding: '0.8rem 1rem', background: 'rgba(255,255,255,0.04)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                        <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ fontSize: '0.85rem', color: '#a0a0b0' }}>
                            Thinking...
                        </motion.span>
                    </motion.div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{
                    display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.03)',
                    borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', padding: '0.5rem',
                }}>
                    <input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                        placeholder={mode === 'generate' ? 'Describe your project or feature...' : 'Ask me anything...'}
                        style={{
                            flex: 1, background: 'transparent', border: 'none', outline: 'none',
                            color: '#e0e0e0', fontSize: '0.85rem', padding: '0.4rem',
                        }}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={loading || !input.trim()}
                        style={{
                            background: loading ? '#333' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            border: 'none', borderRadius: '10px', padding: '0.5rem 1rem',
                            color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.8rem',
                        }}
                    >
                        {mode === 'generate' ? '✨' : '→'}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
