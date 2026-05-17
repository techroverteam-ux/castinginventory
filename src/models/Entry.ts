import mongoose from 'mongoose'

const EntrySchema = new mongoose.Schema({
  recNo: { type: Number, required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  date: { type: Date, required: true, default: Date.now },
  paymentModeId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentMode', required: true },
  partyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Party', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  pcs: { type: Number, required: true, min: 1 },
  rate: { type: Number, required: true, min: 0 },
  amount: { type: Number, required: true, min: 0 },
  cashAmount: { type: Number, default: 0, min: 0 },
  upiAmount: { type: Number, default: 0, min: 0 },
  creditAmount: { type: Number, default: 0, min: 0 },
  jobworkerCode: { type: String, trim: true },
  remarks: { type: String, trim: true, maxlength: 500 },
  netBalance: { type: Number, default: 0 },
  netBalanceType: { type: String, enum: ['Dr', 'Cr'], default: 'Dr' },
  whatsappSent: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'deleted'], default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

EntrySchema.index({ clientId: 1, recNo: 1 }, { unique: true })
EntrySchema.index({ clientId: 1, date: -1 })
EntrySchema.index({ clientId: 1, partyId: 1 })

export default mongoose.models.Entry || mongoose.model('Entry', EntrySchema, 'cast_entries')
