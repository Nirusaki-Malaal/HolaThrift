import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import Product from '../models/Product';
import { sendOtpEmail } from '../services/mail';
import { cacheSession, getCachedSession, deleteCachedSession } from '../services/redis';
import { getBearerToken, getRequestSession, toUserSession } from '../utils/auth';
import type { UserLike, UserSession } from '../utils/auth';

const router = Router();

interface SavedAddress {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

const getSession = async (req: Request, res: Response): Promise<UserSession | null> => {
  const session = await getRequestSession(req);
  if (!session) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }
  return session;
};

type AddressInput = Record<string, unknown>;

const updateSessionCache = async (req: Request, user: UserLike): Promise<UserSession> => {
  const session = toUserSession(user);
  const token = getBearerToken(req);
  if (token) await cacheSession(`session:${token}`, session);
  return session;
};

const normalizeAddress = (body: AddressInput): SavedAddress => ({
  name: String(body.name || '').trim(),
  phone: String(body.phone || '').trim(),
  email: String(body.email || '').trim().toLowerCase(),
  address: String(body.address || '').trim(),
  city: String(body.city || '').trim(),
  state: String(body.state || '').trim(),
  pincode: String(body.pincode || '').trim(),
});

const isAddressComplete = (address: SavedAddress): boolean => {
  return Boolean(address.name && address.phone && address.email && address.address && address.city && address.state && address.pincode);
};

router.put('/name', async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await getSession(req, res);
    if (!session) return;

    const { name } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    const user = await User.findByIdAndUpdate(session.id, { name: name.trim() }, { new: true });
    const nextSession = await updateSessionCache(req, user);
    res.json({ message: 'Name updated', name: nextSession.name || '' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/phone', async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await getSession(req, res);
    if (!session) return;

    const { phone } = req.body;
    if (!phone || !phone.trim()) {
      res.status(400).json({ error: 'Phone number is required' });
      return;
    }

    const existing = await User.findOne({ phone: phone.trim(), _id: { $ne: session.id } });
    if (existing) {
      res.status(400).json({ error: 'Phone number already in use' });
      return;
    }

    const user = await User.findByIdAndUpdate(session.id, { phone: phone.trim() }, { new: true });
    const nextSession = await updateSessionCache(req, user);
    res.json({ message: 'Phone updated', phone: nextSession.phone });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/password', async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await getSession(req, res);
    if (!session) return;

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Both passwords are required' });
      return;
    }
    if (newPassword.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters' });
      return;
    }

    const user = await User.findById(session.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(400).json({ error: 'Current password is incorrect' });
      return;
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/email', async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await getSession(req, res);
    if (!session) return;

    const { newEmail } = req.body;
    if (!newEmail || !newEmail.trim()) {
      res.status(400).json({ error: 'New email is required' });
      return;
    }

    const normalizedEmail = newEmail.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      res.status(400).json({ error: 'Email already in use' });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await cacheSession(`email_change:${session.id}`, { newEmail: normalizedEmail, otp }, 600);
    await sendOtpEmail(normalizedEmail, otp);
    res.json({ message: 'Verification code sent to new email' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/verify-email-change', async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await getSession(req, res);
    if (!session) return;

    const { otp } = req.body;
    if (!otp) {
      res.status(400).json({ error: 'Verification code is required' });
      return;
    }

    const cached = await getCachedSession<{ otp: string; newEmail: string }>(`email_change:${session.id}`);
    if (!cached) {
      res.status(400).json({ error: 'Verification code expired. Please try again.' });
      return;
    }
    if (cached.otp !== otp) {
      res.status(400).json({ error: 'Incorrect verification code' });
      return;
    }

    const user = await User.findByIdAndUpdate(session.id, { email: cached.newEmail }, { new: true });
    await deleteCachedSession(`email_change:${session.id}`);
    const nextSession = await updateSessionCache(req, user);
    res.json({ message: 'Email updated successfully', email: nextSession.email, isAdmin: nextSession.isAdmin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/address', async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await getSession(req, res);
    if (!session) return;

    const user = await User.findById(session.id).select('defaultAddress');
    res.json(user?.defaultAddress || null);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/address', async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await getSession(req, res);
    if (!session) return;

    const address = normalizeAddress(req.body);
    if (!isAddressComplete(address)) {
      res.status(400).json({ error: 'Complete address details are required' });
      return;
    }

    await User.findByIdAndUpdate(session.id, { defaultAddress: address });
    res.json({ message: 'Address saved', address });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/wishlist', async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await getSession(req, res);
    if (!session) return;

    const user = await User.findById(session.id).populate('wishlist');
    res.json(user?.wishlist || []);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/wishlist/:productId', async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await getSession(req, res);
    if (!session) return;

    const product = await Product.findById(req.params.productId);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const user = await User.findByIdAndUpdate(
      session.id,
      { $addToSet: { wishlist: product._id } },
      { new: true }
    ).populate('wishlist');

    res.json(user?.wishlist || []);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/wishlist/:productId', async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await getSession(req, res);
    if (!session) return;

    const user = await User.findByIdAndUpdate(
      session.id,
      { $pull: { wishlist: req.params.productId } },
      { new: true }
    ).populate('wishlist');

    res.json(user?.wishlist || []);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
