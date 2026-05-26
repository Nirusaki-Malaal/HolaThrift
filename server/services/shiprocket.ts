import { redisClient } from './redis';
import { getEnv } from '../config/env';
import { fetchWithTimeout, readExternalJson, readExternalText } from '../utils/http';
import { IntegrationConfigError } from './integrationError';

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
  raw: unknown;
}

export interface ServiceabilityResult {
  serviceable: boolean;
  courierName: string;
  estimatedDays: string;
  freightCharge: number;
  codAvailable: boolean;
  raw: unknown;
  message?: string;
}

export interface ShiprocketOrderItem {
  productId?: string;
  name: string;
  price: number;
  quantity: number;
}

export interface ShiprocketShippingAddress {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface ShiprocketCredentials {
  email: string;
  password: string;
}

const getShiprocketCredentials = (): ShiprocketCredentials => ({
  email: getEnv('SHIPROCKET_EMAIL'),
  password: getEnv('SHIPROCKET_API_KEY') || getEnv('SHIPROCKET_PASSWORD'),
});

export const isShiprocketConfigured = (): boolean => {
  const { email, password } = getShiprocketCredentials();
  return Boolean(email && password);
};

const assertShiprocketConfigured = (): ShiprocketCredentials => {
  const credentials = getShiprocketCredentials();
  if (!credentials.email || !credentials.password) {
    throw new IntegrationConfigError('Shiprocket credentials are not configured. Set SHIPROCKET_EMAIL and SHIPROCKET_API_KEY.');
  }
  return credentials;
};

export const getShiprocketToken = async (): Promise<string> => {
  const credentials = assertShiprocketConfigured();

  if (redisClient.isOpen) {
    const cached = await redisClient.get(tokenCacheKey);
    if (cached) return cached;
  }

  const response = await fetchWithTimeout(`${baseUrl}/v1/external/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errText = await readExternalText(response);
    if (response.status === 401 || response.status === 403 || response.status === 422 || errText.toLowerCase().includes('login detail incorrect')) {
      throw new IntegrationConfigError('Shiprocket authentication failed. Check SHIPROCKET_EMAIL and SHIPROCKET_API_KEY.');
    }
    throw new Error(`Shiprocket auth failed: ${errText}`);
  }

  const data = await readExternalJson<{ token?: string }>(response);
  const token = data?.token;
  if (!token) throw new Error('Shiprocket auth response did not include a token');
  if (redisClient.isOpen && token) {
    await redisClient.setEx(tokenCacheKey, 828000, token);
  }
  return token;
};

const getPackageNumber = (key: string, fallback: number): number => {
  const value = Number(getEnv(key));
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

const asRecord = (value: unknown): Record<string, unknown> => {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
};

const asRecordArray = (value: unknown): Array<Record<string, unknown>> => {
  return Array.isArray(value) ? value.map(asRecord) : [];
};

export const createShiprocketOrder = async (
  orderId: string,
  total: number,
  items: ShiprocketOrderItem[],
  shippingAddress: ShiprocketShippingAddress,
  paymentMethod: 'Prepaid' | 'COD' = 'Prepaid'
): Promise<Record<string, unknown>> => {
  const token = await getShiprocketToken();
  const { firstName, lastName } = getCustomerName(shippingAddress.name);

  const orderItems = items.map((item) => ({
    name: item.name,
    sku: item.productId || 'SKU_GENERIC',
    units: item.quantity || 1,
    selling_price: Number(item.price),
  }));

  const response = await fetchWithTimeout(`${baseUrl}/v1/external/orders/create/adhoc`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      order_id: orderId,
      order_date: formatOrderDate(),
      pickup_location: getEnv('SHIPROCKET_PICKUP_LOCATION') || 'Primary',
      channel_id: getEnv('SHIPROCKET_CHANNEL_ID'),
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
      payment_method: paymentMethod,
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
    const errText = await readExternalText(response);
    throw new Error(`Shiprocket order creation failed: ${errText}`);
  }

  return await readExternalJson<Record<string, unknown>>(response);
};

export const normalizeShiprocketTracking = (data: unknown): NormalizedTracking => {
  const root = asRecord(data);
  const trackingData = asRecord(root.tracking_data || data);
  const shipmentTrack = trackingData.shipment_track;
  const track = Array.isArray(shipmentTrack) ? asRecord(shipmentTrack[0]) : asRecord(shipmentTrack);
  const scans = asRecordArray(track.scans || trackingData.shipment_track_activities);

  return {
    awbCode: String(track?.awb_code || trackingData?.awb_code || ''),
    courierName: String(track?.courier_name || trackingData?.courier_name || 'Shiprocket'),
    currentStatus: String(track?.current_status || trackingData?.shipment_status || trackingData?.status || 'Processing'),
    deliveredDate: String(track?.delivered_date || ''),
    estimatedDelivery: String(track?.edd || trackingData?.edd || ''),
    scans: scans.map((scan) => ({
      date: String(scan.date || scan.scan_date_time || ''),
      location: String(scan.location || scan.scan_location || ''),
      activity: String(scan.activity || scan.status || scan.scan || 'Shipment update'),
    })),
    raw: data,
  };
};

const fetchTracking = async (endpoint: string): Promise<unknown> => {
  const token = await getShiprocketToken();
  const response = await fetchWithTimeout(`${baseUrl}${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errText = await readExternalText(response);
    throw new Error(`Shiprocket tracking failed: ${errText}`);
  }

  return await readExternalJson(response);
};

export const checkServiceability = async (deliveryPincode: string, isCod: boolean = false): Promise<ServiceabilityResult> => {
  if (!isShiprocketConfigured()) {
    return {
      serviceable: true,
      courierName: 'Shiprocket',
      estimatedDays: '',
      freightCharge: 0,
      codAvailable: false,
      raw: null,
      message: 'Delivery serviceability will be confirmed during order processing.',
    };
  }

  const token = await getShiprocketToken();
  const pickupPostcode = getEnv('SHIPROCKET_PICKUP_PINCODE');
  if (!pickupPostcode) {
    return {
      serviceable: true,
      courierName: 'Shiprocket',
      estimatedDays: '',
      freightCharge: 0,
      codAvailable: false,
      raw: null,
      message: 'Pickup PIN code is not configured. Delivery will be confirmed manually.',
    };
  }
  const params = new URLSearchParams({
    pickup_postcode: pickupPostcode,
    delivery_postcode: deliveryPincode,
    cod: isCod ? '1' : '0',
    weight: getPackageNumber('SHIPROCKET_PACKAGE_WEIGHT_KG', 0.5).toString(),
  });

  const response = await fetchWithTimeout(`${baseUrl}/v1/external/courier/serviceability/?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errText = await readExternalText(response);
    throw new Error(`Shiprocket serviceability failed: ${errText}`);
  }

  const data = await readExternalJson(response);
  const root = asRecord(data);
  const serviceData = asRecord(root.data);
  const couriers = asRecordArray(serviceData.available_courier_companies);
  const preferredCourier = couriers[0] || {};

  return {
    serviceable: couriers.length > 0,
    courierName: String(preferredCourier.courier_name || ''),
    estimatedDays: String(preferredCourier.estimated_delivery_days || preferredCourier.etd || ''),
    freightCharge: Number(preferredCourier.freight_charge || 0),
    codAvailable: couriers.some((c) => Number(c.cod) === 1),
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
