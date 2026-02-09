import Integration from '../models/Integration.js';

const GITHUB_API = 'https://api.github.com';

export async function fetchGitHubPRs(accessToken, repo) {
    try {
        const response = await fetch(`${GITHUB_API}/repos/${repo}/pulls?state=all&per_page=10`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) return [];

        const prs = await response.json();
        return prs.map(pr => ({
            id: pr.id,
            number: pr.number,
            title: pr.title,
            state: pr.state,
            user: { login: pr.user.login, avatar: pr.user.avatar_url },
            createdAt: pr.created_at,
            updatedAt: pr.updated_at,
            url: pr.html_url
        }));
    } catch (error) {
        console.error('GitHub PR fetch error:', error);
        return [];
    }
}

export async function fetchGitHubCommits(accessToken, repo) {
    try {
        const response = await fetch(`${GITHUB_API}/repos/${repo}/commits?per_page=10`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) return [];

        const commits = await response.json();
        return commits.map(c => ({
            sha: c.sha,
            message: c.commit.message,
            author: {
                name: c.commit.author.name,
                avatar: c.author?.avatar_url
            },
            date: c.commit.author.date,
            url: c.html_url
        }));
    } catch (error) {
        console.error('GitHub commits fetch error:', error);
        return [];
    }
}

export async function getGitHubIntegration(organizationId) {
    return Integration.findOne({ organization: organizationId, type: 'github' });
}
