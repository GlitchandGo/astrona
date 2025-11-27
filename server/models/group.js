import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    default: 'Group'
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  memberIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Optional: add indexes for faster lookups
groupSchema.index({ ownerId: 1 });
groupSchema.index({ memberIds: 1 });

const Group = mongoose.model('Group', groupSchema);

export default Group;
