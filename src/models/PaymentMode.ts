import mongoose from 'mongoose'

const PaymentModeSchema = new mongoose.Schema({
  code: { type: Number, required: true },
  name: { type: String, required: true, trim: true, maxlength: 50 },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

PaymentModeSchema.index({ clientId: 1, code: 1 }, { unique: true })

export default mongoose.models.PaymentMode || mongoose.model('PaymentMode', PaymentModeSchema, 'cast_payment_modes')
