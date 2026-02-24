import { useState, useEffect } from 'react';
import { getIntegrations, getGitHubAuthUrl, getSlackAuthUrl, disconnectIntegration, getCurrentOrg } from '../api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AnimatedButton from '../components/AnimatedButton';
import Spotlight from '../components/Spotlight';

const STORAGE_KEY = 'symphony-settings';

function loadPersistedSettings() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch { return null; }
}

function persistSettings(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export default function Settings() {
    const { user, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const [integrations, setIntegrations] = useState([]);
    const [org, setOrg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profile');

    // Profile settings
    const [profileName, setProfileName] = useState('');
    const [profileEmail, setProfileEmail] = useState('');
    const [profileSaved, setProfileSaved] = useState(false);

    // Password change
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [passwordMsg, setPasswordMsg] = useState('');

    // Notification preferences (persisted)
    const persisted = loadPersistedSettings();
    const [notifications, setNotifications] = useState(persisted?.notifications || {
        emailOnInvite: true,
        emailOnMention: true,
        emailOnTaskAssign: true,
        pushEnabled: false,
        digestFrequency: 'daily'
    });

    // Appearance (persisted)
    const [appearance, setAppearance] = useState(persisted?.appearance || {
        sidebarCompact: false,
        animationsEnabled: true,
        fontSize: 'medium'
    });

    // Locale
    const [timezone, setTimezone] = useState(persisted?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
    const [language, setLanguage] = useState(persisted?.language || 'en');

    // Persist settings when they change
    useEffect(() => {
        persistSettings({ notifications, appearance, timezone, language });
    }, [notifications, appearance, timezone, language]);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (user) {
            setProfileName(user.name || '');
            setProfileEmail(user.email || '');
        }
    }, [user]);

    const loadData = async () => {
        try {
            const [integrationsRes, orgRes] = await Promise.all([
                getIntegrations(),
                getCurrentOrg().catch(() => ({ data: null }))
            ]);
            setIntegrations(integrationsRes.data);
            setOrg(orgRes.data);
        } catch (err) {
            console.error('Error loading settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const connectGitHub = async () => {
        try {
            const res = await getGitHubAuthUrl();
            window.location.href = res.data.url;
        } catch (err) {
            console.error('Error getting GitHub auth URL:', err);
        }
    };

    const connectSlack = async () => {
        try {
            const res = await getSlackAuthUrl();
            window.location.href = res.data.url;
        } catch (err) {
            console.error('Error getting Slack auth URL:', err);
        }
    };

    const handleDisconnect = async (type) => {
        if (!confirm(`Are you sure you want to disconnect ${type}?`)) return;
        try {
            await disconnectIntegration(type);
            loadData();
        } catch (err) {
            console.error('Error disconnecting:', err);
        }
    };

    const handleSaveProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const res = await fetch(`${API_URL}/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name: profileName })
            });
            if (res.ok) {
                setProfileSaved(true);
                setTimeout(() => setProfileSaved(false), 3000);
            }
        } catch (err) {
            console.error('Error saving profile:', err);
        }
    };

    const handleChangePassword = async () => {
        setPasswordMsg('');
        if (passwords.new !== passwords.confirm) {
            setPasswordMsg('New passwords do not match');
            return;
        }
        if (passwords.new.length < 6) {
            setPasswordMsg('Password must be at least 6 characters');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const res = await fetch(`${API_URL}/auth/change-password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.new })
            });
            if (res.ok) {
                setPasswordMsg('✓ Password changed successfully!');
                setPasswords({ current: '', new: '', confirm: '' });
            } else {
                const data = await res.json();
                setPasswordMsg(data.error || 'Failed to change password');
            }
        } catch (err) {
            setPasswordMsg('Failed to change password');
        }
    };

    const handleExportData = () => {
        const exportData = {
            profile: { name: user?.name, email: user?.email },
            organization: org ? { name: org.name, members: org.members?.length } : null,
            settings: { notifications, appearance, timezone, language, theme },
            integrations: integrations.map(i => ({ type: i.type, connected: true })),
            exportedAt: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `symphony-data-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const hasGithub = integrations.some(i => i.type === 'github');
    const hasSlack = integrations.some(i => i.type === 'slack');

    const tabs = [
        { id: 'profile', label: 'Profile', icon: '👤' },
        { id: 'integrations', label: 'Integrations', icon: '🔗' },
        { id: 'notifications', label: 'Notifications', icon: '🔔' },
        { id: 'appearance', label: 'Appearance', icon: '🎨' },
        { id: 'account', label: 'Account', icon: '⚙️' }
    ];

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    const inputStyle = {
        width: '100%',
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '0.75rem 1rem',
        color: 'var(--text-primary)',
        fontSize: '0.95rem'
    };

    const cardDivider = { borderBottom: '1px solid var(--border-color)' };

    return (
        <div className="settings" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <header className="page-header">
                <h1>Settings</h1>
                <p style={{ color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>Manage your account, integrations, and preferences</p>
            </header>

            {/* Tabs */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '2rem',
                overflowX: 'auto',
                paddingBottom: '0.5rem',
                borderBottom: '1px solid var(--border-color)'
            }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            background: activeTab === tab.id ? 'rgba(45, 212, 191, 0.15)' : 'transparent',
                            color: activeTab === tab.id ? '#2dd4bf' : 'var(--text-tertiary)',
                            border: 'none',
                            padding: '0.75rem 1.25rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        <span>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <section className="settings-section">
                    <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Profile Settings</h2>

                    <Spotlight className="settings-card" style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <div style={{
                                width: '64px', height: '64px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, #2dd4bf, #06b6d4)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.5rem', fontWeight: 'bold', color: 'white'
                            }}>
                                {user?.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                                <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>{user?.name || 'User'}</h3>
                                <p style={{ color: 'var(--text-tertiary)', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>{user?.email}</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Display Name</label>
                                <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} style={inputStyle} />
                            </div>
                            <div>
                                <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Email (read-only)</label>
                                <input type="email" value={profileEmail} disabled style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <AnimatedButton variant="primary" onClick={handleSaveProfile}>
                                    Save Profile
                                </AnimatedButton>
                                {profileSaved && (
                                    <span style={{ color: '#2dd4bf', fontSize: '0.85rem' }}>✓ Saved!</span>
                                )}
                            </div>
                        </div>
                    </Spotlight>

                    {/* Change Password */}
                    <h3 style={{ marginBottom: '1rem', marginTop: '2rem', color: 'var(--text-primary)' }}>Change Password</h3>
                    <Spotlight className="settings-card" style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Current Password</label>
                                <input type="password" value={passwords.current} onChange={e => setPasswords({ ...passwords, current: e.target.value })} style={inputStyle} placeholder="Enter current password" />
                            </div>
                            <div>
                                <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>New Password</label>
                                <input type="password" value={passwords.new} onChange={e => setPasswords({ ...passwords, new: e.target.value })} style={inputStyle} placeholder="Enter new password (min 6 chars)" />
                            </div>
                            <div>
                                <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Confirm New Password</label>
                                <input type="password" value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} style={inputStyle} placeholder="Confirm new password" />
                            </div>
                            {passwordMsg && (
                                <div style={{ color: passwordMsg.startsWith('✓') ? '#2dd4bf' : '#ef4444', fontSize: '0.85rem' }}>{passwordMsg}</div>
                            )}
                            <AnimatedButton variant="secondary" onClick={handleChangePassword}>
                                Update Password
                            </AnimatedButton>
                        </div>
                    </Spotlight>

                    {/* Organization */}
                    <h3 style={{ marginBottom: '1rem', marginTop: '2rem', color: 'var(--text-primary)' }}>Organization</h3>
                    <Spotlight className="settings-card">
                        {org ? (
                            <div className="org-info" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ fontSize: '2rem' }}>🏢</div>
                                <div>
                                    <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{org.name}</div>
                                    <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>{org.members?.length || 1} member(s)</div>
                                </div>
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-tertiary)' }}>No organization found</p>
                        )}
                    </Spotlight>
                </section>
            )}

            {/* Integrations Tab */}
            {activeTab === 'integrations' && (
                <section className="settings-section">
                    <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Integrations</h2>

                    <Spotlight className="integration-card">
                        <div className="integration-info">
                            <div className="integration-icon github">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                                </svg>
                            </div>
                            <div>
                                <div className="integration-name">GitHub</div>
                                <div className="integration-status">
                                    {hasGithub ? '✓ Connected' : 'Not connected'}
                                </div>
                            </div>
                        </div>
                        {hasGithub ? (
                            <AnimatedButton variant="danger" onClick={() => handleDisconnect('github')}>
                                Disconnect
                            </AnimatedButton>
                        ) : (
                            <AnimatedButton variant="primary" onClick={connectGitHub}>
                                Connect GitHub
                            </AnimatedButton>
                        )}
                    </Spotlight>

                    <Spotlight className="integration-card">
                        <div className="integration-info">
                            <div className="integration-icon slack">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
                                </svg>
                            </div>
                            <div>
                                <div className="integration-name">Slack</div>
                                <div className="integration-status">
                                    {hasSlack ? '✓ Connected' : 'Not connected'}
                                </div>
                            </div>
                        </div>
                        {hasSlack ? (
                            <AnimatedButton variant="danger" onClick={() => handleDisconnect('slack')}>
                                Disconnect
                            </AnimatedButton>
                        ) : (
                            <AnimatedButton variant="primary" onClick={connectSlack}>
                                Connect Slack
                            </AnimatedButton>
                        )}
                    </Spotlight>
                </section>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
                <section className="settings-section">
                    <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Notification Preferences</h2>

                    <Spotlight className="settings-card" style={{ marginBottom: '1rem' }}>
                        <h3 style={{ color: 'var(--text-primary)', margin: '0 0 1.25rem', fontSize: '1rem' }}>Email Notifications</h3>
                        {[
                            { key: 'emailOnInvite', label: 'Team invitations', desc: 'When someone invites you to join their team' },
                            { key: 'emailOnMention', label: 'Mentions', desc: 'When someone mentions you in a post or comment' },
                            { key: 'emailOnTaskAssign', label: 'Task assignments', desc: 'When a task is assigned to you' }
                        ].map(item => (
                            <div key={item.key} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '0.75rem 0', ...cardDivider
                            }}>
                                <div>
                                    <div style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{item.label}</div>
                                    <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>{item.desc}</div>
                                </div>
                                <label style={{ position: 'relative', width: '44px', height: '24px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={notifications[item.key]}
                                        onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                                        style={{ opacity: 0, width: 0, height: 0 }}
                                    />
                                    <span style={{
                                        position: 'absolute', inset: 0, borderRadius: '12px',
                                        background: notifications[item.key] ? '#2dd4bf' : 'var(--bg-hover)',
                                        transition: 'background 0.3s'
                                    }} />
                                    <span style={{
                                        position: 'absolute', top: '2px',
                                        left: notifications[item.key] ? '22px' : '2px',
                                        width: '20px', height: '20px', borderRadius: '50%',
                                        background: 'white', transition: 'left 0.3s',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                                    }} />
                                </label>
                            </div>
                        ))}
                    </Spotlight>

                    <Spotlight className="settings-card">
                        <h3 style={{ color: 'var(--text-primary)', margin: '0 0 1rem', fontSize: '1rem' }}>Digest Frequency</h3>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            {['realtime', 'daily', 'weekly', 'off'].map(freq => (
                                <button
                                    key={freq}
                                    onClick={() => setNotifications({ ...notifications, digestFrequency: freq })}
                                    style={{
                                        background: notifications.digestFrequency === freq ? 'rgba(45, 212, 191, 0.2)' : 'var(--bg-hover)',
                                        color: notifications.digestFrequency === freq ? '#2dd4bf' : 'var(--text-tertiary)',
                                        border: notifications.digestFrequency === freq ? '1px solid rgba(45, 212, 191, 0.4)' : '1px solid var(--border-color)',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        textTransform: 'capitalize',
                                        fontSize: '0.85rem'
                                    }}
                                >
                                    {freq === 'off' ? 'Off' : freq === 'realtime' ? 'Real-time' : freq.charAt(0).toUpperCase() + freq.slice(1)}
                                </button>
                            ))}
                        </div>
                    </Spotlight>
                </section>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
                <section className="settings-section">
                    <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Appearance</h2>

                    <Spotlight className="settings-card" style={{ marginBottom: '1rem' }}>
                        <h3 style={{ color: 'var(--text-primary)', margin: '0 0 1.25rem', fontSize: '1rem' }}>Theme</h3>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {[
                                { id: 'dark', label: 'Dark', icon: '🌙', desc: 'Easy on the eyes' },
                                { id: 'light', label: 'Light', icon: '☀️', desc: 'Classic bright look' },
                                { id: 'system', label: 'System', icon: '💻', desc: 'Match your OS' }
                            ].map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setTheme(t.id)}
                                    style={{
                                        flex: 1,
                                        background: theme === t.id ? 'rgba(45, 212, 191, 0.1)' : 'var(--bg-hover)',
                                        border: theme === t.id ? '2px solid rgba(45, 212, 191, 0.5)' : '2px solid var(--border-color)',
                                        padding: '1.25rem',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{t.icon}</div>
                                    <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' }}>{t.label}</div>
                                    <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{t.desc}</div>
                                </button>
                            ))}
                        </div>
                    </Spotlight>

                    <Spotlight className="settings-card" style={{ marginBottom: '1rem' }}>
                        <h3 style={{ color: 'var(--text-primary)', margin: '0 0 1.25rem', fontSize: '1rem' }}>Interface</h3>
                        {[
                            { key: 'sidebarCompact', label: 'Compact sidebar', desc: 'Show icons only in the sidebar' },
                            { key: 'animationsEnabled', label: 'Animations', desc: 'Enable smooth page transitions and effects' }
                        ].map(item => (
                            <div key={item.key} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '0.75rem 0', ...cardDivider
                            }}>
                                <div>
                                    <div style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{item.label}</div>
                                    <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>{item.desc}</div>
                                </div>
                                <label style={{ position: 'relative', width: '44px', height: '24px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={appearance[item.key]}
                                        onChange={(e) => setAppearance({ ...appearance, [item.key]: e.target.checked })}
                                        style={{ opacity: 0, width: 0, height: 0 }}
                                    />
                                    <span style={{
                                        position: 'absolute', inset: 0, borderRadius: '12px',
                                        background: appearance[item.key] ? '#2dd4bf' : 'var(--bg-hover)',
                                        transition: 'background 0.3s'
                                    }} />
                                    <span style={{
                                        position: 'absolute', top: '2px',
                                        left: appearance[item.key] ? '22px' : '2px',
                                        width: '20px', height: '20px', borderRadius: '50%',
                                        background: 'white', transition: 'left 0.3s',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                                    }} />
                                </label>
                            </div>
                        ))}
                    </Spotlight>

                    <Spotlight className="settings-card">
                        <h3 style={{ color: 'var(--text-primary)', margin: '0 0 1.25rem', fontSize: '1rem' }}>Locale</h3>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Timezone</label>
                                <select value={timezone} onChange={e => setTimezone(e.target.value)} style={inputStyle}>
                                    {['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Kolkata', 'Australia/Sydney', 'Pacific/Auckland'].map(tz => (
                                        <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Language</label>
                                <select value={language} onChange={e => setLanguage(e.target.value)} style={inputStyle}>
                                    <option value="en">English</option>
                                    <option value="es">Español</option>
                                    <option value="fr">Français</option>
                                    <option value="de">Deutsch</option>
                                    <option value="ja">日本語</option>
                                    <option value="hi">हिन्दी</option>
                                </select>
                            </div>
                        </div>
                    </Spotlight>
                </section>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
                <section className="settings-section">
                    <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Account</h2>

                    <Spotlight className="settings-card" style={{ marginBottom: '1rem' }}>
                        <h3 style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem', fontSize: '1rem' }}>Session</h3>
                        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                            Logged in as <strong style={{ color: 'var(--text-primary)' }}>{user?.email}</strong>
                        </p>
                        <AnimatedButton variant="secondary" onClick={logout}>
                            Sign Out
                        </AnimatedButton>
                    </Spotlight>

                    <Spotlight className="settings-card" style={{ marginBottom: '1rem' }}>
                        <h3 style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem', fontSize: '1rem' }}>Export Data</h3>
                        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                            Download all your data including profile, settings, and integrations
                        </p>
                        <AnimatedButton variant="secondary" onClick={handleExportData}>
                            📥 Export My Data
                        </AnimatedButton>
                    </Spotlight>

                    <div style={{
                        background: 'rgba(239, 68, 68, 0.05)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '12px',
                        padding: '1.5rem'
                    }}>
                        <h3 style={{ color: '#ef4444', margin: '0 0 0.5rem', fontSize: '1rem' }}>Danger Zone</h3>
                        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                            Permanently delete your account and all associated data. This action cannot be undone.
                        </p>
                        <AnimatedButton
                            variant="danger"
                            onClick={() => alert('Account deletion requires email confirmation. Feature coming soon.')}
                        >
                            Delete Account
                        </AnimatedButton>
                    </div>
                </section>
            )}
        </div>
    );
}
