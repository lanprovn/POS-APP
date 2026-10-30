import { CashShiftEntity, CashTransactionEntity, CashTransactionType } from "../entities/shift.entity";

export interface OpenShiftInput {
  cashierName: string;
  startingCash: number;
  notes?: string;
}

export interface CloseShiftInput {
  shiftId: string;
  endingCash: number;
  notes?: string;
}

export interface AddCashTransactionInput {
  shiftId: string;
  type: CashTransactionType;
  amount: number;
  reason: string;
  performedBy?: string;
}

export interface FindShiftsFilter {
  page?: number;
  limit?: number;
}

export interface IShiftRepository {
  getCurrentOpenShift(): Promise<CashShiftEntity | null>;
  findById(id: string): Promise<CashShiftEntity | null>;
  findMany(filter?: FindShiftsFilter): Promise<{
    shifts: CashShiftEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  openShift(input: OpenShiftInput): Promise<CashShiftEntity>;
  closeShift(input: CloseShiftInput): Promise<CashShiftEntity>;
  addCashTransaction(input: AddCashTransactionInput): Promise<CashTransactionEntity>;
  recordOrderSales(shiftId: string, paymentMethod: string, amount: number): Promise<void>;
}
