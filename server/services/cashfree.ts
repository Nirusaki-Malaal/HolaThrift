const appId = process.env.CASHFREE_APP_ID || '';
const secretKey = process.env.CASHFREE_SECRET_KEY || '';
const baseUrl = 'https://api.cashfree.com/pg';

const getHeaders = () => ({
  'x-client-id': appId,
  'x-client-secret': secretKey,
  'x-api-version': '2023-08-01',
  'Content-Type': 'application/json',
  Accept: 'application/json',
});

export const createCashfreeOrder = async (
  orderId: string,
  amount: number,
  email: string,
  phone: string,
  name: string
): Promise<any> => {
  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  const response = await fetch(`${baseUrl}/orders`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      order_id: orderId,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: email.replace(/[@.]/g, '_'),
        customer_email: email,
        customer_phone: cleanPhone || '9999999999',
        customer_name: name || 'Customer',
      },
    }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cashfree order creation failed: ${errorText}`);
  }
  return await response.json();
};

export const verifyCashfreePayment = async (orderId: string): Promise<any> => {
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
