export interface ProductItem {
  _id: string;
  name: string;
  category: string;
  price: number;
  size: string;
  condition: string;
  image: string;
  description?: string;
  status?: string;
}
