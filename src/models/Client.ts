import mongoose from 'mongoose'

const ClientSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 200 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  logo: { type: String },
  contactEmail: { type: String, required: true, trim: true },
  contactPhone: { type: String, trim: true },
  address: { type: String, trim: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

ClientSchema.index({ slug: 1 })
ClientSchema.index({ status: 1 })

export default mongoose.models.Client || mongoose.model('Client', ClientSchema, 'cast_clients')
