import { redisClient } from './redis';

const email = process.env.SHIPROCKET_EMAIL || '';
const password = process.env.SHIPROCKET_API_KEY || '';
const baseUrl = 'https://apiv2.shiprocket.in';

export const getShiprocketToken = async (): Promise<string> => {
  if (redisClient.isOpen) {
    const cached = await redisClient.get('shiprocket:token');
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
    await redisClient.setEx('shiprocket:token', 828000, token);
  }
  return token;
};

export const createShiprocketOrder = async (
  orderId: string,
  total: number,
  items: any[],
  shippingAddress: any
): Promise<any> => {
  const token = await getShiprocketToken();
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const formattedDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const nameParts = shippingAddress.name.trim().split(/\s+/);
  const firstName = nameParts[0] || 'Customer';
  const lastName = nameParts.slice(1).join(' ') || 'Thrift';

  const orderItems = items.map((item) => ({
    name: item.name,
    sku: item.productId || 'SKU_GENERIC',
    units: item.quantity || 1,
    selling_price: item.price.toString(),
  }));

  const response = await fetch(`${baseUrl}/v1/external/orders/create/adhoc`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      order_id: orderId,
      order_date: formattedDate,
      pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary',
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
      length: 10,
      breadth: 10,
      height: 10,
      weight: 0.5,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Shiprocket order creation failed: ${errText}`);
  }
  return await response.json();
};

export const trackShipment = async (shipmentId: string): Promise<any> => {
  const token = await getShiprocketToken();
  const response = await fetch(`${baseUrl}/v1/external/courier/track/shipment/${shipmentId}`, {
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
