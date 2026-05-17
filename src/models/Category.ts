import mongoose from 'mongoose'

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 500 },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

CategorySchema.index({ clientId: 1, status: 1 })

export default mongoose.models.Category || mongoose.model('Category', CategorySchema)
