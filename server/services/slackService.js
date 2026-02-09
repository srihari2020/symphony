import Integration from '../models/Integration.js';

const SLACK_API = 'https://slack.com/api';

export async function fetchSlackMessages(accessToken, channelId) {
    try {
        const response = await fetch(
            `${SLACK_API}/conversations.history?channel=${channelId}&limit=20`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        );

        const data = await response.json();

        if (!data.ok) return [];

        // Get user info for messages
        const messages = data.messages || [];
        const userIds = [...new Set(messages.map(m => m.user).filter(Boolean))];

        // Fetch user details
        const users = {};
        for (const userId of userIds.slice(0, 10)) {
            try {
                const userRes = await fetch(`${SLACK_API}/users.info?user=${userId}`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                const userData = await userRes.json();
                if (userData.ok) {
                    users[userId] = {
                        name: userData.user.real_name || userData.user.name,
                        avatar: userData.user.profile.image_48
                    };
                }
            } catch (e) {
                // Skip on error
            }
        }

        return messages.map(m => ({
            ts: m.ts,
            text: m.text,
            user: users[m.user] || { name: 'Unknown' },
            date: new Date(parseFloat(m.ts) * 1000).toISOString()
        }));
    } catch (error) {
        console.error('Slack messages fetch error:', error);
        return [];
    }
}

export async function getSlackIntegration(organizationId) {
    return Integration.findOne({ organization: organizationId, type: 'slack' });
}
