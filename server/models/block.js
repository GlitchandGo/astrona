import mongoose from 'mongoose';
const BlockSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  blockedId: { type: String, required: true, index: true }
}, { timestamps: true });
BlockSchema.index({ userId: 1, blockedId: 1 }, { unique: true });
export default mongoose.model('Block', BlockSchema);
