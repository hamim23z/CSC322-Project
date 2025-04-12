import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  tokens: { type: Number, default: 100 },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
