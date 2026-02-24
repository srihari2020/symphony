import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import AnimatedButton from '../components/AnimatedButton';
import { ListSkeleton } from '../components/LoadingSkeleton';
import SvgBackground from '../components/SvgBackground';

const PostCard = ({ post, onLike, onComment, onDeleteComment, onDeletePost }) => {
    const { user } = useAuth();
    const isLiked = Array.isArray(post.likes) && post.likes.includes(user?._id);
    const isExternal = !!post.source && post.source !== 'local';
    const isOwnPost = !isExternal && user && post.author && (
        post.author._id === user._id || post.author === user._id
    );
    const [showCommentInput, setShowCommentInput] = useState(false);
    const [commentText, setCommentText] = useState('');

    const handleSubmitComment = () => {
        if (!commentText.trim()) return;
        onComment(post._id, commentText);
        setCommentText('');
        setShowCommentInput(false);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="post-card"
            style={{
                background: isExternal ? 'linear-gradient(145deg, #1e1e24 0%, #1a1a20 100%)' : '#1e1e24',
                borderRadius: '16px',
                padding: '1.5rem',
                marginBottom: '1rem',
                border: isExternal ? '1px solid rgba(45, 212, 191, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {isExternal && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    background: '#2dd4bf',
                    color: '#000',
                    fontSize: '0.6rem',
                    fontWeight: 'bold',
                    padding: '2px 8px',
                    borderBottomLeftRadius: '8px'
                }}>
                    {post.source?.toUpperCase() || 'EXTERNAL'}
                </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {post.author?.avatar ? (
                        <img src={post.author.avatar} alt={post.author?.name || 'User'} style={{
                            width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover'
                        }} />
                    ) : (
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #2dd4bf 0%, #06b6d4 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 'bold', color: 'white'
                        }}>
                            {post.author?.name?.[0] || 'U'}
                        </div>
                    )}
                    <div>
                        <h4 style={{ margin: 0, color: 'white' }}>{post.author?.name || 'Unknown User'}</h4>
                        <span style={{ fontSize: '0.8rem', color: '#666' }}>
                            {new Date(post.createdAt).toLocaleDateString()} • {post.type === 'general' ? 'Post' : (post.type || 'general').replace('_', ' ')}
                        </span>
                    </div>
                </div>
                {isOwnPost && (
                    <button
                        onClick={() => { if (confirm('Delete this post?')) onDeletePost(post._id); }}
                        title="Delete post"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#555',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            transition: 'color 0.2s'
                        }}
                        onMouseEnter={e => e.target.style.color = '#ef4444'}
                        onMouseLeave={e => e.target.style.color = '#555'}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none' }}>
                            <path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </button>
                )}
            </div>

            <p style={{ color: '#ccc', lineHeight: '1.6', fontSize: '1rem', marginBottom: '1.5rem' }}>
                {post.content}
            </p>

            {post.externalLink && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <a href={post.externalLink} target="_blank" rel="noopener noreferrer" style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: '#2dd4bf',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        fontWeight: 500
                    }}>
                        Read Full Article →
                    </a>
                </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1rem', flexWrap: 'wrap' }}>
                <button
                    onClick={() => !isExternal && onLike(post._id)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: isLiked ? '#ef4444' : '#888',
                        cursor: isExternal ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'color 0.2s',
                        opacity: isExternal ? 0.7 : 1
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    {Array.isArray(post.likes) ? post.likes.length : 0} Likes
                </button>
                <button
                    onClick={() => !isExternal && setShowCommentInput(!showCommentInput)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: showCommentInput ? '#2dd4bf' : '#888',
                        cursor: isExternal ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        opacity: isExternal ? 0.7 : 1
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    {Array.isArray(post.comments) ? post.comments.length : 0} Comments
                </button>
            </div>

            {/* Comment Input */}
            {showCommentInput && !isExternal && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ marginTop: '1rem' }}
                >
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Write a comment..."
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
                            style={{
                                flex: 1,
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid #333',
                                borderRadius: '8px',
                                padding: '0.5rem 1rem',
                                color: 'white',
                                fontSize: '0.9rem'
                            }}
                        />
                        <button
                            onClick={handleSubmitComment}
                            style={{
                                background: 'rgba(45, 212, 191, 0.2)',
                                border: '1px solid rgba(45, 212, 191, 0.4)',
                                color: '#2dd4bf',
                                padding: '0.5rem 1rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.85rem'
                            }}
                        >
                            Post
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Existing Comments */}
            {Array.isArray(post.comments) && post.comments.length > 0 && !isExternal && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
                    {post.comments.slice(0, 3).map((comment, i) => {
                        const isOwnComment = user && comment.author && (
                            comment.author._id === user._id || comment.author === user._id
                        );
                        return (
                            <div key={comment._id || i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'flex-start' }}>
                                <div style={{
                                    width: '24px', height: '24px', borderRadius: '50%',
                                    background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.65rem', color: '#aaa', flexShrink: 0
                                }}>
                                    {comment.author?.name?.[0] || 'U'}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <span style={{ color: '#aaa', fontSize: '0.8rem', fontWeight: 600 }}>
                                        {comment.author?.name || 'User'}
                                    </span>
                                    <p style={{ color: '#999', fontSize: '0.85rem', margin: '2px 0 0 0' }}>
                                        {comment.content}
                                    </p>
                                </div>
                                {isOwnComment && comment._id && (
                                    <button
                                        onClick={() => onDeleteComment(post._id, comment._id)}
                                        title="Delete comment"
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#555',
                                            cursor: 'pointer',
                                            padding: '2px 6px',
                                            fontSize: '0.75rem',
                                            borderRadius: '4px',
                                            transition: 'color 0.2s'
                                        }}
                                        onMouseEnter={e => e.target.style.color = '#ef4444'}
                                        onMouseLeave={e => e.target.style.color = '#555'}
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        );
                    })}
                    {post.comments.length > 3 && (
                        <span style={{ color: '#666', fontSize: '0.8rem' }}>
                            +{post.comments.length - 3} more comments
                        </span>
                    )}
                </div>
            )}
        </motion.div>
    );
};

const Community = () => {
    const { token, loading: authLoading } = useAuth();
    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState('');
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    const fetchPosts = async () => {
        if (!token) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/posts`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store'
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();

            if (Array.isArray(data)) {
                setPosts(data);
            } else {
                setPosts([]);
                setError('Invalid data format received from server');
            }
        } catch (err) {
            console.error('Error fetching posts:', err);
            setPosts([]);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading) {
            if (token) {
                fetchPosts();
            } else {
                setLoading(false);
            }
        }
    }, [token, authLoading]);

    const handleCreatePost = async () => {
        if (!newPost.trim()) return;

        try {
            const res = await fetch(`${API_URL}/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ content: newPost, type: 'general' })
            });

            if (!res.ok) {
                throw new Error(`Failed to create post: ${res.status}`);
            }

            setNewPost('');
            // Re-fetch all posts to get the properly populated new post
            await fetchPosts();
        } catch (err) {
            console.error('Error creating post:', err);
            setError('Failed to create post. Please try again.');
        }
    };

    const handleLike = async (postId) => {
        // Don't attempt to like external posts (non-MongoDB IDs)
        if (!postId || typeof postId !== 'string' || postId.startsWith('devto-') || postId.startsWith('mock-')) return;

        try {
            const res = await fetch(`${API_URL}/posts/${postId}/like`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                throw new Error(`Like failed: ${res.status}`);
            }

            const likes = await res.json();
            setPosts(posts.map(p => p._id === postId ? { ...p, likes } : p));
        } catch (err) {
            console.error('Error liking post:', err);
        }
    };

    const handleComment = async (postId, content) => {
        if (!postId || postId.startsWith('devto-') || postId.startsWith('mock-')) return;

        try {
            const res = await fetch(`${API_URL}/posts/${postId}/comment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ content })
            });

            if (!res.ok) {
                throw new Error(`Comment failed: ${res.status}`);
            }

            const updatedPost = await res.json();
            setPosts(posts.map(p => p._id === postId ? updatedPost : p));
        } catch (err) {
            console.error('Error commenting:', err);
        }
    };

    const handleDeleteComment = async (postId, commentId) => {
        try {
            const res = await fetch(`${API_URL}/posts/${postId}/comment/${commentId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                throw new Error(`Delete comment failed: ${res.status}`);
            }

            const updatedPost = await res.json();
            setPosts(posts.map(p => p._id === postId ? updatedPost : p));
        } catch (err) {
            console.error('Error deleting comment:', err);
        }
    };

    const handleDeletePost = async (postId) => {
        try {
            const res = await fetch(`${API_URL}/posts/${postId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                throw new Error(`Delete post failed: ${res.status}`);
            }

            setPosts(posts.filter(p => p._id !== postId));
        } catch (err) {
            console.error('Error deleting post:', err);
        }
    };

    const filteredPosts = filter === 'all' ? posts : posts.filter(p => p.type === filter);

    return (
        <div className="community-page" style={{ maxWidth: '800px', margin: '0 auto', color: '#fff' }}>
            <div className="page-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
                <SvgBackground variant="teal" opacity={0.03} />
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Community Hub</h1>
                    <p style={{ color: '#888' }}>Connect with others, find teams, and share your journey.</p>
                </div>
                {!loading && (
                    <button
                        onClick={fetchPosts}
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            color: '#fff',
                            padding: '0.5rem',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        title="Refresh Feed"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 4v6h-6"></path>
                            <path d="M1 20v-6h6"></path>
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                        </svg>
                    </button>
                )}
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
                <ListSkeleton count={5} />
            ) : error ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#ef4444' }}>
                    <div style={{ marginBottom: '1rem', fontSize: '2rem' }}>⚠️</div>
                    <h3>Failed to load community feed</h3>
                    <p style={{ color: '#ccc', marginBottom: '1rem' }}>{error}</p>
                    <button
                        onClick={fetchPosts}
                        style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.5)',
                            color: '#ef4444',
                            padding: '0.5rem 1.5rem',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        Retry
                    </button>
                </div>
            ) : (
                <div className="feed">
                    <AnimatePresence>
                        {filteredPosts.map(post => (
                            <PostCard key={post._id} post={post} onLike={handleLike} onComment={handleComment} onDeleteComment={handleDeleteComment} onDeletePost={handleDeletePost} />
                        ))}
                    </AnimatePresence>

                    {filteredPosts.length === 0 && (
                        <div style={{
                            textAlign: 'center',
                            padding: '4rem 2rem',
                            color: '#666',
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: '16px',
                            border: '1px dashed rgba(255,255,255,0.1)'
                        }}>
                            <div style={{ marginBottom: '1rem', fontSize: '2rem' }}>📭</div>
                            <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>No posts found</h3>
                            <p style={{ maxWidth: '400px', margin: '0 auto 1.5rem' }}>
                                The community feed is currently empty. Be the first to start a conversation or check back later!
                            </p>
                            <button
                                onClick={fetchPosts}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid rgba(45, 212, 191, 0.5)',
                                    color: '#2dd4bf',
                                    padding: '0.5rem 1.5rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem'
                                }}
                            >
                                Refresh Feed
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Community;
