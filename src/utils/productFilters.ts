import type { ProductItem } from '@/types/product';
import { isProductOutOfStock } from './inventory';

export const ALL_FILTER_VALUE = 'all';

export type AvailabilityFilter = 'all' | 'in-stock' | 'out-of-stock';
export type ProductSort = 'featured' | 'price-low' | 'price-high' | 'newest';

interface ProductFilterInput {
  searchQuery: string;
  category: string;
  size: string;
  availability: AvailabilityFilter;
  sort: ProductSort;
}

const sizeRank = ['xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl'];

const uniqueSortedValues = (values: string[]): string[] => {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
};

const sortSizes = (sizes: string[]): string[] => {
  return uniqueSortedValues(sizes).sort((a, b) => {
    const aRank = sizeRank.indexOf(a.toLowerCase());
    const bRank = sizeRank.indexOf(b.toLowerCase());
    if (aRank !== -1 || bRank !== -1) return (aRank === -1 ? 99 : aRank) - (bRank === -1 ? 99 : bRank);
    return a.localeCompare(b, undefined, { numeric: true });
  });
};

export const getProductFilterOptions = (products: ProductItem[]): { categories: string[]; sizes: string[] } => ({
  categories: uniqueSortedValues(products.map((product) => product.category)),
  sizes: sortSizes(products.map((product) => product.size)),
});

const matchesAvailability = (product: ProductItem, filter: AvailabilityFilter): boolean => {
  if (filter === 'in-stock') return !isProductOutOfStock(product);
  if (filter === 'out-of-stock') return isProductOutOfStock(product);
  return true;
};

const sortProducts = (products: ProductItem[], sort: ProductSort): ProductItem[] => {
  const sorted = [...products];
  if (sort === 'price-low') return sorted.sort((a, b) => a.price - b.price);
  if (sort === 'price-high') return sorted.sort((a, b) => b.price - a.price);
  if (sort === 'newest') return sorted.sort((a, b) => b._id.localeCompare(a._id));
  return sorted;
};

export const getVisibleProducts = (products: ProductItem[], filters: ProductFilterInput): ProductItem[] => {
  const query = filters.searchQuery.trim().toLowerCase();
  const filtered = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query) ||
      (product.description || '').toLowerCase().includes(query);
    const matchesCategory = filters.category === ALL_FILTER_VALUE || product.category === filters.category;
    const matchesSize = filters.size === ALL_FILTER_VALUE || product.size === filters.size;
    return matchesSearch && matchesCategory && matchesSize && matchesAvailability(product, filters.availability);
  });

  return sortProducts(filtered, filters.sort);
};
