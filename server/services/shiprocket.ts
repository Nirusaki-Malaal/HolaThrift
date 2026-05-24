import { redisClient } from './redis';

const email = process.env.SHIPROCKET_EMAIL || '';
const password = process.env.SHIPROCKET_API_KEY || process.env.SHIPROCKET_PASSWORD || '';
const baseUrl = 'https://apiv2.shiprocket.in';
const tokenCacheKey = 'shiprocket:token';

export interface NormalizedTrackingScan {
  date: string;
  location: string;
  activity: string;
}

export interface NormalizedTracking {
  awbCode: string;
  courierName: string;
  currentStatus: string;
  deliveredDate: string;
  estimatedDelivery: string;
  scans: NormalizedTrackingScan[];
  raw: any;
}

export interface ServiceabilityResult {
  serviceable: boolean;
  courierName: string;
  estimatedDays: string;
  freightCharge: number;
  raw: any;
}

export const getShiprocketToken = async (): Promise<string> => {
  if (redisClient.isOpen) {
    const cached = await redisClient.get(tokenCacheKey);
    if (cached) return cached;
  }

  const response = await fetch(`${baseUrl}/v1/external/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Shiprocket auth failed: ${errText}`);
  }

  const data = await response.json();
  const token = data.token;
  if (redisClient.isOpen && token) {
    await redisClient.setEx(tokenCacheKey, 828000, token);
  }
  return token;
};

const getPackageNumber = (key: string, fallback: number): number => {
  const value = Number(process.env[key]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const formatOrderDate = (): string => {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

const getCustomerName = (name: string): { firstName: string; lastName: string } => {
  const nameParts = name.trim().split(/\s+/);
  return {
    firstName: nameParts[0] || 'Customer',
    lastName: nameParts.slice(1).join(' ') || 'Thrift',
  };
};

export const createShiprocketOrder = async (
  orderId: string,
  total: number,
  items: any[],
  shippingAddress: any
): Promise<any> => {
  const token = await getShiprocketToken();
  const { firstName, lastName } = getCustomerName(shippingAddress.name);

  const orderItems = items.map((item) => ({
    name: item.name,
    sku: item.productId || 'SKU_GENERIC',
    units: item.quantity || 1,
    selling_price: Number(item.price).toString(),
  }));

  const response = await fetch(`${baseUrl}/v1/external/orders/create/adhoc`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      order_id: orderId,
      order_date: formatOrderDate(),
      pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary',
      channel_id: process.env.SHIPROCKET_CHANNEL_ID || '',
      billing_customer_name: firstName,
      billing_last_name: lastName,
      billing_address: shippingAddress.address,
      billing_city: shippingAddress.city,
      billing_pincode: shippingAddress.pincode,
      billing_state: shippingAddress.state,
      billing_country: 'India',
      billing_email: shippingAddress.email,
      billing_phone: shippingAddress.phone.replace(/\D/g, '').slice(-10),
      shipping_is_billing: true,
      order_items: orderItems,
      payment_method: 'Prepaid',
      sub_total: total,
      shipping_charges: 0,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: 0,
      length: getPackageNumber('SHIPROCKET_PACKAGE_LENGTH_CM', 10),
      breadth: getPackageNumber('SHIPROCKET_PACKAGE_BREADTH_CM', 10),
      height: getPackageNumber('SHIPROCKET_PACKAGE_HEIGHT_CM', 10),
      weight: getPackageNumber('SHIPROCKET_PACKAGE_WEIGHT_KG', 0.5),
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Shiprocket order creation failed: ${errText}`);
  }

  return await response.json();
};

export const normalizeShiprocketTracking = (data: any): NormalizedTracking => {
  const trackingData = data?.tracking_data || data;
  const track = trackingData?.shipment_track?.[0] || trackingData?.shipment_track || {};
  const scans = track?.scans || trackingData?.shipment_track_activities || [];

  return {
    awbCode: String(track?.awb_code || trackingData?.awb_code || ''),
    courierName: String(track?.courier_name || trackingData?.courier_name || 'Shiprocket'),
    currentStatus: String(track?.current_status || trackingData?.shipment_status || trackingData?.status || 'Processing'),
    deliveredDate: String(track?.delivered_date || ''),
    estimatedDelivery: String(track?.edd || trackingData?.edd || ''),
    scans: scans.map((scan: any) => ({
      date: String(scan.date || scan.scan_date_time || ''),
      location: String(scan.location || scan.scan_location || ''),
      activity: String(scan.activity || scan.status || scan.scan || 'Shipment update'),
    })),
    raw: data,
  };
};

const fetchTracking = async (endpoint: string): Promise<any> => {
  const token = await getShiprocketToken();
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Shiprocket tracking failed: ${errText}`);
  }

  return await response.json();
};

export const checkServiceability = async (deliveryPincode: string): Promise<ServiceabilityResult> => {
  const token = await getShiprocketToken();
  const pickupPostcode = process.env.SHIPROCKET_PICKUP_PINCODE || '';
  const params = new URLSearchParams({
    pickup_postcode: pickupPostcode,
    delivery_postcode: deliveryPincode,
    cod: '0',
    weight: getPackageNumber('SHIPROCKET_PACKAGE_WEIGHT_KG', 0.5).toString(),
  });

  const response = await fetch(`${baseUrl}/v1/external/courier/serviceability/?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Shiprocket serviceability failed: ${errText}`);
  }

  const data = await response.json();
  const couriers = data?.data?.available_courier_companies || [];
  const preferredCourier = couriers[0] || {};

  return {
    serviceable: couriers.length > 0,
    courierName: String(preferredCourier.courier_name || ''),
    estimatedDays: String(preferredCourier.estimated_delivery_days || preferredCourier.etd || ''),
    freightCharge: Number(preferredCourier.freight_charge || 0),
    raw: data,
  };
};

export const trackShipment = async (shipmentId: string): Promise<NormalizedTracking> => {
  const data = await fetchTracking(`/v1/external/courier/track/shipment/${shipmentId}`);
  return normalizeShiprocketTracking(data);
};

export const trackAwb = async (awbCode: string): Promise<NormalizedTracking> => {
  const data = await fetchTracking(`/v1/external/courier/track/awb/${awbCode}`);
  return normalizeShiprocketTracking(data);
};
