import type { ProductFormValues, ProductItem, ProductPayload, ProductStatus } from './types';

export const productCategories = ['Outerwear', 'Tops', 'Accessories'];

export const productStatusOptions: Array<{ value: ProductStatus; label: string }> = [
  { value: 'available', label: 'Available (1 Left)' },
  { value: 'reserved', label: 'Reserved (Held)' },
  { value: 'sold', label: 'Sold Out (0 Left)' },
];

export const createEmptyProductForm = (): ProductFormValues => ({
  name: '',
  category: 'Outerwear',
  price: '',
  size: '',
  condition: '',
  image: '',
  description: '',
  status: 'available',
});

export const toProductStatus = (status?: string): ProductStatus => {
  if (status === 'reserved' || status === 'sold') return status;
  return 'available';
};

export const productToFormValues = (product: ProductItem): ProductFormValues => ({
  name: product.name,
  category: product.category,
  price: product.price.toString(),
  size: product.size,
  condition: product.condition,
  image: product.image,
  description: product.description || '',
  status: toProductStatus(product.status),
});

export const productFormToPayload = (values: ProductFormValues): ProductPayload => ({
  name: values.name.trim(),
  category: values.category,
  price: Number(values.price),
  size: values.size.trim(),
  condition: values.condition.trim(),
  image: values.image.trim(),
  description: values.description.trim(),
  status: values.status,
});

export const isProductFormComplete = (values: ProductFormValues): boolean => {
  return Boolean(
    values.name.trim() &&
    values.category &&
    values.price &&
    values.size.trim() &&
    values.condition.trim() &&
    values.image.trim()
  );
};
