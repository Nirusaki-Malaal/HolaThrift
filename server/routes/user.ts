import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { sendOtpEmail } from '../services/mail';
import { cacheSession, getCachedSession, deleteCachedSession } from '../services/redis';

const router = Router();

const getSessionUser = async (req: Request): Promise<any | null> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return await getCachedSession(`session:${token}`);
};

const getToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1];
};

router.put('/name', async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await getSessionUser(req);
    if (!session) { res.status(401).json({ error: 'Authentication required' }); return; }
    const { name } = req.body;
    if (!name || !name.trim()) { res.status(400).json({ error: 'Name is required' }); return; }
    await User.findByIdAndUpdate(session.id, { name: name.trim() });
    const token = getToken(req)!;
    await cacheSession(`session:${token}`, { ...session, name: name.trim() });
    res.json({ message: 'Name updated', name: name.trim() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/phone', async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await getSessionUser(req);
    if (!session) { res.status(401).json({ error: 'Authentication required' }); return; }
    const { phone } = req.body;
    if (!phone || !phone.trim()) { res.status(400).json({ error: 'Phone number is required' }); return; }
    const existing = await User.findOne({ phone: phone.trim(), _id: { $ne: session.id } });
    if (existing) { res.status(400).json({ error: 'Phone number already in use' }); return; }
    await User.findByIdAndUpdate(session.id, { phone: phone.trim() });
    const token = getToken(req)!;
    await cacheSession(`session:${token}`, { ...session, phone: phone.trim() });
    res.json({ message: 'Phone updated', phone: phone.trim() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/password', async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await getSessionUser(req);
    if (!session) { res.status(401).json({ error: 'Authentication required' }); return; }
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) { res.status(400).json({ error: 'Both passwords are required' }); return; }
    if (newPassword.length < 8) { res.status(400).json({ error: 'New password must be at least 8 characters' }); return; }
    const user = await User.findById(session.id);
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) { res.status(400).json({ error: 'Current password is incorrect' }); return; }
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
    const session = await getSessionUser(req);
    if (!session) { res.status(401).json({ error: 'Authentication required' }); return; }
    const { newEmail } = req.body;
    if (!newEmail || !newEmail.trim()) { res.status(400).json({ error: 'New email is required' }); return; }
    const existing = await User.findOne({ email: newEmail.toLowerCase().trim() });
    if (existing) { res.status(400).json({ error: 'Email already in use' }); return; }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await cacheSession(`email_change:${session.id}`, { newEmail: newEmail.toLowerCase().trim(), otp }, 600);
    await sendOtpEmail(newEmail, otp);
    res.json({ message: 'Verification code sent to new email' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/verify-email-change', async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await getSessionUser(req);
    if (!session) { res.status(401).json({ error: 'Authentication required' }); return; }
    const { otp } = req.body;
    if (!otp) { res.status(400).json({ error: 'Verification code is required' }); return; }
    const cached = await getCachedSession(`email_change:${session.id}`);
    if (!cached) { res.status(400).json({ error: 'Verification code expired. Please try again.' }); return; }
    if (cached.otp !== otp) { res.status(400).json({ error: 'Incorrect verification code' }); return; }
    await User.findByIdAndUpdate(session.id, { email: cached.newEmail });
    await deleteCachedSession(`email_change:${session.id}`);
    const token = getToken(req)!;
    await cacheSession(`session:${token}`, { ...session, email: cached.newEmail });
    res.json({ message: 'Email updated successfully', email: cached.newEmail });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
