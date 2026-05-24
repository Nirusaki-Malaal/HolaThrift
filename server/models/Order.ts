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
  shippingAddress: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
  },
  cashfreeOrderId: { type: String },
  paymentProvider: { type: String, default: 'Cashfree' },
  paymentStatus: { type: String, default: 'PAID' },
  cashfreeOrderStatus: { type: String },
  cashfreePaymentSessionId: { type: String },
  shiprocketOrderId: { type: String },
  shiprocketShipmentId: { type: String },
  awbCode: { type: String },
  courierName: { type: String },
  estimatedDelivery: { type: String },
  invoiceUrl: { type: String },
  invoicePublicId: { type: String },
  invoiceGeneratedAt: { type: Date },
  invoiceEmailSentAt: { type: Date },
  lastTrackingStatus: { type: String },
  lastTrackingSyncAt: { type: Date },
  shippingStatus: { type: String, default: 'Created' },
  adminNote: { type: String },
  adminUpdatedAt: { type: Date },
  adminUpdatedBy: { type: String },
  cancellationReason: { type: String },
  cancelledAt: { type: Date },
  cancelledBy: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
export default Order;
