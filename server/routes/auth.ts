import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomInt } from 'crypto';
import { User } from '../models/User';
import { sendWelcomeEmail, sendOtpEmail, sendLoginOtpEmail } from '../services/mail';
import { cacheSession, getCachedSession, deleteCachedSession } from '../services/redis';
import { JWT_SECRET, getBearerToken, getSessionFromToken, toUserSession } from '../utils/auth';

const router = Router();

const createOtp = (): string => randomInt(100000, 1000000).toString();

router.post('/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, phone, password } = req.body;
    if (!email || !phone || !password) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedPhone = String(phone).replace(/\D/g, '').slice(-10);
    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters' });
      return;
    }
    if (normalizedPhone.length !== 10) {
      res.status(400).json({ error: 'Valid 10-digit phone number is required' });
      return;
    }

    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    const existingPhone = await User.findOne({ phone: normalizedPhone });
    if (existingPhone) {
      res.status(400).json({ error: 'Phone number already registered' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = createOtp();
    
    await cacheSession(`signup_otp:${normalizedEmail}`, { otp, phone: normalizedPhone, password: hashedPassword }, 600);
    await sendOtpEmail(normalizedEmail, otp);

    res.status(200).json({ message: 'Verification code sent' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/verify-signup', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      res.status(400).json({ error: 'Email and verification code are required' });
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const cached = await getCachedSession<{ otp: string; phone: string; password: string }>(`signup_otp:${normalizedEmail}`);
    if (!cached) {
      res.status(400).json({ error: 'Verification code expired or invalid' });
      return;
    }

    if (cached.otp !== otp) {
      res.status(400).json({ error: 'Incorrect verification code' });
      return;
    }

    const user = new User({
      email: normalizedEmail,
      phone: cached.phone,
      password: cached.password,
    });
    await user.save();

    await deleteCachedSession(`signup_otp:${normalizedEmail}`);

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
    const userSession = toUserSession(user);
    
    await cacheSession(`session:${token}`, userSession);
    await sendWelcomeEmail(user.email, user.email);

    res.status(201).json({ token, user: userSession });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(400).json({ error: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ error: 'Invalid credentials' });
      return;
    }

    const otp = createOtp();
    await cacheSession(`login_otp:${normalizedEmail}`, { otp }, 600);
    await sendLoginOtpEmail(normalizedEmail, otp);

    res.status(200).json({ requiresOtp: true, email: normalizedEmail });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/verify-login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      res.status(400).json({ error: 'Email and verification code are required' });
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const cached = await getCachedSession<{ otp: string }>(`login_otp:${normalizedEmail}`);
    if (!cached) {
      res.status(400).json({ error: 'Verification code expired or invalid' });
      return;
    }

    if (cached.otp !== otp) {
      res.status(400).json({ error: 'Incorrect verification code' });
      return;
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await deleteCachedSession(`login_otp:${normalizedEmail}`);

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
    const userSession = toUserSession(user);

    await cacheSession(`session:${token}`, userSession);

    res.status(200).json({ token, user: userSession });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = getBearerToken(req);
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const session = await getSessionFromToken(token);
    if (!session) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    res.json(session);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
