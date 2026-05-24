import type { ProductFormValues, ProductItem, ProductPayload, ProductStatus } from './types';

export const productCategories = ['Outerwear', 'Tops', 'Accessories'];

export const createEmptyProductForm = (): ProductFormValues => ({
  name: '',
  category: 'Outerwear',
  price: '',
  size: '',
  stock: '1',
  image: '',
  description: '',
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
  stock: String(product.stock ?? (toProductStatus(product.status) === 'sold' ? 0 : 1)),
  image: product.image,
  description: product.description || '',
});

export const productFormToPayload = (values: ProductFormValues): ProductPayload => ({
  name: values.name.trim(),
  category: values.category,
  price: Number(values.price),
  size: values.size.trim(),
  stock: Number(values.stock),
  image: values.image.trim(),
  description: values.description.trim(),
});

export const isProductFormComplete = (values: ProductFormValues): boolean => {
  return Boolean(
    values.name.trim() &&
    values.category &&
    values.price &&
    values.size.trim() &&
    values.stock &&
    values.image.trim()
  );
};
