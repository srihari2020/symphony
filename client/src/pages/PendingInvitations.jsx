import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ListSkeleton } from '../components/LoadingSkeleton';
import AnimatedButton from '../components/AnimatedButton';
import Spotlight from '../components/Spotlight';
import './PendingInvitations.css';

function PendingInvitations() {
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchInvitations();
    }, []);

    const fetchInvitations = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/invitations/pending`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Failed to load invitations');

            const data = await res.json();
            setInvitations(data);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleAccept = async (token) => {
        try {
            const authToken = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/invitations/${token}/accept`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to accept invitation');
            }

            alert('Invitation accepted! Welcome to the team!');
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDecline = async (invitationId) => {
        if (!confirm('Are you sure you want to decline this invitation?')) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/invitations/${invitationId}/decline`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to decline invitation');
            }

            fetchInvitations(); // Refresh
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) {
        return <ListSkeleton count={3} />;
    }

    return (
        <motion.div
            className="invitations-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                Pending Invitations
            </motion.h1>

            {error && (
                <motion.div
                    className="error-message"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                >
                    {error}
                </motion.div>
            )}

            {invitations.length === 0 ? (
                <motion.div
                    className="empty-state"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <p>You have no pending invitations.</p>
                </motion.div>
            ) : (
                <motion.div
                    className="invitations-list"
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: { opacity: 0 },
                        visible: {
                            opacity: 1,
                            transition: {
                                staggerChildren: 0.1
                            }
                        }
                    }}
                >
                    <AnimatePresence>
                        {invitations.map(invitation => (
                            <Spotlight
                                key={invitation._id}
                                className="invitation-card"
                                layout
                                variants={{
                                    hidden: { opacity: 0, y: 20 },
                                    visible: { opacity: 1, y: 0 }
                                }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                whileHover={{
                                    y: -5,
                                    transition: { duration: 0.2 }
                                }}
                            >
                                <div className="invitation-info">
                                    <h3>{invitation.organization?.name || 'Unknown Organization'}</h3>
                                    <p className="invitation-details">
                                        Invited by {invitation.invitedBy?.name || 'Unknown'} ({invitation.invitedBy?.email || 'No email'})
                                    </p>
                                    <span className={`role-badge role-badge-${invitation.role}`}>
                                        {invitation.role}
                                    </span>
                                    <p className="invitation-date">
                                        Expires on {invitation.expiresAt ? new Date(invitation.expiresAt).toLocaleDateString() : 'Unknown date'}
                                    </p>
                                </div>
                                <div className="invitation-actions">
                                    <AnimatedButton
                                        variant="primary"
                                        onClick={() => handleAccept(invitation.token)}
                                    >
                                        Accept
                                    </AnimatedButton>
                                    <AnimatedButton
                                        variant="secondary"
                                        onClick={() => handleDecline(invitation._id)}
                                    >
                                        Decline
                                    </AnimatedButton>
                                </div>
                            </Spotlight>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}
        </motion.div>
    );
}

export default PendingInvitations;
