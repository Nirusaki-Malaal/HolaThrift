import { Router, Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { randomBytes } from 'crypto';
import fs from 'fs';
import path from 'path';
import Product from '../models/Product';
import { cacheSession, getCachedSession, deleteCachedSession, redisClient } from '../services/redis';
import { normalizeInventory } from '../services/inventory';
import { isAdminRequest } from '../utils/auth';
import { cleanLongText, cleanText, isRecord, isValidObjectId } from '../utils/validation';

const router = Router();

interface ProductListItem {
  _id: unknown;
  status?: string;
  stock?: number;
  initialStock?: number;
  reservedStock?: number;
  [key: string]: unknown;
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const allowedImageTypes = new Set(['jpeg', 'jpg', 'png', 'webp']);
const maxUploadBytes = Number(process.env.IMAGE_UPLOAD_MAX_BYTES || 5 * 1024 * 1024);

interface ProductPayload {
  name: string;
  category: string;
  price: number;
  size: string;
  stock: number;
  image: string;
  description: string;
}

const hasImageSignature = (ext: string, buffer: Buffer): boolean => {
  if (ext === 'jpg') return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (ext === 'png') return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (ext === 'webp') return buffer.length > 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  return false;
};

const parseImageDataUrl = (image: string): { ext: string; buffer: Buffer } | null => {
  const matches = image.match(/^data:image\/([\w.+-]+);base64,(.+)$/);
  if (!matches) return null;
  const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1].toLowerCase();
  if (!allowedImageTypes.has(ext)) return null;
  const data = matches[2].replace(/\s/g, '');
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(data) || data.length % 4 !== 0) return null;
  const buffer = Buffer.from(data, 'base64');
  if (!hasImageSignature(ext, buffer)) return null;
  return { ext, buffer };
};

const getProductPayload = (body: unknown): ProductPayload | null => {
  if (!isRecord(body)) return null;
  const name = cleanText(body.name, 90);
  const category = cleanText(body.category, 50);
  const size = cleanText(body.size, 24);
  const image = cleanText(body.image, 2048);
  const description = cleanLongText(body.description, 1200);
  const price = Number(body.price);
  const stock = Number(body.stock);
  if (!name || !category || !size || !image || !Number.isFinite(price) || price <= 0 || !Number.isFinite(stock) || stock < 0) {
    return null;
  }
  return {
    name,
    category,
    price,
    size,
    stock: Math.floor(stock),
    image,
    description,
  };
};

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    let products: ProductListItem[];
    const cached = await getCachedSession<ProductListItem[]>('products:all');
    if (cached) {
      products = cached;
    } else {
      products = await Product.find({}).lean() as ProductListItem[];
    }

    let modified = false;
    for (let i = 0; i < products.length; i++) {
      const inventory = normalizeInventory(products[i]);
      if (
        products[i].stock !== inventory.stock ||
        products[i].initialStock !== inventory.initialStock ||
        products[i].reservedStock !== inventory.reservedStock ||
        products[i].status !== inventory.status
      ) {
        await Product.findByIdAndUpdate(products[i]._id, inventory);
        Object.assign(products[i], inventory);
        modified = true;
      }

      if (inventory.reservedStock > 0) {
        const key = `reservation:product:${products[i]._id}`;
        const hasReservation = redisClient.isOpen ? await redisClient.exists(key) : 0;
        if (!hasReservation) {
          const releasedInventory = normalizeInventory({ ...products[i], reservedStock: 0 });
          await Product.findByIdAndUpdate(products[i]._id, releasedInventory);
          Object.assign(products[i], releasedInventory);
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
    const isadmin = await isAdminRequest(req);
    if (!isadmin) {
      res.status(403).json({ error: 'Unauthorized admin access required' });
      return;
    }
    const payload = getProductPayload(req.body);
    if (!payload) {
      res.status(400).json({ error: 'Valid product details are required' });
      return;
    }
    const inventory = normalizeInventory({ stock: payload.stock, initialStock: payload.stock, reservedStock: 0 });
    const product = new Product({ ...payload, ...inventory });
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
    const isadmin = await isAdminRequest(req);
    if (!isadmin) {
      res.status(403).json({ error: 'Unauthorized admin access required' });
      return;
    }
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ error: 'Valid product id is required' });
      return;
    }
    const payload = getProductPayload(req.body);
    if (!payload) {
      res.status(400).json({ error: 'Valid product details are required' });
      return;
    }
    const existing = await Product.findById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    const currentInventory = existing.toObject();
    const nextInitialStock = Math.max(Number(currentInventory.initialStock || 0), payload.stock);
    const inventory = normalizeInventory({ ...currentInventory, stock: payload.stock, initialStock: nextInitialStock, reservedStock: 0 });
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { ...payload, ...inventory },
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
    const isadmin = await isAdminRequest(req);
    if (!isadmin) {
      res.status(403).json({ error: 'Unauthorized admin access required' });
      return;
    }
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ error: 'Valid product id is required' });
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
    const isadmin = await isAdminRequest(req);
    if (!isadmin) {
      res.status(403).json({ error: 'Unauthorized admin access required' });
      return;
    }
    const { image } = req.body;
    if (!image || typeof image !== 'string') {
      res.status(400).json({ error: 'No image data provided' });
      return;
    }
    const parsedImage = parseImageDataUrl(image);
    if (!parsedImage) {
      res.status(400).json({ error: 'Invalid image data format' });
      return;
    }
    if (parsedImage.buffer.length > maxUploadBytes) {
      res.status(413).json({ error: 'Image file is too large' });
      return;
    }
    try {
      const uploadResponse = await cloudinary.uploader.upload(image, {
        folder: 'holathrift_products',
      });
      res.status(200).json({ url: uploadResponse.secure_url });
    } catch {
      const filename = `img_${Date.now()}_${randomBytes(6).toString('hex')}.${parsedImage.ext}`;
      const dir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(path.join(dir, filename), parsedImage.buffer);
      res.status(200).json({ url: `/uploads/${filename}` });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
