import mongoose from 'mongoose';

const integrationSchema = new mongoose.Schema({
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    type: { type: String, enum: ['github', 'slack'], required: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String },
    expiresAt: { type: Date },
    metadata: { type: mongoose.Schema.Types.Mixed }, // For additional data like team info
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

integrationSchema.index({ organization: 1, type: 1 }, { unique: true });

export default mongoose.model('Integration', integrationSchema);
