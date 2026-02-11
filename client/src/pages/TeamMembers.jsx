import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import './TeamMembers.css';

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

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            console.log('Fetching organization data...');

            //Get organization
            const orgRes = await fetch(`${import.meta.env.VITE_API_URL}/organizations/current`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            console.log('Organization response status:', orgRes.status);

            if (!orgRes.ok) {
                const errorText = await orgRes.text();
                console.error('Failed to fetch organization:', errorText);
                navigate('/dashboard');
                return;
            }

            const orgData = await orgRes.json();
            console.log('Organization data:', orgData);
            setOrganization(orgData);

            // Get members
            console.log('Fetching members...');
            const membersRes = await fetch(
                `${import.meta.env.VITE_API_URL}/organizations/${orgData._id}/members`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            console.log('Members response status:', membersRes.status);

            if (membersRes.ok) {
                const membersData = await membersRes.json();
                console.log('Members data:', membersData);
                setMembers(membersData);
            } else {
                const errorText = await membersRes.text();
                console.error('Failed to fetch members:', errorText);
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
            fetchData(); // Refresh
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

            fetchData(); // Refresh
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

            fetchData(); // Refresh
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
        return <Layout><div className="loading">Loading team members...</div></Layout>;
    }

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = currentUser?._id || currentUser?.id;
    const currentMember = members.find(m => m.user._id === userId || m.user.id === userId);
    const canInvite = currentMember && ['owner', 'admin'].includes(currentMember.role);

    return (
        <Layout>
            <div className="team-members-page">
                <div className="page-header">
                    <div>
                        <h1>Team Members</h1>
                        <p className="page-subtitle">{organization?.name || 'Organization'}</p>
                    </div>
                    {canInvite && (
                        <button className="btn-primary" onClick={() => setShowInviteModal(true)}>
                            + Invite Member
                        </button>
                    )}
                </div>

                {error && <div className="error-message">{error}</div>}

                {members.length === 0 ? (
                    <div className="empty-state">
                        <h2>No Team Members Found</h2>
                        <p>Your organization needs to be migrated to the new team system.</p>
                        <p><strong>Run this in the browser console (F12):</strong></p>
                        <pre style={{ background: '#2a2a2a', padding: '1rem', borderRadius: '8px', overflowX: 'auto', fontSize: '0.85rem' }}>
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
                        <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>After running this,the page will refresh and show your team!</p>
                    </div>
                ) : (
                    <div className="members-grid">
                        {members.map(member => (
                            <div key={member._id} className="member-card">
                                <div className="member-avatar">
                                    {getInitials(member.user.name)}
                                </div>
                                <div className="member-info">
                                    <h3>{member.user.name}</h3>
                                    <p className="member-email">{member.user.email}</p>
                                    <span className={`role-badge ${getRoleBadgeClass(member.role)}`}>
                                        {member.role}
                                    </span>
                                    {member.joinedAt && (
                                        <p className="member-joined">
                                            Joined {new Date(member.joinedAt).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                                {canInvite && member.role !== 'owner' && member.user._id !== userId && member.user.id !== userId && (
                                    <div className="member-actions">
                                        {currentMember.role === 'owner' && (
                                            <select
                                                value={member.role}
                                                onChange={(e) => handleChangeRole(member.user._id, e.target.value)}
                                                className="role-select"
                                            >
                                                <option value="admin">Admin</option>
                                                <option value="member">Member</option>
                                            </select>
                                        )}
                                        <button
                                            className="btn-danger-small"
                                            onClick={() => handleRemoveMember(member.user._id)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {showInviteModal && (
                    <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
                                    <button type="button" className="btn-secondary" onClick={() => setShowInviteModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary">
                                        Send Invitation
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}

export default TeamMembers;
