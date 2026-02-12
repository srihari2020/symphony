import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import AnimatedButton from '../components/AnimatedButton';

const PostCard = ({ post, onLike }) => {
    const { user } = useAuth();
    const isLiked = post.likes.includes(user?._id);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="post-card"
            style={{
                background: '#1e1e24',
                borderRadius: '16px',
                padding: '1.5rem',
                marginBottom: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #2dd4bf 0%, #06b6d4 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 'bold', color: 'white'
                }}>
                    {post.author?.name?.[0] || 'U'}
                </div>
                <div>
                    <h4 style={{ margin: 0, color: 'white' }}>{post.author?.name || 'Unknown User'}</h4>
                    <span style={{ fontSize: '0.8rem', color: '#666' }}>
                        {new Date(post.createdAt).toLocaleDateString()} • {post.type === 'general' ? 'Post' : post.type.replace('_', ' ')}
                    </span>
                </div>
            </div>

            <p style={{ color: '#ccc', lineHeight: '1.6', fontSize: '1rem', marginBottom: '1.5rem' }}>
                {post.content}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1rem' }}>
                <button
                    onClick={() => onLike(post._id)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: isLiked ? '#ef4444' : '#888',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'color 0.2s'
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    {post.likes.length} Likes
                </button>
                <button style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#888',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    {post.comments?.length || 0} Comments
                </button>
            </div>
        </motion.div>
    );
};

const Community = () => {
    const { token, loading: authLoading } = useAuth();
    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState('');
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    const fetchPosts = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/posts`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                if (res.status === 401) {
                    console.error('Unauthorized Access');
                }
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();

            if (Array.isArray(data)) {
                setPosts(data);
            } else {
                console.error('API response is not an array:', data);
                setPosts([]);
            }
        } catch (err) {
            console.error('Error fetching posts:', err);
            setPosts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading) {
            if (token) {
                fetchPosts();
            } else {
                setLoading(false); // Stop loading if not logged in
            }
        }
    }, [token, authLoading]);

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!newPost.trim()) return;

        try {
            const res = await fetch(`${API_URL}/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ content: newPost, type: 'general' }) // Extend later for types
            });
            const post = await res.json();
            setPosts([post, ...posts]);
            setNewPost('');
        } catch (err) {
            console.error('Error creating post:', err);
        }
    };

    const handleLike = async (postId) => {
        try {
            const res = await fetch(`${API_URL}/posts/${postId}/like`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });
            const likes = await res.json();
            setPosts(posts.map(p => p._id === postId ? { ...p, likes } : p));
        } catch (err) {
            console.error('Error liking post:', err);
        }
    };

    const filteredPosts = filter === 'all' ? posts : posts.filter(p => p.type === filter);

    return (
        <div className="community-page" style={{ maxWidth: '800px', margin: '0 auto', color: '#fff' }}>
            <div className="page-header" style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Community Hub</h1>
                <p style={{ color: '#888' }}>Connect with others, find teams, and share your journey.</p>
            </div>

            {/* Create Post */}
            <div style={{ marginBottom: '2rem', background: '#1e1e24', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <textarea
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="Share something with the community..."
                    style={{
                        width: '100%',
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid #333',
                        borderRadius: '8px',
                        padding: '1rem',
                        color: 'white',
                        minHeight: '100px',
                        marginBottom: '1rem',
                        resize: 'vertical',
                        fontFamily: 'inherit'
                    }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <AnimatedButton variant="primary" onClick={handleCreatePost}>
                        Post Update
                    </AnimatedButton>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {['all', 'general', 'achievement', 'looking_for_team', 'hiring'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        style={{
                            background: filter === f ? 'rgba(45, 212, 191, 0.2)' : 'rgba(255,255,255,0.05)',
                            color: filter === f ? '#2dd4bf' : '#888',
                            border: filter === f ? '1px solid rgba(45, 212, 191, 0.4)' : '1px solid transparent',
                            padding: '0.5rem 1rem',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            textTransform: 'capitalize'
                        }}
                    >
                        {f.replace(/_/g, ' ')}
                    </button>
                ))}
            </div>

            {/* Feed */}
            {loading ? (
                <div>Loading community...</div>
            ) : (
                <div className="feed">
                    <AnimatePresence>
                        {filteredPosts.map(post => (
                            <PostCard key={post._id} post={post} onLike={handleLike} />
                        ))}
                    </AnimatePresence>
                    {filteredPosts.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                            No posts yet. Be the first to share!
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Community;
