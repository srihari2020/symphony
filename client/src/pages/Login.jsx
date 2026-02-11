import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import AnimatedButton from '../components/AnimatedButton';

// Google Sign-In Script Loader
const loadGoogleScript = () => {
    return new Promise((resolve) => {
        if (window.google) {
            resolve(window.google);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => resolve(window.google);
        document.body.appendChild(script);
    });
};

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, loginWithGoogle, loginWithGitHub } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Initialize Google Sign-In
        loadGoogleScript().then((google) => {
            if (google && google.accounts) {
                google.accounts.id.initialize({
                    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                    callback: handleGoogleCallback
                });
                google.accounts.id.renderButton(
                    document.getElementById('google-signin-btn'),
                    { theme: 'filled_black', size: 'large', width: '100%', text: 'continue_with' }
                );
            }
        });
    }, []);

    const handleGoogleCallback = async (response) => {
        setError('');
        setLoading(true);
        try {
            await loginWithGoogle(response.credential);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Google login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGitHubLogin = async () => {
        setError('');
        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_BASE}/auth/github/url`);
            const { url } = await response.json();
            window.location.href = url;
        } catch (err) {
            setError('Failed to initiate GitHub login');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <motion.div
                className="auth-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div className="auth-header">
                    <motion.h1
                        className="auth-logo"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5, type: 'spring' }}
                    >
                        ♪ Symphony
                    </motion.h1>
                    <p className="auth-subtitle">Welcome back</p>
                </div>

                {/* Social Login Buttons */}
                <div className="social-login">
                    <div id="google-signin-btn" className="social-btn-container"></div>
                </div>

                <div className="divider">
                    <span>or continue with email</span>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {error && (
                        <motion.div
                            className="error-message"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                        >
                            {error}
                        </motion.div>
                    )}
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <AnimatedButton type="submit" variant="primary" disabled={loading} className="w-full">
                        {loading ? 'Signing in...' : 'Sign In'}
                    </AnimatedButton>
                </form>
                <p className="auth-footer">
                    Don't have an account? <Link to="/signup">Sign up</Link>
                </p>
            </motion.div>
        </div>
    );
}
