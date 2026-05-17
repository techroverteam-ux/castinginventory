import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 254,
  },
  password: { type: String, required: true, select: false },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'manager', 'viewer'],
    default: 'viewer',
  },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  phone: { type: String, trim: true, maxlength: 20 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

UserSchema.index({ role: 1, status: 1 })
UserSchema.index({ clientId: 1 })

export default mongoose.models.User || mongoose.model('User', UserSchema, 'cast_users')
