import mongoose from 'mongoose'

const PartySchema = new mongoose.Schema({
  code: { type: String, required: true, trim: true, maxlength: 20 },
  name: { type: String, required: true, trim: true, maxlength: 200 },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  accountHead: {
    type: String,
    enum: ['sundry_debtors', 'sundry_creditors', 'purchase_account', 'sales_account', 'cash_in_hand', 'bank_accounts', 'direct_expenses', 'indirect_expenses', 'capital_account', 'profit_loss'],
    default: 'sundry_debtors',
  },
  address: { type: String, trim: true, maxlength: 500 },
  phone: { type: String, trim: true, maxlength: 15 },
  gstin: { type: String, trim: true, maxlength: 15 },
  openingBalance: { type: Number, default: 0 },
  balanceType: { type: String, enum: ['Dr', 'Cr'], default: 'Dr' },
  currentBalance: { type: Number, default: 0 },
  currentBalanceType: { type: String, enum: ['Dr', 'Cr'], default: 'Dr' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

PartySchema.index({ clientId: 1, code: 1 }, { unique: true })
PartySchema.index({ clientId: 1, name: 1 })
PartySchema.index({ clientId: 1, accountHead: 1 })

export default mongoose.models.Party || mongoose.model('Party', PartySchema, 'cast_parties')
