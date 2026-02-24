import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ListSkeleton } from '../components/LoadingSkeleton';
import AnimatedButton from '../components/AnimatedButton';
import Spotlight from '../components/Spotlight';
import { useAuth } from '../context/AuthContext';
import './TeamMembers.css';

const CandidatesList = ({ orgId, organization }) => {
    const [candidates, setCandidates] = useState([]);
    const [invitingId, setInvitingId] = useState(null);
    const [invitedIds, setInvitedIds] = useState(new Set());

    useEffect(() => {
        if (!orgId) return;
        const fetchCandidates = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${import.meta.env.VITE_API_URL}/organizations/${orgId}/members/candidates`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) setCandidates(await res.json());
            } catch (e) { console.error(e); }
        };
        fetchCandidates();
    }, [orgId]);

    if (candidates.length === 0) return null;

    const handleConnect = async (candidate) => {
        setInvitingId(candidate._id);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL}/organizations/${orgId}/members/invite`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: candidate.email, role: 'member' })
            });
            if (res.ok) {
                setInvitedIds(prev => new Set([...prev, candidate._id]));
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to send invitation');
            }
        } catch (e) {
            console.error(e);
            alert('Failed to send invitation');
        } finally {
            setInvitingId(null);
        }
    };

    return (
        <>
            {candidates.map(candidate => {
                const isInvited = invitedIds.has(candidate._id);
                const isInviting = invitingId === candidate._id;
                return (
                    <motion.div
                        key={candidate._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -3 }}
                        style={{
                            minWidth: '200px',
                            background: 'var(--bg-card)',
                            padding: '1rem',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'border-color 0.2s'
                        }}
                    >
                        <img src={candidate.avatar} alt={candidate.name} style={{ width: '50px', height: '50px', borderRadius: '50%' }} />
                        <div style={{ textAlign: 'center' }}>
                            <h4 style={{ color: 'var(--text-primary)', fontSize: '0.9rem', margin: 0 }}>{candidate.name}</h4>
                            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>Open to Work</span>
                        </div>
                        <button
                            onClick={() => !isInvited && handleConnect(candidate)}
                            disabled={isInvited || isInviting}
                            style={{
                                marginTop: '0.5rem',
                                background: isInvited ? 'rgba(34, 197, 94, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                color: isInvited ? '#22c55e' : '#60a5fa',
                                border: isInvited ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
                                padding: '4px 12px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                cursor: isInvited ? 'default' : 'pointer',
                                transition: 'all 0.2s',
                                opacity: isInviting ? 0.6 : 1
                            }}
                        >
                            {isInvited ? '✓ Invited' : isInviting ? 'Sending...' : 'Invite to Team →'}
                        </button>
                    </motion.div>
                );
            })}
        </>
    );
};

function TeamMembers() {
    const [members, setMembers] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [organization, setOrganization] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('member');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { user } = useAuth();
    const userId = user?._id || user?.id;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');

            const orgRes = await fetch(`${import.meta.env.VITE_API_URL}/organizations/current`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!orgRes.ok) {
                navigate('/dashboard');
                return;
            }

            const orgData = await orgRes.json();
            setOrganization(orgData);

            const membersRes = await fetch(
                `${import.meta.env.VITE_API_URL}/organizations/${orgData._id}/members`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (membersRes.ok) {
                const membersData = await membersRes.json();
                setMembers(membersData);
            } else {
                setError('Failed to load team members. You may need to run the migration script.');
            }

            setLoading(false);
        } catch (err) {
            console.error('Error in fetchData:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/organizations/${organization._id}/members/invite`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email: inviteEmail, role: inviteRole })
                }
            );

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to send invitation');
            }

            setShowInviteModal(false);
            setInviteEmail('');
            setInviteRole('member');
            alert('Invitation sent successfully!');
            fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (!confirm('Are you sure you want to remove this member?')) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/organizations/${organization._id}/members/${memberId}`,
                {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to remove member');
            }

            fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleChangeRole = async (memberId, newRole) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/organizations/${organization._id}/members/${memberId}/role`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ role: newRole })
                }
            );

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update role');
            }

            fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

    const getInitials = (name) => {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
    };

    const getRoleBadgeClass = (role) => {
        switch (role) {
            case 'owner': return 'role-badge-owner';
            case 'admin': return 'role-badge-admin';
            case 'member': return 'role-badge-member';
            default: return '';
        }
    };

    if (loading) {
        return <ListSkeleton count={5} />;
    }

    const currentMember = members.find(m => m.user._id === userId || m.user.id === userId);
    const canInvite = currentMember && ['owner', 'admin'].includes(currentMember.role);

    return (
        <motion.div
            className="team-members-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className="page-header">
                <div>
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        Team Members
                    </motion.h1>
                    <p className="page-subtitle">{organization?.name || 'Organization'}</p>
                </div>
                {canInvite && (
                    <AnimatedButton variant="primary" onClick={() => setShowInviteModal(true)}>
                        + Invite Member
                    </AnimatedButton>
                )}
            </div>

            {
                error && (
                    <motion.div
                        className="error-message"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                    >
                        {error}
                    </motion.div>
                )
            }

            {/* Suggested Candidates */}
            <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" /><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    Suggested Candidates
                </h3>
                <motion.div
                    layout
                    style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}
                >
                    <CandidatesList orgId={organization?._id} organization={organization} />
                </motion.div>
            </div>

            {
                members.length === 0 ? (
                    <motion.div
                        className="empty-state"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h2>No Team Members Found</h2>
                        <p>Your organization needs to be migrated to the new team system.</p>
                        <p><strong>Run this in the browser console (F12):</strong></p>
                        <pre style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '8px', overflowX: 'auto', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                            {`fetch('${import.meta.env.VITE_API_URL}/organizations/migrate-members', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(data => {
  console.log('✅', data);
  window.location.reload();
});`}
                        </pre>
                        <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>After running this, the page will refresh and show your team!</p>
                    </motion.div>
                ) : (
                    <motion.div
                        className="members-grid"
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
                        {members.map(member => (
                            <Spotlight
                                key={member._id}
                                className="member-card"
                                variants={{
                                    hidden: { opacity: 0, y: 20 },
                                    visible: { opacity: 1, y: 0 }
                                }}
                                whileHover={{
                                    y: -5,
                                    transition: { duration: 0.2 }
                                }}
                            >
                                <div className="member-avatar">
                                    {getInitials(member.user?.name || 'Unknown')}
                                </div>
                                <div className="member-info">
                                    <h3>{member.user?.name || 'Unknown User'}</h3>
                                    <p className="member-email">{member.user?.email || 'No email'}</p>
                                    <span className={`role-badge ${getRoleBadgeClass(member.role)}`}>
                                        {member.role}
                                    </span>
                                    {member.joinedAt && (
                                        <p className="member-joined">
                                            Joined {new Date(member.joinedAt).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                                {canInvite && member.role !== 'owner' && member.user?._id !== userId && member.user?.id !== userId && (
                                    <div className="member-actions">
                                        {currentMember.role === 'owner' && (
                                            <select
                                                value={member.role}
                                                onChange={(e) => handleChangeRole(member.user?._id, e.target.value)}
                                                className="role-select"
                                            >
                                                <option value="admin">Admin</option>
                                                <option value="member">Member</option>
                                            </select>
                                        )}
                                        <button
                                            className="btn-danger-small"
                                            onClick={() => handleRemoveMember(member.user?._id)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}
                            </Spotlight>
                        ))}
                    </motion.div>
                )
            }

            <AnimatePresence>
                {showInviteModal && (
                    <motion.div
                        className="modal-overlay"
                        onClick={() => setShowInviteModal(false)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="modal-content"
                            onClick={(e) => e.stopPropagation()}
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        >
                            <h2>Invite Team Member</h2>
                            <form onSubmit={handleInvite}>
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        placeholder="colleague@example.com"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Role</label>
                                    <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                                        <option value="member">Member</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                {error && <div className="error-message">{error}</div>}
                                <div className="modal-actions">
                                    <AnimatedButton variant="secondary" type="button" onClick={() => setShowInviteModal(false)}>
                                        Cancel
                                    </AnimatedButton>
                                    <AnimatedButton variant="primary" type="submit">
                                        Send Invitation
                                    </AnimatedButton>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div >
    );
}

export default TeamMembers;
