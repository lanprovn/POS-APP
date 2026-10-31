import { prisma } from "@/infrastructure/db/prisma";
import { 
  IShiftRepository, 
  OpenShiftInput, 
  CloseShiftInput, 
  AddCashTransactionInput, 
  FindShiftsFilter 
} from "@/core/ports/shift-repository.port";
import { 
  CashShiftEntity, 
  CashTransactionEntity, 
  ShiftStatus, 
  CashTransactionType,
  calculateExpectedCash,
  calculateDifference
} from "@/core/entities/shift.entity";

export class PrismaShiftRepository implements IShiftRepository {
  async getCurrentOpenShift(): Promise<CashShiftEntity | null> {
    const shift = await prisma.cashShift.findFirst({
      where: { status: "OPEN" },
      orderBy: { startTime: "desc" },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!shift) return null;
    return this.mapToEntity(shift);
  }

  async findById(id: string): Promise<CashShiftEntity | null> {
    const shift = await prisma.cashShift.findUnique({
      where: { id },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!shift) return null;
    return this.mapToEntity(shift);
  }

  async findMany(filter?: FindShiftsFilter): Promise<{
    shifts: CashShiftEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, filter?.page || 1);
    const limit = Math.max(1, Math.min(100, filter?.limit || 15));
    const skip = (page - 1) * limit;

    const [rawShifts, total] = await Promise.all([
      prisma.cashShift.findMany({
        skip,
        take: limit,
        orderBy: { startTime: "desc" },
        include: {
          transactions: {
            orderBy: { createdAt: "desc" },
          },
        },
      }),
      prisma.cashShift.count(),
    ]);

    return {
      shifts: rawShifts.map((s) => this.mapToEntity(s)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async openShift(input: OpenShiftInput): Promise<CashShiftEntity> {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const countToday = await prisma.cashShift.count({
      where: {
        startTime: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        },
      },
    });
    const shiftCode = `CA-${dateStr}-${String(countToday + 1).padStart(2, "0")}`;

    const created = await prisma.cashShift.create({
      data: {
        shiftCode,
        cashierName: input.cashierName,
        status: "OPEN",
        startingCash: input.startingCash,
        expectedCash: input.startingCash,
        notes: input.notes || null,
      },
      include: {
        transactions: true,
      },
    });

    return this.mapToEntity(created);
  }

  async closeShift(input: CloseShiftInput): Promise<CashShiftEntity> {
    return await prisma.$transaction(async (tx) => {
      const shift = await tx.cashShift.findUnique({
        where: { id: input.shiftId },
      });

      if (!shift) {
        throw new Error("Không tìm thấy ca làm việc để đóng.");
      }

      const expected = calculateExpectedCash({
        startingCash: shift.startingCash,
        cashSales: shift.cashSales,
        cashIn: shift.cashIn,
        cashPayout: shift.cashPayout,
        cashDrop: shift.cashDrop,
      });

      const difference = calculateDifference(input.endingCash, expected);

      const updated = await tx.cashShift.update({
        where: { id: input.shiftId },
        data: {
          status: "CLOSED",
          endTime: new Date(),
          endingCash: input.endingCash,
          expectedCash: expected,
          difference,
          notes: input.notes !== undefined ? input.notes : shift.notes,
        },
        include: {
          transactions: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      return this.mapToEntity(updated);
    });
  }

  async addCashTransaction(input: AddCashTransactionInput): Promise<CashTransactionEntity> {
    return await prisma.$transaction(async (tx) => {
      const transaction = await tx.cashTransaction.create({
        data: {
          shiftId: input.shiftId,
          type: input.type,
          amount: input.amount,
          reason: input.reason,
          performedBy: input.performedBy || "Thu ngân",
        },
      });

      const fieldToIncrement =
        input.type === "PAYOUT"
          ? { cashPayout: { increment: input.amount } }
          : input.type === "DROP"
          ? { cashDrop: { increment: input.amount } }
          : { cashIn: { increment: input.amount } };

      await tx.cashShift.update({
        where: { id: input.shiftId },
        data: fieldToIncrement,
      });

      const shift = await tx.cashShift.findUnique({
        where: { id: input.shiftId },
      });

      if (shift) {
        const expected = calculateExpectedCash({
          startingCash: shift.startingCash,
          cashSales: shift.cashSales,
          cashIn: shift.cashIn,
          cashPayout: shift.cashPayout,
          cashDrop: shift.cashDrop,
        });

        await tx.cashShift.update({
          where: { id: input.shiftId },
          data: { expectedCash: expected },
        });
      }

      return {
        id: transaction.id,
        shiftId: transaction.shiftId,
        type: transaction.type as CashTransactionType,
        amount: transaction.amount,
        reason: transaction.reason,
        performedBy: transaction.performedBy,
        createdAt: transaction.createdAt,
      };
    });
  }

  async recordOrderSales(shiftId: string, paymentMethod: string, amount: number): Promise<void> {
    const isCash = paymentMethod === "CASH";
    const isBank = paymentMethod === "BANK_TRANSFER";
    const isCard = paymentMethod === "CARD";

    await prisma.cashShift.update({
      where: { id: shiftId },
      data: {
        ordersCount: { increment: 1 },
        totalSales: { increment: amount },
        ...(isCash && {
          cashSales: { increment: amount },
          expectedCash: { increment: amount },
        }),
        ...(isBank && { bankSales: { increment: amount } }),
        ...(isCard && { cardSales: { increment: amount } }),
      },
    });
  }

  private mapToEntity(raw: any): CashShiftEntity {
    return {
      id: raw.id,
      shiftCode: raw.shiftCode,
      cashierName: raw.cashierName,
      status: raw.status as ShiftStatus,
      startTime: raw.startTime,
      endTime: raw.endTime,
      startingCash: raw.startingCash,
      endingCash: raw.endingCash,
      expectedCash: raw.expectedCash,
      difference: raw.difference,
      cashSales: raw.cashSales,
      bankSales: raw.bankSales,
      cardSales: raw.cardSales,
      totalSales: raw.totalSales,
      ordersCount: raw.ordersCount,
      cashPayout: raw.cashPayout,
      cashDrop: raw.cashDrop,
      cashIn: raw.cashIn,
      notes: raw.notes,
      transactions: raw.transactions
        ? raw.transactions.map((t: any) => ({
            id: t.id,
            shiftId: t.shiftId,
            type: t.type as CashTransactionType,
            amount: t.amount,
            reason: t.reason,
            performedBy: t.performedBy,
            createdAt: t.createdAt,
          }))
        : undefined,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }
}

