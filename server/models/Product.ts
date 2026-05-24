import mongoose, { Schema } from 'mongoose';

const productSchema = new Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  size: { type: String, required: true },
  condition: { type: String, required: true },
  image: { type: String, required: true },
  description: { type: String },
});

export const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
export default Product;
