import { ProductEntity, CategoryEntity } from "../entities/product.entity";

export interface FindProductsFilter {
  search?: string;
  categoryId?: string;
  isLowStockOnly?: boolean;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface IProductRepository {
  findById(id: string): Promise<ProductEntity | null>;
  findBySkuOrBarcode(code: string): Promise<ProductEntity | null>;
  findMany(filter?: FindProductsFilter): Promise<{ products: (ProductEntity & { categoryName?: string | null })[]; total: number }>;
  create(data: Omit<ProductEntity, "id" | "createdAt" | "updatedAt">): Promise<ProductEntity>;
  update(id: string, data: Partial<Omit<ProductEntity, "id" | "createdAt" | "updatedAt">>): Promise<ProductEntity>;
  delete(id: string): Promise<void>;
  listCategories(): Promise<CategoryEntity[]>;
  createCategory(data: { name: string; slug: string; description?: string | null }): Promise<CategoryEntity>;
}

