import mongoose, { Schema } from 'mongoose';

const productSchema = new Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  size: { type: String, required: true },
  stock: { type: Number, required: true, min: 0, default: 1 },
  reservedStock: { type: Number, min: 0, default: 0 },
  condition: { type: String, default: '' },
  image: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['available', 'reserved', 'sold'], default: 'available' },
});

export const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
export default Product;
