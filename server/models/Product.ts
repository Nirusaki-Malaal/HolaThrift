import mongoose, { Schema } from 'mongoose';

const productSchema = new Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  size: { type: String, required: true },
  condition: { type: String, required: true },
  image: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['available', 'reserved', 'sold'], default: 'available' },
});

export const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
export default Product;
