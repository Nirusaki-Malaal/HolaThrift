export type CashfreeMode = 'sandbox' | 'production';

export interface CashfreeOrderResponse {
  payment_session_id?: string;
  order_expiry_time?: string;
  [key: string]: unknown;
}

export interface CashfreeOrderStatus {
  order_status?: string;
  [key: string]: unknown;
}

const appId = process.env.CASHFREE_APP_ID || '';
const secretKey = process.env.CASHFREE_SECRET_KEY || '';
const apiVersion = process.env.CASHFREE_API_VERSION || '2023-08-01';
const configuredMode = (process.env.CASHFREE_ENV || process.env.CASHFREE_MODE || 'production').toLowerCase();
const mode: CashfreeMode = configuredMode === 'sandbox' ? 'sandbox' : 'production';
const baseUrl = mode === 'sandbox' ? 'https://sandbox.cashfree.com/pg' : 'https://api.cashfree.com/pg';

export const getCashfreeMode = (): CashfreeMode => mode;

const getHeaders = () => ({
  'x-client-id': appId,
  'x-client-secret': secretKey,
  'x-api-version': apiVersion,
  'Content-Type': 'application/json',
  Accept: 'application/json',
});

const cleanPhoneNumber = (phone: string): string => {
  return phone.replace(/\D/g, '').slice(-10) || '9999999999';
};

const getOrderMeta = (orderId: string) => {
  const returnUrl = process.env.CASHFREE_RETURN_URL || `${process.env.PUBLIC_SITE_URL || 'https://holathrift.in'}/?order_id=${orderId}`;
  const notifyUrl = process.env.CASHFREE_NOTIFY_URL || '';

  return {
    return_url: returnUrl,
    ...(notifyUrl ? { notify_url: notifyUrl } : {}),
  };
};

export const createCashfreeOrder = async (
  orderId: string,
  amount: number,
  email: string,
  phone: string,
  name: string
): Promise<CashfreeOrderResponse> => {
  const response = await fetch(`${baseUrl}/orders`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      order_id: orderId,
      order_amount: amount,
      order_currency: 'INR',
      order_note: 'HolaThrift archive checkout',
      customer_details: {
        customer_id: email.replace(/[@.]/g, '_'),
        customer_email: email,
        customer_phone: cleanPhoneNumber(phone),
        customer_name: name || 'Customer',
      },
      order_meta: getOrderMeta(orderId),
      order_tags: {
        brand: 'HolaThrift',
        source: 'web_checkout',
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cashfree order creation failed: ${errorText}`);
  }

  return await response.json();
};

export const verifyCashfreePayment = async (orderId: string): Promise<CashfreeOrderStatus> => {
  const response = await fetch(`${baseUrl}/orders/${orderId}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cashfree payment verification failed: ${errorText}`);
  }

  return await response.json();
};
