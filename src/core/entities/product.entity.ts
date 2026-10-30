export interface ProductEntity {
  id: string;
  sku: string;
  barcode?: string | null;
  name: string;
  description?: string | null;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minStockThreshold: number;
  unit: string;
  imageUrl?: string | null;
  isActive: boolean;
  categoryId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryEntity {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function isLowStock(product: ProductEntity): boolean {
  return product.stockQuantity <= product.minStockThreshold;
}

