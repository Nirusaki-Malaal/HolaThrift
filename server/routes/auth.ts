import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { sendWelcomeEmail, sendOtpEmail, sendLoginOtpEmail } from '../services/mail';
import { cacheSession, getCachedSession, deleteCachedSession } from '../services/redis';
import { JWT_SECRET, getBearerToken, getSessionFromToken, toUserSession } from '../utils/auth';

const router = Router();

router.post('/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, phone, password } = req.body;
    if (!email || !phone || !password) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      res.status(400).json({ error: 'Phone number already registered' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    await cacheSession(`signup_otp:${email}`, { otp, phone, password: hashedPassword }, 600);
    await sendOtpEmail(email, otp);

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

    const cached = await getCachedSession(`signup_otp:${email}`);
    if (!cached) {
      res.status(400).json({ error: 'Verification code expired or invalid' });
      return;
    }

    if (cached.otp !== otp) {
      res.status(400).json({ error: 'Incorrect verification code' });
      return;
    }

    const user = new User({
      email,
      phone: cached.phone,
      password: cached.password,
    });
    await user.save();

    await deleteCachedSession(`signup_otp:${email}`);

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

    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ error: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ error: 'Invalid credentials' });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await cacheSession(`login_otp:${email}`, { otp }, 600);
    await sendLoginOtpEmail(email, otp);

    res.status(200).json({ requiresOtp: true, email });
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

    const cached = await getCachedSession(`login_otp:${email}`);
    if (!cached) {
      res.status(400).json({ error: 'Verification code expired or invalid' });
      return;
    }

    if (cached.otp !== otp) {
      res.status(400).json({ error: 'Incorrect verification code' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await deleteCachedSession(`login_otp:${email}`);

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
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
