import { IProductRepository, FindProductsFilter } from "../ports/product-repository.port";
import { ProductEntity } from "../entities/product.entity";
import { ValidationError, NotFoundError, ConflictError } from "../errors/app-error";

export class ListProductsUseCase {
  constructor(private readonly productRepo: IProductRepository) {}

  async execute(filter?: FindProductsFilter) {
    return await this.productRepo.findMany(filter);
  }
}

export class GetProductByCodeUseCase {
  constructor(private readonly productRepo: IProductRepository) {}

  async execute(code: string): Promise<ProductEntity | null> {
    if (!code || !code.trim()) {
      throw new ValidationError("Mã vạch hoặc SKU không được để trống.");
    }
    return await this.productRepo.findBySkuOrBarcode(code.trim());
  }
}

export class CreateProductUseCase {
  constructor(private readonly productRepo: IProductRepository) {}

  async execute(data: {
    sku: string;
    barcode?: string | null;
    name: string;
    description?: string | null;
    costPrice: number;
    sellingPrice: number;
    stockQuantity: number;
    minStockThreshold?: number;
    unit?: string;
    categoryId?: string | null;
    imageUrl?: string | null;
  }): Promise<ProductEntity> {
    if (!data.name || !data.name.trim()) {
      throw new ValidationError("Tên sản phẩm không được để trống.");
    }
    if (!data.sku || !data.sku.trim()) {
      throw new ValidationError("Mã SKU không được để trống.");
    }
    if (data.sellingPrice < 0) {
      throw new ValidationError("Giá bán không được âm.");
    }
    if (data.costPrice < 0) {
      throw new ValidationError("Giá vốn không được âm.");
    }

    const existing = await this.productRepo.findBySkuOrBarcode(data.sku.trim());
    if (existing) {
      throw new ConflictError(`Mã SKU "${data.sku}" đã tồn tại trong hệ thống.`);
    }

    if (data.barcode && data.barcode.trim()) {
      const existingBarcode = await this.productRepo.findBySkuOrBarcode(data.barcode.trim());
      if (existingBarcode) {
        throw new ConflictError(`Mã vạch Barcode "${data.barcode}" đã tồn tại trong hệ thống.`);
      }
    }

    return await this.productRepo.create({
      sku: data.sku.trim().toUpperCase(),
      barcode: data.barcode?.trim() || null,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      costPrice: data.costPrice,
      sellingPrice: data.sellingPrice,
      stockQuantity: data.stockQuantity || 0,
      minStockThreshold: data.minStockThreshold !== undefined ? data.minStockThreshold : 5,
      unit: data.unit?.trim() || "Cái",
      imageUrl: data.imageUrl?.trim() || null,
      isActive: true,
      categoryId: data.categoryId || null,
    });
  }
}

export class UpdateProductUseCase {
  constructor(private readonly productRepo: IProductRepository) {}

  async execute(
    id: string,
    data: Partial<{
      sku: string;
      barcode?: string | null;
      name: string;
      description?: string | null;
      costPrice: number;
      sellingPrice: number;
      stockQuantity: number;
      minStockThreshold: number;
      unit: string;
      categoryId?: string | null;
      imageUrl?: string | null;
      isActive: boolean;
    }>
  ): Promise<ProductEntity> {
    const existing = await this.productRepo.findById(id);
    if (!existing) {
      throw new NotFoundError(`Không tìm thấy sản phẩm có ID: ${id}`);
    }

    if (data.sellingPrice !== undefined && data.sellingPrice < 0) {
      throw new ValidationError("Giá bán không được âm.");
    }

    return await this.productRepo.update(id, data);
  }
}

export class DeleteProductUseCase {
  constructor(private readonly productRepo: IProductRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.productRepo.findById(id);
    if (!existing) {
      throw new NotFoundError(`Không tìm thấy sản phẩm có ID: ${id}`);
    }
    await this.productRepo.delete(id);
  }
}

