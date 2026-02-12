
import fetch from 'node-fetch';

export const fetchDevToPosts = async (tag = 'career') => {
    try {
        const headers = {};
        if (process.env.DEV_TO_API_KEY) {
            headers['api-key'] = process.env.DEV_TO_API_KEY;
        }

        const response = await fetch(`https://dev.to/api/articles?tag=${tag}&top=1&per_page=10`, { headers });
        if (!response.ok) {
            // Log error but verify structure
            const errText = await response.text();
            console.error('Dev.to API Error:', response.status, errText);
            throw new Error(`Failed to fetch from Dev.to: ${response.status}`);
        }
        const data = await response.json();

        return data.map(article => ({
            _id: `devto-${article.id}`,
            author: {
                name: article.user.name,
                avatar: article.user.profile_image_90
            },
            content: article.title + ' - ' + article.description,
            type: determineType(tag),
            likes: new Array(article.positive_reactions_count).fill('mock_id'), // Mock length for UI
            comments: new Array(article.comments_count).fill('mock_id'),
            createdAt: new Date(article.published_at),
            externalLink: article.url,
            source: 'Dev.to'
        }));
    } catch (error) {
        console.error('External API Error:', error);
        // Fallback to Mock Data to verify Backend->Frontend connection
        return [
            {
                _id: 'mock-1',
                author: { name: 'System Bot', avatar: '' },
                content: 'This is a test post to verify the Server connection. If you see this, your App is working! 🚀',
                type: 'general',
                likes: [],
                comments: [],
                createdAt: new Date(),
                source: 'System'
            },
            {
                _id: 'mock-2',
                author: { name: 'Debugger', avatar: '' },
                content: 'Dev.to integration seems to be having trouble, but the Symphony Backend is online.',
                type: 'career',
                likes: [],
                comments: [],
                createdAt: new Date(Date.now() - 86400000),
                source: 'System'
            }
        ];
    }
};

export const fetchRandomUsers = async (count = 5) => {
    try {
        const response = await fetch(`https://randomuser.me/api/?results=${count}&inc=name,picture,email,login`);
        if (!response.ok) throw new Error('Failed to fetch from RandomUser.me');
        const data = await response.json();

        return data.results.map(u => ({
            _id: `ru-${u.login.uuid}`,
            name: `${u.name.first} ${u.name.last}`,
            email: u.email,
            avatar: u.picture.medium,
            role: 'Candidate', // Default role
            source: 'RandomUser'
        }));
    } catch (error) {
        console.error('External API Error:', error);
        return [];
    }
};

const determineType = (tag) => {
    if (tag === 'career' || tag === 'hiring') return 'hiring';
    if (tag === 'discuss') return 'general';
    return 'general';
};
