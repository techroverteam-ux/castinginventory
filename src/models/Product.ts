import mongoose from 'mongoose'

const ProductSchema = new mongoose.Schema({
  code: { type: String, required: true, trim: true, maxlength: 20 },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  rates: {
    main: { type: Number, default: 0 },
    above20: { type: Number, default: 0 },
    above50: { type: Number, default: 0 },
  },
  remarks: { type: String, trim: true, maxlength: 500 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

ProductSchema.index({ clientId: 1, code: 1 }, { unique: true })
ProductSchema.index({ clientId: 1, status: 1 })

export default mongoose.models.Product || mongoose.model('Product', ProductSchema, 'cast_products')
