export interface ProductItem {
  _id: string;
  name: string;
  category: string;
  price: number;
  size: string;
  stock?: number;
  initialStock?: number;
  reservedStock?: number;
  condition?: string;
  image: string;
  description?: string;
  status?: string;
}
