import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    githubRepo: { type: String }, // e.g., "owner/repo"
    slackChannel: { type: String },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Project', projectSchema);
