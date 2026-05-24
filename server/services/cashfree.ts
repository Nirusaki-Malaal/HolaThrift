import { getEnv } from '../config/env';
import { fetchWithTimeout, readExternalJson, readExternalText } from '../utils/http';
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

interface CashfreeConfig {
  appId: string;
  secretKey: string;
  apiVersion: string;
  mode: CashfreeMode;
  baseUrl: string;
}

const getCashfreeConfig = (): CashfreeConfig => {
  const configuredMode = (getEnv('CASHFREE_ENV') || getEnv('CASHFREE_MODE') || 'production').toLowerCase();
  const mode: CashfreeMode = configuredMode === 'sandbox' ? 'sandbox' : 'production';
  return {
    appId: getEnv('CASHFREE_APP_ID'),
    secretKey: getEnv('CASHFREE_SECRET_KEY'),
    apiVersion: getEnv('CASHFREE_API_VERSION') || '2023-08-01',
    mode,
    baseUrl: mode === 'sandbox' ? 'https://sandbox.cashfree.com/pg' : 'https://api.cashfree.com/pg',
  };
};

export const getCashfreeMode = (): CashfreeMode => getCashfreeConfig().mode;

export const isCashfreeConfigured = (): boolean => {
  const { appId, secretKey } = getCashfreeConfig();
  return Boolean(appId && secretKey);
};

const assertCashfreeConfigured = (): CashfreeConfig => {
  const config = getCashfreeConfig();
  if (!config.appId || !config.secretKey) {
    throw new IntegrationConfigError('Cashfree credentials are not configured. Set CASHFREE_APP_ID and CASHFREE_SECRET_KEY.');
  }
  return config;
};

const getHeaders = (config: CashfreeConfig) => ({
  'x-client-id': config.appId,
  'x-client-secret': config.secretKey,
  'x-api-version': config.apiVersion,
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
  const config = assertCashfreeConfigured();

  const response = await fetchWithTimeout(`${config.baseUrl}/orders`, {
    method: 'POST',
    headers: getHeaders(config),
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
    const errorText = await readExternalText(response);
    if (response.status === 401 || response.status === 403 || errorText.toLowerCase().includes('authentication')) {
      throw new IntegrationConfigError('Cashfree authentication failed. Check CASHFREE_APP_ID, CASHFREE_SECRET_KEY, and CASHFREE_ENV.');
    }
    throw new Error(`Cashfree order creation failed: ${errorText}`);
  }

  return await readExternalJson<CashfreeOrderResponse>(response);
};

export const verifyCashfreePayment = async (orderId: string): Promise<CashfreeOrderStatus> => {
  const config = assertCashfreeConfigured();

  const response = await fetchWithTimeout(`${config.baseUrl}/orders/${orderId}`, {
    method: 'GET',
    headers: getHeaders(config),
  });

  if (!response.ok) {
    const errorText = await readExternalText(response);
    if (response.status === 401 || response.status === 403 || errorText.toLowerCase().includes('authentication')) {
      throw new IntegrationConfigError('Cashfree authentication failed. Check CASHFREE_APP_ID, CASHFREE_SECRET_KEY, and CASHFREE_ENV.');
    }
    throw new Error(`Cashfree payment verification failed: ${errorText}`);
  }

  return await readExternalJson<CashfreeOrderStatus>(response);
};
