import { Request } from 'express';
import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { cacheSession, getCachedSession } from '../services/redis';
import { isAdminEmail } from '../config/admin';
import { AUTH_SESSION_TTL_SECONDS } from '../config/auth';
import { getEnv } from '../config/env';

export interface UserSession {
  id: string;
  email: string;
  phone: string;
  name?: string;
  isAdmin: boolean;
}

export type UserLike = {
  _id?: unknown;
  id?: unknown;
  email?: unknown;
  phone?: unknown;
  name?: unknown;
  isAdmin?: unknown;
};

const createJwtSecret = (): string => {
  const configuredSecret = getEnv('JWT_SECRET');
  if (configuredSecret) return configuredSecret;
  if (process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET is required');
  return randomBytes(32).toString('hex');
};

export const JWT_SECRET = createJwtSecret();

export const createAuthToken = (user: UserLike): string => {
  return jwt.sign({ id: String(user._id || user.id || ''), email: String(user.email || '') }, JWT_SECRET, { expiresIn: AUTH_SESSION_TTL_SECONDS });
};

export const getBearerToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1];
};

export const toUserSession = (user: UserLike): UserSession => {
  const email = String(user.email || '').trim().toLowerCase();
  const name = String(user.name || '').trim();

  return {
    id: String(user._id || user.id),
    email,
    phone: String(user.phone || ''),
    ...(name ? { name } : {}),
    isAdmin: Boolean(user.isAdmin) || isAdminEmail(email),
  };
};

const normalizeSession = (session: unknown): UserSession | null => {
  if (!session || typeof session !== 'object') return null;
  const value = session as UserLike;
  if (!value.id || !value.email) return null;
  const email = String(value.email).trim().toLowerCase();
  const name = String(value.name || '').trim();

  return {
    id: String(value.id),
    email,
    phone: String(value.phone || ''),
    ...(name ? { name } : {}),
    isAdmin: Boolean(value.isAdmin) || isAdminEmail(email),
  };
};

export const getSessionFromToken = async (token: string): Promise<UserSession | null> => {
  const rawCachedSession = await getCachedSession(`session:${token}`);
  const cachedSession = normalizeSession(rawCachedSession);
  if (cachedSession) {
    const user = await User.findById(cachedSession.id).select('-password');
    if (!user) return null;
    const freshSession = toUserSession(user);
    const sessionChanged = freshSession.email !== cachedSession.email ||
      freshSession.phone !== cachedSession.phone ||
      freshSession.name !== cachedSession.name ||
      freshSession.isAdmin !== cachedSession.isAdmin;
    if (sessionChanged) await cacheSession(`session:${token}`, freshSession, AUTH_SESSION_TTL_SECONDS);
    return freshSession;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id?: string };
    if (!decoded.id) return null;

    const user = await User.findById(decoded.id).select('-password');
    if (!user) return null;

    const session = toUserSession(user);
    await cacheSession(`session:${token}`, session, AUTH_SESSION_TTL_SECONDS);
    return session;
  } catch {
    return null;
  }
};

export const getRequestSession = async (req: Request): Promise<UserSession | null> => {
  const token = getBearerToken(req);
  if (!token) return null;
  return getSessionFromToken(token);
};

export const isAdminRequest = async (req: Request): Promise<boolean> => {
  const session = await getRequestSession(req);
  return Boolean(session?.isAdmin);
};
