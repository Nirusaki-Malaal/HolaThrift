import rateLimit from 'express-rate-limit';

const minutes = (value: number): number => value * 60 * 1000;

const getLimit = (key: string, fallback: number): number => {
  const value = Number(process.env[key]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const createRateLimit = (windowMinutes: number, limit: number, error: string) => {
  return rateLimit({
    windowMs: minutes(windowMinutes),
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error },
  });
};

export const apiRateLimit = createRateLimit(15, getLimit('RATE_LIMIT_API', 500), 'Too many requests. Please slow down.');
export const authRateLimit = createRateLimit(15, getLimit('RATE_LIMIT_AUTH', 30), 'Too many login attempts. Please try again later.');
export const checkoutRateLimit = createRateLimit(15, getLimit('RATE_LIMIT_CHECKOUT', 30), 'Too many checkout attempts. Please try again later.');
export const uploadRateLimit = createRateLimit(15, getLimit('RATE_LIMIT_UPLOAD', 40), 'Too many upload attempts. Please try again later.');
export const adminMutationRateLimit = createRateLimit(15, getLimit('RATE_LIMIT_ADMIN_MUTATION', 120), 'Too many admin updates. Please try again later.');
export const adminEmailRateLimit = createRateLimit(60, getLimit('RATE_LIMIT_ADMIN_EMAIL', 30), 'Too many email requests. Please try again later.');
export const accountMutationRateLimit = createRateLimit(15, getLimit('RATE_LIMIT_ACCOUNT_MUTATION', 80), 'Too many account updates. Please try again later.');
export const wishlistRateLimit = createRateLimit(15, getLimit('RATE_LIMIT_WISHLIST', 160), 'Too many saved item updates. Please try again later.');
export const serviceabilityRateLimit = createRateLimit(15, getLimit('RATE_LIMIT_SERVICEABILITY', 120), 'Too many delivery checks. Please try again later.');
export const trackingRateLimit = createRateLimit(15, getLimit('RATE_LIMIT_TRACKING', 80), 'Too many tracking checks. Please try again later.');
