import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
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
        return <Layout><div className="loading">Loading invitations...</div></Layout>;
    }

    return (
        <Layout>
            <div className="invitations-page">
                <h1>Pending Invitations</h1>

                {error && <div className="error-message">{error}</div>}

                {invitations.length === 0 ? (
                    <div className="empty-state">
                        <p>You have no pending invitations.</p>
                    </div>
                ) : (
                    <div className="invitations-list">
                        {invitations.map(invitation => (
                            <div key={invitation._id} className="invitation-card">
                                <div className="invitation-info">
                                    <h3>{invitation.organization.name}</h3>
                                    <p className="invitation-details">
                                        Invited by {invitation.invitedBy.name} ({invitation.invitedBy.email})
                                    </p>
                                    <span className={`role-badge role-badge-${invitation.role}`}>
                                        {invitation.role}
                                    </span>
                                    <p className="invitation-date">
                                        Expires on {new Date(invitation.expiresAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="invitation-actions">
                                    <button
                                        className="btn-primary"
                                        onClick={() => handleAccept(invitation.token)}
                                    >
                                        Accept
                                    </button>
                                    <button
                                        className="btn-secondary"
                                        onClick={() => handleDecline(invitation._id)}
                                    >
                                        Decline
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}

export default PendingInvitations;
