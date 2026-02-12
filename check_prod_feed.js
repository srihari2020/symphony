
const fetch = require('node-fetch');

const API_URL = 'https://symphony-backend-p1li.onrender.com/api';

async function testFeed() {
    try {
        // 1. Signup/Login to get token
        console.log('Authenticating...');
        const authRes = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Debug Bot',
                email: `debug_${Date.now()}@example.com`,
                password: 'password123'
            })
        });

        const authData = await authRes.json();
        const token = authData.token;
        if (!token) {
            console.error('Auth failed:', authData);
            return;
        }
        console.log('Got Token:', token.substring(0, 10) + '...');

        // 2. Fetch Posts
        console.log('Fetching Posts...');
        const postsRes = await fetch(`${API_URL}/posts`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!postsRes.ok) {
            console.error('Fetch failed:', postsRes.status, await postsRes.text());
            return;
        }

        const posts = await postsRes.json();
        console.log('Posts Count:', posts.length);
        if (posts.length > 0) {
            console.log('First Post:', posts[0].title || posts[0].content);
            console.log('Source:', posts[0].source);
        } else {
            console.log('Feed is empty.');
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

testFeed();
