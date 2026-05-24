const DEFAULT_AUTH_COOKIE_DAYS = 30;
const MAX_AUTH_COOKIE_DAYS = 365;

const parseAuthCookieDays = (): number => {
  const value = Number(import.meta.env.VITE_AUTH_COOKIE_DAYS);
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_AUTH_COOKIE_DAYS;
  return Math.min(Math.floor(value), MAX_AUTH_COOKIE_DAYS);
};

export const AUTH_COOKIE_DAYS = parseAuthCookieDays();
