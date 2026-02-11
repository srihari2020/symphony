import mongoose from 'mongoose';

const organizationMemberSchema = new mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        enum: ['owner', 'admin', 'member'],
        default: 'member'
    },
    joinedAt: {
        type: Date,
        default: Date.now
    },
    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

// Ensure a user can only have one membership per organization
organizationMemberSchema.index({ organization: 1, user: 1 }, { unique: true });

export default mongoose.model('OrganizationMember', organizationMemberSchema);
