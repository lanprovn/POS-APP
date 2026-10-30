import { prisma } from "@/infrastructure/db/prisma";
import { IInventoryRepository, CreateInventoryTransactionInput } from "@/core/ports/inventory-repository.port";
import { InventoryTransactionEntity, InventoryTransactionType } from "@/core/entities/inventory.entity";

export class PrismaInventoryRepository implements IInventoryRepository {
  async recordTransaction(input: CreateInventoryTransactionInput): Promise<InventoryTransactionEntity> {
    const product = await prisma.product.findUnique({
      where: { id: input.productId },
    });

    const prevStock = product?.stockQuantity || 0;
    const newStock = Math.max(0, prevStock + input.quantityChange);

    await prisma.product.update({
      where: { id: input.productId },
      data: { stockQuantity: newStock },
    });

    const record = await prisma.inventoryTransaction.create({
      data: {
        productId: input.productId,
        type: input.type,
        quantityChange: input.quantityChange,
        previousStock: prevStock,
        newStock,
        referenceId: input.referenceId,
        note: input.note,
      },
    });

    return {
      ...record,
      type: record.type as InventoryTransactionType,
    };
  }

  async getHistory(productId?: string, limit: number = 50): Promise<InventoryTransactionEntity[]> {
    const where: any = {};
    if (productId) where.productId = productId;

    const records = await prisma.inventoryTransaction.findMany({
      where,
      include: {
        product: {
          select: { name: true, sku: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return records.map((r) => ({
      ...r,
      productName: r.product?.name,
      sku: r.product?.sku,
      type: r.type as InventoryTransactionType,
    }));
  }

  async adjustStock(productId: string, newStock: number, note?: string): Promise<{ previousStock: number; newStock: number }> {
    return await prisma.$transaction(async (tx) => {
      const prod = await tx.product.findUnique({
        where: { id: productId },
      });

      const prevStock = prod?.stockQuantity || 0;
      const diff = newStock - prevStock;

      await tx.product.update({
        where: { id: productId },
        data: { stockQuantity: newStock },
      });

      await tx.inventoryTransaction.create({
        data: {
          productId,
          type: "ADJUSTMENT",
          quantityChange: diff,
          previousStock: prevStock,
          newStock,
          note: note || `Điều chỉnh kiểm kho thủ công từ ${prevStock} sang ${newStock}`,
        },
      });

      return { previousStock: prevStock, newStock };
    });
  }
}

