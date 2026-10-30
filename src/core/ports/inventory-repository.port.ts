import { InventoryTransactionEntity, InventoryTransactionType } from "../entities/inventory.entity";

export interface CreateInventoryTransactionInput {
  productId: string;
  type: InventoryTransactionType;
  quantityChange: number;
  referenceId?: string;
  note?: string;
}

export interface IInventoryRepository {
  recordTransaction(input: CreateInventoryTransactionInput): Promise<InventoryTransactionEntity>;
  getHistory(productId?: string, limit?: number): Promise<InventoryTransactionEntity[]>;
  adjustStock(productId: string, newStock: number, note?: string): Promise<{ previousStock: number; newStock: number }>;
}

