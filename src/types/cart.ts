import type { ProductItem } from '@/types/product';

export interface CartItem {
  product: ProductItem;
  quantity: number;
}
