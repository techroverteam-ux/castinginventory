import mongoose from 'mongoose'

// Dynamic rate slabs - each client defines their own rules
// e.g., [{minQty: 1, rate: 20}, {minQty: 20, rate: 18}, {minQty: 50, rate: 15}]
const RateSlabSchema = new mongoose.Schema({
  minQty: { type: Number, required: true, min: 0 },
  rate: { type: Number, required: true, min: 0 },
}, { _id: false })

const ProductSchema = new mongoose.Schema({
  code: { type: Number, required: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  rateSlabs: { type: [RateSlabSchema], default: [{ minQty: 1, rate: 0 }] },
  remarks: { type: String, trim: true, maxlength: 500 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

ProductSchema.index({ clientId: 1, code: 1 }, { unique: true })

export default mongoose.models.Product || mongoose.model('Product', ProductSchema, 'cast_products')
