import mongoose from 'mongoose';

const cacheSchema = new mongoose.Schema({
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    type: { type: String, enum: ['github_prs', 'github_commits', 'slack_messages'], required: true },
    data: { type: mongoose.Schema.Types.Mixed, default: [] },
    lastUpdated: { type: Date, default: Date.now }
});

cacheSchema.index({ project: 1, type: 1 }, { unique: true });

export default mongoose.model('Cache', cacheSchema);
