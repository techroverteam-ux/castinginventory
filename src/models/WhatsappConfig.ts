import mongoose from 'mongoose'

const WhatsappConfigSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, unique: true },
  wabaId: { type: String, trim: true },
  phoneNumberId: { type: String, trim: true },
  accessToken: { type: String, trim: true },
  graphVersion: { type: String, default: 'v25.0', trim: true },
  templateName: { type: String, trim: true },
  templateLanguage: { type: String, default: 'en', trim: true },
  businessName: { type: String, trim: true },
  enabled: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

export default mongoose.models.WhatsappConfig || mongoose.model('WhatsappConfig', WhatsappConfigSchema, 'cast_whatsapp_configs')
