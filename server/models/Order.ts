import mongoose, { Schema } from 'mongoose';

const orderSchema = new Schema({
  userEmail: { type: String, required: true },
  items: [
    {
      productId: { type: String },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
    },
  ],
  total: { type: Number, required: true },
  status: { type: String, default: 'completed' },
  transactionId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
export default Order;
