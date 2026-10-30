export type InventoryTransactionType = "SALE" | "RESTOCK" | "ADJUSTMENT" | "RETURN";

export interface InventoryTransactionEntity {
  id: string;
  productId: string;
  productName?: string;
  sku?: string;
  type: InventoryTransactionType;
  quantityChange: number;
  previousStock: number;
  newStock: number;
  referenceId?: string | null;
  note?: string | null;
  createdAt: Date;
}

