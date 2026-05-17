import mongoose from 'mongoose'

const WhatsappConfigSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, unique: true },
  // Business profile (client fills for Meta verification)
  businessName: { type: String, trim: true },
  businessPhone: { type: String, trim: true },
  businessEmail: { type: String, trim: true },
  gstNumber: { type: String, trim: true },
  businessAddress: { type: String, trim: true },
  businessCategory: { type: String, default: 'jewellery', trim: true },
  businessWebsite: { type: String, trim: true },
  // Technical config (superadmin fills)
  wabaId: { type: String, trim: true },
  phoneNumberId: { type: String, trim: true },
  accessToken: { type: String, trim: true },
  graphVersion: { type: String, default: 'v25.0', trim: true },
  templateName: { type: String, trim: true },
  templateLanguage: { type: String, default: 'en', trim: true },
  enabled: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

export default mongoose.models.WhatsappConfig || mongoose.model('WhatsappConfig', WhatsappConfigSchema, 'cast_whatsapp_configs')
