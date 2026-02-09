import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function GitHubAuthCallback() {
    const [searchParams] = useSearchParams();
    const [error, setError] = useState('');
    const { loginWithGitHub } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const code = searchParams.get('code');

        if (code) {
            handleCallback(code);
        } else {
            setError('No authorization code received');
        }
    }, [searchParams]);

    const handleCallback = async (code) => {
        try {
            await loginWithGitHub(code);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'GitHub login failed');
        }
    };

    if (error) {
        return (
            <div className="auth-page">
                <div className="auth-container">
                    <div className="auth-header">
                        <h1 className="auth-logo">♪ Symphony</h1>
                        <p className="auth-subtitle">Authentication Error</p>
                    </div>
                    <div className="error-message">{error}</div>
                    <button onClick={() => navigate('/login')} className="btn btn-primary">
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-header">
                    <h1 className="auth-logo">♪ Symphony</h1>
                    <p className="auth-subtitle">Signing you in with GitHub...</p>
                </div>
                <div className="loading">Please wait...</div>
            </div>
        </div>
    );
}
