import { Request } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { cacheSession, getCachedSession } from '../services/redis';
import { isAdminEmail } from '../config/admin';

export interface UserSession {
  id: string;
  email: string;
  phone: string;
  name?: string;
  isAdmin: boolean;
}

export const JWT_SECRET = (process.env.JWT_SECRET || 'holathrift-super-secret-jwt-token-key').replace(/"/g, '');

export const getBearerToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1];
};

export const toUserSession = (user: any): UserSession => {
  const email = String(user.email || '').trim().toLowerCase();
  const name = String(user.name || '').trim();

  return {
    id: String(user._id || user.id),
    email,
    phone: String(user.phone || ''),
    ...(name ? { name } : {}),
    isAdmin: isAdminEmail(email),
  };
};

const normalizeSession = (session: any): UserSession | null => {
  if (!session?.id || !session?.email) return null;
  const email = String(session.email).trim().toLowerCase();
  const name = String(session.name || '').trim();

  return {
    id: String(session.id),
    email,
    phone: String(session.phone || ''),
    ...(name ? { name } : {}),
    isAdmin: isAdminEmail(email),
  };
};

export const getSessionFromToken = async (token: string): Promise<UserSession | null> => {
  const rawCachedSession = await getCachedSession(`session:${token}`);
  const cachedSession = normalizeSession(rawCachedSession);
  if (cachedSession) {
    if (rawCachedSession?.isAdmin !== cachedSession.isAdmin) await cacheSession(`session:${token}`, cachedSession);
    return cachedSession;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id?: string };
    if (!decoded.id) return null;

    const user = await User.findById(decoded.id).select('-password');
    if (!user) return null;

    const session = toUserSession(user);
    await cacheSession(`session:${token}`, session);
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
