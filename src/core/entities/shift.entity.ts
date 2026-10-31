export type ShiftStatus = "OPEN" | "CLOSED";
export type CashTransactionType = "PAYOUT" | "DROP" | "IN";

export interface CashTransactionEntity {
  id: string;
  shiftId: string;
  type: CashTransactionType;
  amount: number;
  reason: string;
  performedBy: string;
  createdAt: Date;
}

export interface CashShiftEntity {
  id: string;
  shiftCode: string;
  cashierName: string;
  status: ShiftStatus;
  startTime: Date;
  endTime?: Date | null;
  startingCash: number;
  endingCash?: number | null;
  expectedCash: number;
  difference?: number | null;
  cashSales: number;
  bankSales: number;
  cardSales: number;
  totalSales: number;
  ordersCount: number;
  cashPayout: number;
  cashDrop: number;
  cashIn: number;
  notes?: string | null;
  transactions?: CashTransactionEntity[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Tính số tiền mặt lý thuyết trong két:
 * = Tiền mặt ban đầu + Tiền mặt bán hàng + Tiền nạp thêm - Chi tiền mặt - Rút tiền nộp két
 */
export function calculateExpectedCash(params: {
  startingCash: number;
  cashSales: number;
  cashIn: number;
  cashPayout: number;
  cashDrop: number;
}): number {
  return (
    params.startingCash +
    params.cashSales +
    params.cashIn -
    params.cashPayout -
    params.cashDrop
  );
}

/**
 * Tính chênh lệch tiền mặt khi đóng ca:
 * = Tiền mặt thực tế đếm được - Tiền mặt lý thuyết
 * > 0: Thừa tiền
 * < 0: Thiếu tiền
 * = 0: Khớp tiền hoàn hảo
 */
export function calculateDifference(actualCash: number, expectedCash: number): number {
  return actualCash - expectedCash;
}

