import { prisma } from "@/infrastructure/db/prisma";
import { IProductRepository, FindProductsFilter } from "@/core/ports/product-repository.port";
import { ProductEntity, CategoryEntity } from "@/core/entities/product.entity";

export class PrismaProductRepository implements IProductRepository {
  async findById(id: string): Promise<ProductEntity | null> {
    const p = await prisma.product.findUnique({
      where: { id },
    });
    return p;
  }

  async findBySkuOrBarcode(code: string): Promise<ProductEntity | null> {
    const p = await prisma.product.findFirst({
      where: {
        OR: [
          { sku: { equals: code } },
          { barcode: { equals: code } },
        ],
      },
    });
    return p;
  }

  async findMany(filter?: FindProductsFilter): Promise<{ products: (ProductEntity & { categoryName?: string | null })[]; total: number }> {
    const where: any = {};

    if (filter?.search) {
      const q = filter.search.trim();
      where.OR = [
        { name: { contains: q } },
        { sku: { contains: q } },
        { barcode: { contains: q } },
      ];
    }

    if (filter?.categoryId) {
      where.categoryId = filter.categoryId;
    }

    if (filter?.isActive !== undefined) {
      where.isActive = filter.isActive;
    }

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: { name: true },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.product.count({ where }),
    ]);

    let products = items.map((p) => ({
      ...p,
      categoryName: p.category?.name || null,
    }));

    if (filter?.isLowStockOnly) {
      products = products.filter((p) => p.stockQuantity <= p.minStockThreshold);
    }

    return {
      products,
      total: filter?.isLowStockOnly ? products.length : total,
    };
  }

  async create(data: Omit<ProductEntity, "id" | "createdAt" | "updatedAt">): Promise<ProductEntity> {
    return await prisma.product.create({
      data,
    });
  }

  async update(id: string, data: Partial<Omit<ProductEntity, "id" | "createdAt" | "updatedAt">>): Promise<ProductEntity> {
    return await prisma.product.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.product.delete({
      where: { id },
    });
  }

  async listCategories(): Promise<CategoryEntity[]> {
    return await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
  }

  async createCategory(data: { name: string; slug: string; description?: string | null }): Promise<CategoryEntity> {
    return await prisma.category.create({
      data,
    });
  }
}

