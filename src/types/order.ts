export interface OrderItem {
  productId?: string;
  name: string;
  price?: number;
  quantity: number;
}

export interface ShippingAddress {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface OrderRecord {
  _id: string;
  transactionId: string;
  createdAt: string;
  userEmail?: string;
  items: OrderItem[];
  total: number;
  status?: string;
  shippingAddress?: ShippingAddress;
  cashfreeOrderId?: string;
  paymentProvider?: string;
  paymentStatus?: string;
  cashfreeOrderStatus?: string;
  cashfreePaymentSessionId?: string;
  shippingStatus?: string;
  lastTrackingStatus?: string;
  shiprocketOrderId?: string;
  shiprocketShipmentId?: string;
  awbCode?: string;
  courierName?: string;
  estimatedDelivery?: string;
  invoiceUrl?: string;
  invoicePublicId?: string;
  invoiceGeneratedAt?: string;
  invoiceEmailSentAt?: string;
}

export interface TrackingScan {
  date: string;
  location: string;
  activity: string;
}

export interface TrackingPayload {
  awbCode?: string;
  currentStatus?: string;
  courierName?: string;
  estimatedDelivery?: string;
  scans?: TrackingScan[];
}

export interface TrackingResponse {
  tracking?: TrackingPayload;
}
