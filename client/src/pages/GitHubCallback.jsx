import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { exchangeGitHubCode } from '../api';

export default function GitHubCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    useEffect(() => {
        const code = searchParams.get('code');
        if (code) {
            exchangeGitHubCode(code)
                .then(() => {
                    navigate('/settings?success=github');
                })
                .catch(err => {
                    setError(err.response?.data?.error || 'Failed to connect GitHub');
                });
        } else {
            setError('No authorization code received');
        }
    }, [searchParams, navigate]);

    if (error) {
        return (
            <div className="callback-page">
                <div className="callback-error">
                    <h2>Connection Failed</h2>
                    <p>{error}</p>
                    <button className="btn btn-primary" onClick={() => navigate('/settings')}>
                        Back to Settings
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="callback-page">
            <div className="callback-loading">
                <div className="spinner"></div>
                <p>Connecting GitHub...</p>
            </div>
        </div>
    );
}
