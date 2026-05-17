import mongoose from 'mongoose'

const ItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 200 },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  sku: { type: String, required: true, trim: true, maxlength: 50 },
  quantity: { type: Number, required: true, min: 0, default: 0 },
  weight: { type: Number, min: 0 },
  unit: { type: String, trim: true, maxlength: 20 },
  material: { type: String, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 500 },
  status: {
    type: String,
    enum: ['in_stock', 'low_stock', 'out_of_stock'],
    default: 'in_stock',
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

ItemSchema.index({ clientId: 1, categoryId: 1 })
ItemSchema.index({ sku: 1, clientId: 1 }, { unique: true })
ItemSchema.index({ status: 1 })

export default mongoose.models.Item || mongoose.model('Item', ItemSchema, 'cast_items')
