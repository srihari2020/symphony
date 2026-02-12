
const mongoose = require('mongoose');
const Post = require('./server/models/Post');
const User = require('./server/models/User');
require('dotenv').config({ path: './client/.env' }); // Try client .env for API URL but we need MONGO_URI
// Actually we need server .env
require('dotenv').config({ path: './server/.env' });

async function checkAndSeed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const count = await Post.countDocuments();
        console.log(`Current Post Count: ${count}`);

        if (count === 0) {
            console.log('Seeding initial posts...');
            const user = await User.findOne();
            if (!user) {
                console.log('No users found to author posts.');
                process.exit(0);
            }

            await Post.create([
                {
                    author: user._id,
                    content: 'Welcome to the Symphony Community! 🚀',
                    type: 'general',
                    likes: [],
                    comments: []
                },
                {
                    author: user._id,
                    content: 'Looking for a team to build a React app? DM me!',
                    type: 'looking_for_team',
                    likes: [],
                    comments: []
                }
            ]);
            console.log('Seeded 2 posts.');
        } else {
            const posts = await Post.find();
            console.log('Posts found:', posts);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkAndSeed();
