import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization'
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxLength: 500
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [{
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        content: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    type: {
        type: String,
        enum: ['general', 'achievement', 'hiring', 'looking_for_team'],
        default: 'general'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

postSchema.index({ createdAt: -1 });

export default mongoose.model('Post', postSchema);
