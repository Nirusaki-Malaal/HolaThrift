import { Router, Request, Response } from 'express';
import Order from '../models/Order';
import Product from '../models/Product';
import { cacheSession, getCachedSession, deleteCachedSession, acquireLock, releaseLock, redisClient } from '../services/redis';
import { createCashfreeOrder, getCashfreeMode, isCashfreeConfigured, verifyCashfreePayment } from '../services/cashfree';
import { checkServiceability, createShiprocketOrder, trackAwb, trackShipment } from '../services/shiprocket';
import { getAvailableStockCount, getReservedStockCount, getStockCount, normalizeInventory } from '../services/inventory';
import { createAndUploadInvoice } from '../services/invoice';
import { sendOrderInvoiceEmail } from '../services/mail';
import { isIntegrationConfigError } from '../services/integrationError';
import { getRequestSession, isAdminRequest } from '../utils/auth';
import { cleanEmail, cleanLongText, cleanPhone, cleanText, isRecord, isValidEmail, isValidObjectId } from '../utils/validation';
import { adminMutationRateLimit, checkoutRateLimit, serviceabilityRateLimit, trackingRateLimit } from '../middleware/rateLimits';
import type { UserSession } from '../utils/auth';

const router = Router();

const reservationTtlSeconds = 900;
const maxOrderItems = 20;
const maxOrderQuantity = 20;
const cashfreeOrderIdPattern = /^HT_\d{13}_[A-Z0-9]{4}$/;
const orderStatuses = new Set(['completed', 'processing', 'cancelled', 'on-hold']);
const paymentStatuses = new Set(['PAID', 'PENDING', 'FAILED', 'CANCELLED', 'REFUND_PENDING', 'REFUNDED']);

interface IncomingOrderItem {
  productId: string;
  name?: string;
  quantity?: number;
}

interface VerifiedOrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface ReservedOrderItem {
  productId: string;
  quantity: number;
}

interface OrderReservation {
  userEmail: string;
  items: VerifiedOrderItem[];
  total: number;
  shippingAddress: ShippingAddress;
  createdAt: string;
}

interface ShippingAddress {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface AdminOrderUpdate {
  status?: string;
  paymentStatus?: string;
  shippingStatus?: string;
  courierName?: string;
  awbCode?: string;
  estimatedDelivery?: string;
  adminNote?: string;
  cancellationReason?: string;
}

const getSessionUser = async (req: Request): Promise<UserSession | null> => getRequestSession(req);

class RequestValidationError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

const getReservationExpiry = (): string => {
  return new Date(Date.now() + reservationTtlSeconds * 1000).toISOString();
};

const getVerifiedItems = async (items: IncomingOrderItem[]): Promise<{ verifiedItems: VerifiedOrderItem[]; total: number }> => {
  if (items.length > maxOrderItems) throw new RequestValidationError(`A maximum of ${maxOrderItems} items can be ordered at once.`);
  const verifiedItems: VerifiedOrderItem[] = [];
  let total = 0;

  for (const item of items) {
    if (!isRecord(item) || !isValidObjectId(item.productId)) {
      throw new RequestValidationError('Valid order items are required.');
    }
    const quantity = Math.floor(Number(item.quantity || 1));
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > maxOrderQuantity) {
      throw new RequestValidationError(`Item quantity must be between 1 and ${maxOrderQuantity}.`);
    }
    const product = await Product.findById(item.productId);
    if (!product) throw new RequestValidationError(`"${item.name || 'Item'}" was not found.`, 404);
    verifiedItems.push({
      productId: product._id.toString(),
      name: product.name,
      price: product.price,
      quantity,
    });
    total += product.price * quantity;
  }

  return { verifiedItems, total };
};

const normalizeShippingAddress = (value: unknown): ShippingAddress | null => {
  if (!isRecord(value)) return null;
  const address = {
    name: cleanText(value.name, 80),
    phone: cleanPhone(value.phone),
    email: cleanEmail(value.email),
    address: cleanLongText(value.address, 180),
    city: cleanText(value.city, 80),
    state: cleanText(value.state, 80),
    pincode: cleanText(value.pincode, 12).replace(/\D/g, '').slice(0, 6),
  };
  if (!address.name || address.phone.length !== 10 || !isValidEmail(address.email) || !address.address || !address.city || !address.state || address.pincode.length !== 6) {
    return null;
  }
  return address;
};

const getStringField = (value: Record<string, unknown> | null, key: string): string => {
  const field = value?.[key];
  return field ? String(field) : '';
};

const toReservedOrderItems = (items: VerifiedOrderItem[]): ReservedOrderItem[] => {
  return items.map((item) => ({ productId: item.productId, quantity: item.quantity }));
};

const parseReservedOrderItems = (value: string | null, fallbackItems: VerifiedOrderItem[]): ReservedOrderItem[] => {
  if (!value) return toReservedOrderItems(fallbackItems);
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return toReservedOrderItems(fallbackItems);
    return parsed
      .map((item) => {
        if (typeof item === 'string') return { productId: item, quantity: 1 };
        return {
          productId: String(item.productId || ''),
          quantity: Math.max(1, Number(item.quantity || 1)),
        };
      })
      .filter((item) => item.productId);
  } catch {
    return toReservedOrderItems(fallbackItems);
  }
};

const releaseReservedProducts = async (items: ReservedOrderItem[]): Promise<void> => {
  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) continue;
    const current = product.toObject();
    const nextReservedStock = Math.max(0, getReservedStockCount(current) - item.quantity);
    const inventory = normalizeInventory({ ...current, reservedStock: nextReservedStock });
    await Product.findByIdAndUpdate(item.productId, inventory);
    if (redisClient.isOpen && inventory.reservedStock <= 0) {
      await redisClient.del(`reservation:product:${item.productId}`);
    }
  }
};

const getStoredOrderReservation = async (cashfreeOrderId: string): Promise<OrderReservation> => {
  if (!redisClient.isOpen) throw new RequestValidationError('Order reservation service is unavailable. Please try again in a few minutes.', 503);
  const reservation = await getCachedSession<OrderReservation>(`reservation:order:${cashfreeOrderId}`);
  if (!reservation || !Array.isArray(reservation.items) || !reservation.userEmail || !reservation.shippingAddress) {
    throw new RequestValidationError('Payment reservation expired. Please start checkout again.', 409);
  }
  return reservation;
};

const getCashfreeOrderAmount = (status: Record<string, unknown>): number | null => {
  const amount = Number(status.order_amount);
  return Number.isFinite(amount) ? amount : null;
};

const completePaidReservation = async (item: VerifiedOrderItem): Promise<void> => {
  const product = await Product.findById(item.productId);
  if (!product) return;
  const current = product.toObject();
  const nextStock = Math.max(0, getStockCount(current) - item.quantity);
  const nextReservedStock = Math.max(0, getReservedStockCount(current) - item.quantity);
  const inventory = normalizeInventory({ ...current, stock: nextStock, reservedStock: nextReservedStock });
  await Product.findByIdAndUpdate(item.productId, inventory);
  if (redisClient.isOpen && inventory.reservedStock <= 0) {
    await redisClient.del(`reservation:product:${item.productId}`);
  }
};

const normalizeAdminOrderUpdate = (body: unknown): AdminOrderUpdate => {
  if (!isRecord(body)) throw new RequestValidationError('Order update details are required.');

  const update: AdminOrderUpdate = {};

  if ('status' in body) {
    const status = cleanText(body.status, 32).toLowerCase();
    if (!orderStatuses.has(status)) throw new RequestValidationError('Invalid order status.');
    update.status = status;
  }

  if ('paymentStatus' in body) {
    const paymentStatus = cleanText(body.paymentStatus, 32).toUpperCase().replace(/\s+/g, '_');
    if (!paymentStatuses.has(paymentStatus)) throw new RequestValidationError('Invalid payment status.');
    update.paymentStatus = paymentStatus;
  }

  if ('shippingStatus' in body) update.shippingStatus = cleanText(body.shippingStatus, 80);
  if ('courierName' in body) update.courierName = cleanText(body.courierName, 80);
  if ('awbCode' in body) update.awbCode = cleanText(body.awbCode, 80);
  if ('estimatedDelivery' in body) update.estimatedDelivery = cleanText(body.estimatedDelivery, 80);
  if ('adminNote' in body) update.adminNote = cleanLongText(body.adminNote, 800);
  if ('cancellationReason' in body) update.cancellationReason = cleanLongText(body.cancellationReason, 500);

  if (Object.keys(update).length === 0) throw new RequestValidationError('At least one order field is required.');
  return update;
};

const sendErrorResponse = (res: Response, error: unknown): void => {
  if (isIntegrationConfigError(error)) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }
  if (error instanceof RequestValidationError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }
  res.status(500).json({ error: 'Internal server error' });
};

const shouldLogError = (error: unknown): boolean => {
  return !isIntegrationConfigError(error) && !(error instanceof RequestValidationError);
};

router.post('/reserve', checkoutRateLimit, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const { items, shippingAddress } = req.body;
    if (!Array.isArray(items) || items.length === 0 || !shippingAddress) {
      res.status(400).json({ error: 'Missing reservation details' });
      return;
    }
    if (!isCashfreeConfigured()) {
      res.status(503).json({ error: 'Cashfree credentials are not configured. Set CASHFREE_APP_ID and CASHFREE_SECRET_KEY.' });
      return;
    }
    if (!redisClient.isOpen) {
      res.status(503).json({ error: 'Order reservation service is unavailable. Please try again in a few minutes.' });
      return;
    }
    const normalizedShippingAddress = normalizeShippingAddress(shippingAddress);
    if (!normalizedShippingAddress) {
      res.status(400).json({ error: 'Complete and valid shipping details are required' });
      return;
    }

    const { verifiedItems, total } = await getVerifiedItems(items);

    const lockedIds: string[] = [];
    const reservedItems: ReservedOrderItem[] = [];

    for (const item of verifiedItems) {
      const lockKey = `lock:product:${item.productId}`;
      const locked = await acquireLock(lockKey, 5);
      if (!locked) {
        await releaseReservedProducts(reservedItems);
        for (const id of lockedIds) await releaseLock(`lock:product:${id}`);
        res.status(409).json({ error: `"${item.name}" is currently locked by another buyer. Please try again.` });
        return;
      }
      lockedIds.push(item.productId);

      const prod = await Product.findById(item.productId);
      if (!prod) {
        await releaseReservedProducts(reservedItems);
        for (const id of lockedIds) await releaseLock(`lock:product:${id}`);
        res.status(409).json({ error: `"${item.name}" is no longer available.` });
        return;
      }

      const currentInventory = prod.toObject();
      if (getAvailableStockCount(currentInventory) < item.quantity) {
        await releaseReservedProducts(reservedItems);
        for (const id of lockedIds) await releaseLock(`lock:product:${id}`);
        res.status(409).json({ error: `"${item.name}" does not have enough stock left.` });
        return;
      }

      const inventory = normalizeInventory({
        ...currentInventory,
        reservedStock: getReservedStockCount(currentInventory) + item.quantity,
      });
      await Product.findByIdAndUpdate(item.productId, inventory);
      reservedItems.push({ productId: item.productId, quantity: item.quantity });
      if (redisClient.isOpen) {
        await redisClient.setEx(`reservation:product:${item.productId}`, reservationTtlSeconds, '1');
      }
    }

    for (const id of lockedIds) {
      await releaseLock(`lock:product:${id}`);
    }

    const cashfreeOrderId = `HT_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    if (redisClient.isOpen) {
      await redisClient.setEx(
        `reservation:order:${cashfreeOrderId}`,
        reservationTtlSeconds,
        JSON.stringify({
          userEmail: user.email,
          items: verifiedItems,
          total,
          shippingAddress: normalizedShippingAddress,
          createdAt: new Date().toISOString(),
        } satisfies OrderReservation)
      );
    }

    let cfOrder: Awaited<ReturnType<typeof createCashfreeOrder>>;
    try {
      cfOrder = await createCashfreeOrder(
        cashfreeOrderId,
        Number(total),
        normalizedShippingAddress.email,
        normalizedShippingAddress.phone,
        normalizedShippingAddress.name
      );
    } catch (error) {
      await releaseReservedProducts(reservedItems);
      if (redisClient.isOpen) {
        await redisClient.del(`reservation:order:${cashfreeOrderId}`);
      }
      await deleteCachedSession('products:all');
      throw error;
    }

    await deleteCachedSession('products:all');

    res.status(200).json({
      paymentSessionId: cfOrder.payment_session_id,
      cashfreeOrderId,
      cashfreeMode: getCashfreeMode(),
      reservationExpiresAt: getReservationExpiry(),
      orderExpiresAt: cfOrder.order_expiry_time || '',
      amount: total,
      items: verifiedItems,
    });
  } catch (error) {
    if (shouldLogError(error)) console.error(error);
    sendErrorResponse(res, error);
  }
});

router.post('/cod', checkoutRateLimit, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const { items, shippingAddress } = req.body;
    if (!Array.isArray(items) || items.length === 0 || !shippingAddress) {
      res.status(400).json({ error: 'Missing order details' });
      return;
    }
    if (!redisClient.isOpen) {
      res.status(503).json({ error: 'Order service is unavailable. Please try again in a few minutes.' });
      return;
    }
    const normalizedShippingAddress = normalizeShippingAddress(shippingAddress);
    if (!normalizedShippingAddress) {
      res.status(400).json({ error: 'Complete and valid shipping details are required' });
      return;
    }

    const { verifiedItems, total } = await getVerifiedItems(items);

    const lockedIds: string[] = [];
    try {
      for (const item of verifiedItems) {
        const lockKey = `lock:product:${item.productId}`;
        const locked = await acquireLock(lockKey, 5);
        if (!locked) throw new RequestValidationError(`"${item.name}" is currently locked by another buyer. Please try again.`, 409);
        lockedIds.push(item.productId);

        const prod = await Product.findById(item.productId);
        if (!prod) throw new RequestValidationError(`"${item.name}" is no longer available.`, 409);

        const currentInventory = prod.toObject();
        if (getAvailableStockCount(currentInventory) < item.quantity) {
          throw new RequestValidationError(`"${item.name}" does not have enough stock left.`, 409);
        }

        await completePaidReservation(item);
      }
    } catch (err) {
      for (const id of lockedIds) await releaseLock(`lock:product:${id}`);
      throw err;
    }
    for (const id of lockedIds) await releaseLock(`lock:product:${id}`);

    const codOrderId = `HT_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    let srOrder: Record<string, unknown> | null = null;
    try {
      srOrder = await createShiprocketOrder(codOrderId, Number(total), verifiedItems, normalizedShippingAddress, 'COD');
    } catch (shippingError) {
      if (isIntegrationConfigError(shippingError)) {
        console.warn(shippingError.message);
      } else {
        console.error('Shiprocket order creation failed for COD order:', shippingError);
      }
    }

    const order = new Order({
      userEmail: user.email,
      items: verifiedItems,
      total: Number(total),
      transactionId: codOrderId,
      shippingAddress: normalizedShippingAddress as ShippingAddress,
      paymentProvider: 'COD',
      paymentMethod: 'COD',
      paymentStatus: 'COD',
      shiprocketOrderId: getStringField(srOrder, 'order_id'),
      shiprocketShipmentId: getStringField(srOrder, 'shipment_id'),
      awbCode: getStringField(srOrder, 'awb_code'),
      courierName: getStringField(srOrder, 'courier_name'),
      shippingStatus: srOrder ? 'Shipment Created' : 'Pending Shipment Creation',
    });

    await order.save();

    try {
      const invoice = await createAndUploadInvoice(order.toObject());
      order.invoiceUrl = invoice.invoiceUrl;
      order.invoicePublicId = invoice.invoicePublicId;
      order.invoiceGeneratedAt = new Date();
      const invoiceEmailSent = await sendOrderInvoiceEmail(normalizedShippingAddress.email || user.email, order.toObject());
      if (invoiceEmailSent) order.invoiceEmailSentAt = new Date();
      await order.save();
    } catch (invoiceError) {
      if (isIntegrationConfigError(invoiceError)) {
        console.warn(invoiceError.message);
      } else {
        console.error('Invoice generation failed for COD order:', invoiceError);
      }
    }

    await deleteCachedSession(`orders:${user.email}`);
    await deleteCachedSession('products:all');

    res.status(201).json(order);
  } catch (error) {
    if (shouldLogError(error)) console.error(error);
    sendErrorResponse(res, error);
  }
});

router.get('/serviceability/:pincode', serviceabilityRateLimit, async (req: Request, res: Response): Promise<void> => {
  try {
    const pincode = String(req.params.pincode).replace(/\D/g, '');
    if (pincode.length !== 6) {
      res.status(400).json({ error: 'Valid 6-digit PIN code is required' });
      return;
    }

    const data = await checkServiceability(pincode);
    res.json(data);
  } catch (error) {
    if (isIntegrationConfigError(error)) {
      res.json({
        serviceable: true,
        courierName: 'Shiprocket',
        estimatedDays: '',
        freightCharge: 0,
        codAvailable: false,
        raw: null,
        message: error.message,
      });
      return;
    }
    console.error(error);
    res.status(502).json({ error: 'Delivery serviceability check failed' });
  }
});

router.post('/verify-payment', checkoutRateLimit, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const { cashfreeOrderId } = req.body;
    if (!cashfreeOrderId || !cashfreeOrderIdPattern.test(String(cashfreeOrderId))) {
      res.status(400).json({ error: 'Missing payment details' });
      return;
    }

    const reservation = await getStoredOrderReservation(String(cashfreeOrderId));
    if (reservation.userEmail !== user.email) {
      res.status(403).json({ error: 'This payment reservation belongs to another account' });
      return;
    }
    const verifiedItems = reservation.items;
    const total = reservation.total;
    const shippingAddress = reservation.shippingAddress;

    const cfStatus = await verifyCashfreePayment(cashfreeOrderId);
    const paidAmount = getCashfreeOrderAmount(cfStatus);
    if (paidAmount !== null && Math.abs(paidAmount - total) > 0.5) {
      await releaseReservedProducts(toReservedOrderItems(verifiedItems));
      await redisClient.del(`reservation:order:${cashfreeOrderId}`);
      await deleteCachedSession('products:all');
      res.status(400).json({ error: 'Payment amount mismatch. Product reservations released.' });
      return;
    }
    if (cfStatus.order_status !== 'PAID') {
      let reservedItems = toReservedOrderItems(verifiedItems);
      if (redisClient.isOpen) {
        const cachedItems = await redisClient.get(`reservation:order:${cashfreeOrderId}`);
        reservedItems = parseReservedOrderItems(cachedItems, verifiedItems);
      }
      await releaseReservedProducts(reservedItems);
      if (redisClient.isOpen) {
        await redisClient.del(`reservation:order:${cashfreeOrderId}`);
      }
      await deleteCachedSession('products:all');
      res.status(400).json({ error: 'Payment not successful. Product reservations released.' });
      return;
    }

    const lockedIds: string[] = [];
    try {
      for (const item of verifiedItems) {
        const lockKey = `lock:product:${item.productId}`;
        const locked = await acquireLock(lockKey, 5);
        if (!locked) throw new RequestValidationError('Inventory is busy. Please retry payment verification.', 409);
        lockedIds.push(item.productId);
        await completePaidReservation(item);
      }
    } finally {
      for (const id of lockedIds) {
        await releaseLock(`lock:product:${id}`);
      }
    }
    if (redisClient.isOpen) {
      await redisClient.del(`reservation:order:${cashfreeOrderId}`);
    }

    let srOrder: Record<string, unknown> | null = null;
    try {
      srOrder = await createShiprocketOrder(cashfreeOrderId, Number(total), verifiedItems, shippingAddress, 'Prepaid');
    } catch (shippingError) {
      if (isIntegrationConfigError(shippingError)) {
        console.warn(shippingError.message);
      } else {
        console.error('Shiprocket order creation failed, proceeding to complete order:', shippingError);
      }
    }

    const order = new Order({
      userEmail: user.email,
      items: verifiedItems,
      total: Number(total),
      transactionId: cashfreeOrderId,
      shippingAddress: shippingAddress as ShippingAddress,
      cashfreeOrderId,
      paymentStatus: 'PAID',
      cashfreeOrderStatus: cfStatus.order_status || 'PAID',
      shiprocketOrderId: getStringField(srOrder, 'order_id'),
      shiprocketShipmentId: getStringField(srOrder, 'shipment_id'),
      awbCode: getStringField(srOrder, 'awb_code'),
      courierName: getStringField(srOrder, 'courier_name'),
      shippingStatus: srOrder ? 'Shipment Created' : 'Pending Shipment Creation',
    });

    await order.save();
    try {
      const invoice = await createAndUploadInvoice(order.toObject());
      order.invoiceUrl = invoice.invoiceUrl;
      order.invoicePublicId = invoice.invoicePublicId;
      order.invoiceGeneratedAt = new Date();
      const invoiceEmailSent = await sendOrderInvoiceEmail(shippingAddress.email || user.email, order.toObject());
      if (invoiceEmailSent) order.invoiceEmailSentAt = new Date();
      await order.save();
    } catch (invoiceError) {
      if (isIntegrationConfigError(invoiceError)) {
        console.warn(invoiceError.message);
      } else {
        console.error('Invoice generation failed:', invoiceError);
      }
    }
    await deleteCachedSession(`orders:${user.email}`);
    await deleteCachedSession('products:all');

    res.status(201).json(order);
  } catch (error) {
    if (shouldLogError(error)) console.error(error);
    sendErrorResponse(res, error);
  }
});

router.get('/track/:shipmentId', trackingRateLimit, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const order = await Order.findOne({
      userEmail: user.email,
      $or: [
        { shiprocketShipmentId: req.params.shipmentId },
        { awbCode: req.params.shipmentId },
      ],
    });

    if (!order) {
      res.status(404).json({ error: 'Shipment not found for this account' });
      return;
    }

    const data = order.awbCode && req.params.shipmentId === order.awbCode
      ? await trackAwb(order.awbCode)
      : await trackShipment(order.shiprocketShipmentId);

    order.awbCode = data.awbCode || order.awbCode;
    order.courierName = data.courierName || order.courierName;
    order.estimatedDelivery = data.estimatedDelivery || order.estimatedDelivery;
    order.lastTrackingStatus = data.currentStatus || order.lastTrackingStatus;
    order.lastTrackingSyncAt = new Date();
    order.shippingStatus = data.currentStatus || order.shippingStatus;
    await order.save();
    await deleteCachedSession(`orders:${user.email}`);

    res.json({ orderId: order._id, tracking: data });
  } catch (error) {
    if (shouldLogError(error)) console.error(error);
    sendErrorResponse(res, error);
  }
});

router.get('/admin', async (req: Request, res: Response): Promise<void> => {
  try {
    const isadmin = await isAdminRequest(req);
    if (!isadmin) {
      res.status(403).json({ error: 'Unauthorized admin access required' });
      return;
    }

    const orders = await Order.find({}).sort({ createdAt: -1 }).limit(250).lean();
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/admin/:id', adminMutationRateLimit, async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await getRequestSession(req);
    if (!session?.isAdmin) {
      res.status(403).json({ error: 'Unauthorized admin access required' });
      return;
    }
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ error: 'Valid order id is required' });
      return;
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const update = normalizeAdminOrderUpdate(req.body);
    if (update.status === 'cancelled') {
      const cancellationReason = update.cancellationReason || cleanLongText(order.cancellationReason, 500);
      if (!cancellationReason) {
        res.status(400).json({ error: 'Cancellation reason is required' });
        return;
      }
      update.cancellationReason = cancellationReason;
      update.shippingStatus = 'Cancelled';
      order.set('cancelledAt', new Date());
      order.set('cancelledBy', session.email);
    }

    order.set({
      ...update,
      adminUpdatedAt: new Date(),
      adminUpdatedBy: session.email,
    });
    await order.save();
    await deleteCachedSession(`orders:${order.userEmail}`);
    res.json(order);
  } catch (error) {
    if (shouldLogError(error)) console.error(error);
    sendErrorResponse(res, error);
  }
});

router.get('/history', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const cacheKey = `orders:${user.email}`;
    const cached = await getCachedSession(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }
    const orders = await Order.find({ userEmail: user.email }).sort({ createdAt: -1 });
    await cacheSession(cacheKey, orders, 86400);
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
