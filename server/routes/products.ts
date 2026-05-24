import { Router, Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import Product from '../models/Product';
import { cacheSession, getCachedSession, deleteCachedSession, redisClient } from '../services/redis';

const router = Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'holathrift',
  api_key: process.env.CLOUDINARY_API_KEY || 'LqyAPS1gG-ArjeiTGYkGs4VmYm0',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'mock-secret',
});

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());

const checkAdmin = async (req: Request): Promise<boolean> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.split(' ')[1];
  const session = await getCachedSession(`session:${token}`);
  if (!session) return false;
  return ADMIN_EMAILS.includes(session.email.toLowerCase());
};

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    let products;
    const cached = await getCachedSession('products:all');
    if (cached) {
      products = cached;
    } else {
      products = await Product.find({});
      if (products.length === 0) {
        const defaultProducts = [
          {
            name: "Vintage Canvas Work Jacket",
            category: "Outerwear",
            price: 3499,
            size: "L",
            condition: "9/10 Excellent Fade",
            image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=500&q=80",
            description: "Rugged vintage canvas jacket with beautiful natural washing and corduroy collar details.",
          },
          {
            name: "Classic Brown Collar Sweatshirt",
            category: "Tops",
            price: 1899,
            size: "M",
            condition: "10/10 Mint",
            image: "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=500&q=80",
            description: "Comfortable heavyweight rib collar sweat top in rich chocolate brown earth tones.",
          },
          {
            name: "Emerald Ribbed Johnny Collar",
            category: "Tops",
            price: 1599,
            size: "S",
            condition: "Deadstock",
            image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=500&q=80",
            description: "Fine knit ribbed sweater polo with relaxed open johnny collar neck and vintage cuffs.",
          },
          {
            name: "Boxy Striped Rugby Polo",
            category: "Tops",
            price: 1299,
            size: "XL",
            condition: "8.5/10 Very Good",
            image: "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=500&q=80",
            description: "Retro wide stripe rugby shirt featuring traditional canvas white collar and relaxed fit.",
          }
        ];
        await Product.insertMany(defaultProducts);
        products = await Product.find({});
      }
    }

    let modified = false;
    for (let i = 0; i < products.length; i++) {
      if (products[i].status === 'reserved') {
        const key = `reservation:product:${products[i]._id}`;
        const hasRes = redisClient.isOpen ? await redisClient.exists(key) : 0;
        if (!hasRes) {
          await Product.findByIdAndUpdate(products[i]._id, { status: 'available' });
          products[i].status = 'available';
          modified = true;
        }
      }
    }

    if (modified || !cached) {
      await cacheSession('products:all', products, 86400);
    }
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const isadmin = await checkAdmin(req);
    if (!isadmin) {
      res.status(403).json({ error: 'Unauthorized admin access required' });
      return;
    }
    const { name, category, price, size, condition, image, description } = req.body;
    if (!name || !category || !price || !size || !condition || !image) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }
    const product = new Product({ name, category, price: Number(price), size, condition, image, description });
    await product.save();
    await deleteCachedSession('products:all');
    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const isadmin = await checkAdmin(req);
    if (!isadmin) {
      res.status(403).json({ error: 'Unauthorized admin access required' });
      return;
    }
    const { name, category, price, size, condition, image, description } = req.body;
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { name, category, price: Number(price), size, condition, image, description },
      { new: true }
    );
    if (!updated) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    await deleteCachedSession('products:all');
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const isadmin = await checkAdmin(req);
    if (!isadmin) {
      res.status(403).json({ error: 'Unauthorized admin access required' });
      return;
    }
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    await deleteCachedSession('products:all');
    res.json({ message: 'Product deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/upload', async (req: Request, res: Response): Promise<void> => {
  try {
    const isadmin = await checkAdmin(req);
    if (!isadmin) {
      res.status(403).json({ error: 'Unauthorized admin access required' });
      return;
    }
    const { image } = req.body;
    if (!image) {
      res.status(400).json({ error: 'No image data provided' });
      return;
    }
    try {
      const uploadResponse = await cloudinary.uploader.upload(image, {
        folder: 'holathrift_products',
      });
      res.status(200).json({ url: uploadResponse.secure_url });
    } catch (cErr) {
      const matches = image.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches) {
        const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        const filename = `img_${Date.now()}.${ext}`;
        const dir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(path.join(dir, filename), buffer);
        res.status(200).json({ url: `/uploads/${filename}` });
      } else {
        res.status(400).json({ error: 'Invalid base64 image data format' });
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
