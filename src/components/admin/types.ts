export type ProductStatus = 'available' | 'reserved' | 'sold';

export interface ProductItem {
  _id: string;
  name: string;
  category: string;
  price: number;
  size: string;
  condition: string;
  image: string;
  description?: string;
  status?: ProductStatus | string;
}

export interface ProductFormValues {
  name: string;
  category: string;
  price: string;
  size: string;
  condition: string;
  image: string;
  description: string;
  status: ProductStatus;
}

export interface ProductPayload {
  name: string;
  category: string;
  price: number;
  size: string;
  condition: string;
  image: string;
  description: string;
  status: ProductStatus;
}
