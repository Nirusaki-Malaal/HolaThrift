import { getEnv } from '../config/env';
import { IntegrationConfigError } from './integrationError';

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

const appId = getEnv('CASHFREE_APP_ID');
const secretKey = getEnv('CASHFREE_SECRET_KEY');
const apiVersion = getEnv('CASHFREE_API_VERSION') || '2023-08-01';
const configuredMode = (getEnv('CASHFREE_ENV') || getEnv('CASHFREE_MODE') || 'production').toLowerCase();
const mode: CashfreeMode = configuredMode === 'sandbox' ? 'sandbox' : 'production';
const baseUrl = mode === 'sandbox' ? 'https://sandbox.cashfree.com/pg' : 'https://api.cashfree.com/pg';

export const getCashfreeMode = (): CashfreeMode => mode;

export const isCashfreeConfigured = (): boolean => Boolean(appId && secretKey);

const assertCashfreeConfigured = (): void => {
  if (!isCashfreeConfigured()) {
    throw new IntegrationConfigError('Cashfree credentials are not configured. Set CASHFREE_APP_ID and CASHFREE_SECRET_KEY.');
  }
};

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
  const returnUrl = getEnv('CASHFREE_RETURN_URL') || `${getEnv('PUBLIC_SITE_URL') || 'https://holathrift.in'}/?order_id=${orderId}`;
  const notifyUrl = getEnv('CASHFREE_NOTIFY_URL');

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
  assertCashfreeConfigured();

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
    if (response.status === 401 || response.status === 403 || errorText.toLowerCase().includes('authentication')) {
      throw new IntegrationConfigError('Cashfree authentication failed. Check CASHFREE_APP_ID, CASHFREE_SECRET_KEY, and CASHFREE_ENV.');
    }
    throw new Error(`Cashfree order creation failed: ${errorText}`);
  }

  return await response.json();
};

export const verifyCashfreePayment = async (orderId: string): Promise<CashfreeOrderStatus> => {
  assertCashfreeConfigured();

  const response = await fetch(`${baseUrl}/orders/${orderId}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401 || response.status === 403 || errorText.toLowerCase().includes('authentication')) {
      throw new IntegrationConfigError('Cashfree authentication failed. Check CASHFREE_APP_ID, CASHFREE_SECRET_KEY, and CASHFREE_ENV.');
    }
    throw new Error(`Cashfree payment verification failed: ${errorText}`);
  }

  return await response.json();
};
