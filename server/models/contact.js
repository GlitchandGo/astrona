import mongoose from 'mongoose';
const ContactSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  contactId: { type: String, required: true, index: true }
}, { timestamps: true });
ContactSchema.index({ userId: 1, contactId: 1 }, { unique: true });
export default mongoose.model('Contact', ContactSchema);
