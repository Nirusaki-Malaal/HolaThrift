import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { sendWelcomeEmail } from '../services/mail';
import { cacheSession, getCachedSession } from '../services/redis';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'holathrift-super-secret-jwt-token-key';

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
    const user = new User({
      email,
      phone,
      password: hashedPassword,
    });
    await user.save();

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
    const userSession = { id: user._id, email: user.email, phone: user.phone };
    
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

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
    const userSession = { id: user._id, email: user.email, phone: user.phone };
    
    await cacheSession(`session:${token}`, userSession);

    res.json({ token, user: userSession });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    
    const cached = await getCachedSession(`session:${token}`);
    if (cached) {
      res.json(cached);
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const userSession = { id: user._id, email: user.email, phone: user.phone };
    await cacheSession(`session:${token}`, userSession);

    res.json(userSession);
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
