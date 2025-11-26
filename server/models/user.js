import mongoose from 'mongoose';
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, maxlength: 20 },
  email: { type: String, required: true },
  phone: String,
  number: { type: String, required: true, unique: true }, // '1234-5678'
  passwordHash: { type: String, required: true },
  avatarUrl: String,
  createdAt: { type: Date, default: Date.now }
});
export default mongoose.model('User', UserSchema);
