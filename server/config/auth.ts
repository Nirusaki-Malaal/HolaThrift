import { getEnv } from './env';

const DEFAULT_SESSION_DAYS = 30;
const MAX_SESSION_DAYS = 365;
const SECONDS_PER_DAY = 24 * 60 * 60;

const parseSessionDays = (): number => {
  const value = Number(getEnv('AUTH_SESSION_DAYS'));
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_SESSION_DAYS;
  return Math.min(Math.floor(value), MAX_SESSION_DAYS);
};

export const AUTH_SESSION_DAYS = parseSessionDays();
export const AUTH_SESSION_TTL_SECONDS = AUTH_SESSION_DAYS * SECONDS_PER_DAY;
