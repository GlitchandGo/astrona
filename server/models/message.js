import mongoose from 'mongoose';
const MessageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  threadId: { type: String, required: true, index: true }, // "a:b" sorted user IDs
  senderId: { type: String, required: true },
  recipientId: { type: String, required: true },
  text: String,
  imageUrl: String,
  status: { type: String, enum: ['sent','delivered','seen'], default: 'sent' },
  deleted: { type: Boolean, default: false },
  createdAt: { type: Number, required: true }
});
export default mongoose.model('Message', MessageSchema);
