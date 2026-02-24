import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    content: { type: String, required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    type: { type: String, enum: ['text', 'system', 'file'], default: 'text' },
    createdAt: { type: Date, default: Date.now }
});

messageSchema.index({ project: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);
