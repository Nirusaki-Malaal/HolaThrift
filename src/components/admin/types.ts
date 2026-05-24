export type ProductStatus = 'available' | 'reserved' | 'sold';

export interface ProductItem {
  _id: string;
  name: string;
  category: string;
  price: number;
  size: string;
  stock?: number;
  reservedStock?: number;
  condition?: string;
  image: string;
  description?: string;
  status?: ProductStatus | string;
}

export interface ProductFormValues {
  name: string;
  category: string;
  price: string;
  size: string;
  stock: string;
  image: string;
  description: string;
}

export interface ProductPayload {
  name: string;
  category: string;
  price: number;
  size: string;
  stock: number;
  image: string;
  description: string;
}
