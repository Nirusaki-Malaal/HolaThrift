import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { User } from '../models/User';
import Order from '../models/Order';
import Product from '../models/Product';
import { sendCustomEmail, sendOtpEmail } from '../services/mail';
import { cacheSession, getCachedSession, deleteCachedSession } from '../services/redis';
import { AUTH_SESSION_TTL_SECONDS } from '../config/auth';
import { isAdminEmail } from '../config/admin';
import { getBearerToken, getRequestSession, isAdminRequest, toUserSession } from '../utils/auth';
import { cleanEmail, cleanLongText, cleanPhone, cleanText, isRecord, isValidEmail, isValidObjectId } from '../utils/validation';
import { accountMutationRateLimit, adminEmailRateLimit, adminMutationRateLimit, wishlistRateLimit } from '../middleware/rateLimits';
import type { UserLike, UserSession } from '../utils/auth';

const router = Router();

const createOtp = (): string => randomInt(100000, 1000000).toString();

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

const updateSessionCache = async (req: Request, user: UserLike): Promise<UserSession> => {
  const session = toUserSession(user);
  const token = getBearerToken(req);
  if (token) await cacheSession(`session:${token}`, session, AUTH_SESSION_TTL_SECONDS);
  return session;
};

const normalizeAddress = (body: unknown): SavedAddress => {
  const input = isRecord(body) ? body : {};
  return {
    name: cleanText(input.name, 80),
    phone: cleanPhone(input.phone),
    email: cleanEmail(input.email),
    address: cleanLongText(input.address, 180),
    city: cleanText(input.city, 80),
    state: cleanText(input.state, 80),
    pincode: cleanText(input.pincode, 12).replace(/\D/g, '').slice(0, 6),
  };
};

const isAddressComplete = (address: SavedAddress): boolean => {
  return Boolean(address.name && address.phone.length === 10 && isValidEmail(address.email) && address.address && address.city && address.state && address.pincode.length === 6);
};

const getAdminAccess = async (req: Request, res: Response): Promise<boolean> => {
  const isadmin = await isAdminRequest(req);
  if (!isadmin) {
    res.status(403).json({ error: 'Unauthorized admin access required' });
    return false;
  }
  return true;
};

router.get('/admin/email-users', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!await getAdminAccess(req, res)) return;
    const users = await User.find({})
      .select('email name phone createdAt')
      .sort({ createdAt: -1 })
      .lean();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/admin/users', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!await getAdminAccess(req, res)) return;
    const users = await User.find({})
      .select('email phone name isAdmin defaultAddress wishlist createdAt')
      .sort({ createdAt: -1 })
      .lean();
    const orderStats = await Order.aggregate([
      {
        $group: {
          _id: '$userEmail',
          orderCount: { $sum: 1 },
          totalSpend: { $sum: '$total' },
          lastOrderAt: { $max: '$createdAt' },
        },
      },
    ]);
    const statsByEmail = new Map(orderStats.map((stat) => [String(stat._id || '').toLowerCase(), stat]));

    res.json(users.map((user) => {
      const email = String(user.email || '').toLowerCase();
      const stats = statsByEmail.get(email);
      return {
        _id: user._id,
        email,
        phone: user.phone,
        name: user.name,
        defaultAddress: user.defaultAddress,
        wishlistCount: Array.isArray(user.wishlist) ? user.wishlist.length : 0,
        createdAt: user.createdAt,
        isAdmin: Boolean(user.isAdmin) || isAdminEmail(email),
        isConfiguredAdmin: isAdminEmail(email),
        orderCount: Number(stats?.orderCount || 0),
        totalSpend: Number(stats?.totalSpend || 0),
        lastOrderAt: stats?.lastOrderAt || null,
      };
    }));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/admin/users/:id', adminMutationRateLimit, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!await getAdminAccess(req, res)) return;
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ error: 'Valid user id is required' });
      return;
    }
    const name = cleanText(req.body.name, 80);
    const email = cleanEmail(req.body.email);
    const phone = cleanPhone(req.body.phone);

    if (!isValidEmail(email) || phone.length !== 10) {
      res.status(400).json({ error: 'Valid email and 10-digit phone are required' });
      return;
    }

    const existingUser = await User.findById(req.params.id);
    if (!existingUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const emailOwner = await User.findOne({ email, _id: { $ne: req.params.id } });
    if (emailOwner) {
      res.status(400).json({ error: 'Email already in use' });
      return;
    }

    const phoneOwner = await User.findOne({ phone, _id: { $ne: req.params.id } });
    if (phoneOwner) {
      res.status(400).json({ error: 'Phone number already in use' });
      return;
    }

    const previousEmail = existingUser.email;
    existingUser.name = name;
    existingUser.email = email;
    existingUser.phone = phone;
    await existingUser.save();
    if (previousEmail !== email) {
      await Order.updateMany({ userEmail: previousEmail }, { userEmail: email });
      await deleteCachedSession(`orders:${previousEmail}`);
    }
    await deleteCachedSession(`orders:${email}`);
    res.json({ message: 'User updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/admin/users/:id/admin', adminMutationRateLimit, async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await getRequestSession(req);
    if (!session?.isAdmin) {
      res.status(403).json({ error: 'Unauthorized admin access required' });
      return;
    }
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ error: 'Valid user id is required' });
      return;
    }
    if (typeof req.body?.isAdmin !== 'boolean') {
      res.status(400).json({ error: 'Admin access value is required' });
      return;
    }

    const nextIsAdmin = req.body.isAdmin;
    if (session.id === req.params.id && !nextIsAdmin) {
      res.status(400).json({ error: 'Admins cannot remove their own active admin access' });
      return;
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const configuredAdmin = isAdminEmail(user.email);
    if (configuredAdmin && !nextIsAdmin) {
      res.status(400).json({ error: 'Configured admin emails cannot be demoted from the panel' });
      return;
    }

    user.set('isAdmin', nextIsAdmin);
    await user.save();

    const email = String(user.email || '').toLowerCase();
    res.json({
      message: nextIsAdmin ? 'Admin access granted' : 'Admin access removed',
      isAdmin: Boolean(user.get('isAdmin')) || isAdminEmail(email),
      isConfiguredAdmin: isAdminEmail(email),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/admin/users/:id', adminMutationRateLimit, async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await getRequestSession(req);
    if (!session?.isAdmin) {
      res.status(403).json({ error: 'Unauthorized admin access required' });
      return;
    }
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ error: 'Valid user id is required' });
      return;
    }
    if (session.id === req.params.id) {
      res.status(400).json({ error: 'Admins cannot delete their own active account' });
      return;
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    await deleteCachedSession(`orders:${user.email}`);
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/admin/send-email', adminEmailRateLimit, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!await getAdminAccess(req, res)) return;

    const target = String(req.body.target || '').trim();
    const subject = cleanText(req.body.subject, 140);
    const message = cleanLongText(req.body.message, 5000);
    const email = cleanEmail(req.body.email);

    if (!subject || !message) {
      res.status(400).json({ error: 'Subject and message are required' });
      return;
    }

    let recipients: string[] = [];
    if (target === 'all') {
      const users = await User.find({}).select('email').lean();
      recipients = users.map((user) => String(user.email || '')).filter(Boolean);
    } else {
      if (!isValidEmail(email)) {
        res.status(400).json({ error: 'A user email is required' });
        return;
      }
      const user = await User.findOne({ email }).select('email').lean();
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      recipients = [String(user.email)];
    }

    let sent = 0;
    const failed: string[] = [];
    for (const recipient of recipients) {
      const ok = await sendCustomEmail(recipient, subject, message);
      if (ok) sent += 1;
      else failed.push(recipient);
    }

    res.json({ sent, failed, total: recipients.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/name', accountMutationRateLimit, async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await getSession(req, res);
    if (!session) return;

    const name = cleanText(req.body.name, 80);
    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    const user = await User.findByIdAndUpdate(session.id, { name }, { new: true });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const nextSession = await updateSessionCache(req, user);
    res.json({ message: 'Name updated', name: nextSession.name || '' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/phone', accountMutationRateLimit, async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await getSession(req, res);
    if (!session) return;

    const phone = cleanPhone(req.body.phone);
    if (phone.length !== 10) {
      res.status(400).json({ error: 'Valid 10-digit phone number is required' });
      return;
    }

    const existing = await User.findOne({ phone, _id: { $ne: session.id } });
    if (existing) {
      res.status(400).json({ error: 'Phone number already in use' });
      return;
    }

    const user = await User.findByIdAndUpdate(session.id, { phone }, { new: true });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const nextSession = await updateSessionCache(req, user);
    res.json({ message: 'Phone updated', phone: nextSession.phone });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/password', accountMutationRateLimit, async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await getSession(req, res);
    if (!session) return;

    const currentPassword = String(req.body.currentPassword || '');
    const newPassword = String(req.body.newPassword || '');
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

router.put('/email', accountMutationRateLimit, async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await getSession(req, res);
    if (!session) return;

    const normalizedEmail = cleanEmail(req.body.newEmail);
    if (!isValidEmail(normalizedEmail)) {
      res.status(400).json({ error: 'Valid new email is required' });
      return;
    }
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      res.status(400).json({ error: 'Email already in use' });
      return;
    }

    const otp = createOtp();
    await cacheSession(`email_change:${session.id}`, { newEmail: normalizedEmail, otp }, 600);
    await sendOtpEmail(normalizedEmail, otp);
    res.json({ message: 'Verification code sent to new email' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/verify-email-change', accountMutationRateLimit, async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await getSession(req, res);
    if (!session) return;

    const otp = cleanText(req.body.otp, 12);
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

    const previousEmail = session.email;
    const user = await User.findByIdAndUpdate(session.id, { email: cached.newEmail }, { new: true });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    await deleteCachedSession(`email_change:${session.id}`);
    if (previousEmail !== cached.newEmail) {
      await Order.updateMany({ userEmail: previousEmail }, { userEmail: cached.newEmail });
      await deleteCachedSession(`orders:${previousEmail}`);
    }
    await deleteCachedSession(`orders:${cached.newEmail}`);
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

router.put('/address', accountMutationRateLimit, async (req: Request, res: Response): Promise<void> => {
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

router.post('/wishlist/:productId', wishlistRateLimit, async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await getSession(req, res);
    if (!session) return;

    if (!isValidObjectId(req.params.productId)) {
      res.status(400).json({ error: 'Valid product id is required' });
      return;
    }
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

router.delete('/wishlist/:productId', wishlistRateLimit, async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await getSession(req, res);
    if (!session) return;

    if (!isValidObjectId(req.params.productId)) {
      res.status(400).json({ error: 'Valid product id is required' });
      return;
    }
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
