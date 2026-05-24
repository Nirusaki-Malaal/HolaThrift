import { Router, Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import Product from '../models/Product';
import { cacheSession, getCachedSession, deleteCachedSession, redisClient } from '../services/redis';
import { normalizeInventory } from '../services/inventory';
import { isAdminRequest } from '../utils/auth';

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

const parseImageDataUrl = (image: string): { ext: string; buffer: Buffer } | null => {
  const matches = image.match(/^data:image\/([\w.+-]+);base64,(.+)$/);
  if (!matches) return null;
  const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1].toLowerCase();
  if (!allowedImageTypes.has(ext)) return null;
  return { ext, buffer: Buffer.from(matches[2], 'base64') };
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
    const { name, category, price, size, stock, image, description } = req.body;
    if (!name || !category || !price || !size || stock === undefined || stock === null || !image) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }
    const numericPrice = Number(price);
    const numericStock = Number(stock);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0 || !Number.isFinite(numericStock) || numericStock < 0) {
      res.status(400).json({ error: 'Price and stock must be valid numbers' });
      return;
    }
    const inventory = normalizeInventory({ stock: numericStock, initialStock: numericStock, reservedStock: 0 });
    const product = new Product({ name, category, price: numericPrice, size, image, description, ...inventory });
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
    const { name, category, price, size, stock, image, description } = req.body;
    const numericPrice = Number(price);
    const numericStock = Number(stock);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0 || !Number.isFinite(numericStock) || numericStock < 0) {
      res.status(400).json({ error: 'Price and stock must be valid numbers' });
      return;
    }
    const existing = await Product.findById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    const currentInventory = existing.toObject();
    const nextInitialStock = Math.max(Number(currentInventory.initialStock || 0), numericStock);
    const inventory = normalizeInventory({ ...currentInventory, stock: numericStock, initialStock: nextInitialStock, reservedStock: 0 });
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { name, category, price: numericPrice, size, image, description, ...inventory },
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
      const filename = `img_${Date.now()}.${parsedImage.ext}`;
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
