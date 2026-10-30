import { IShiftRepository, OpenShiftInput, CloseShiftInput, AddCashTransactionInput, FindShiftsFilter } from "../ports/shift-repository.port";
import { CashShiftEntity, CashTransactionEntity } from "../entities/shift.entity";
import { ValidationError, NotFoundError, ConflictError } from "../errors/app-error";

export class GetCurrentShiftUseCase {
  constructor(private readonly shiftRepo: IShiftRepository) {}

  async execute(): Promise<CashShiftEntity | null> {
    return await this.shiftRepo.getCurrentOpenShift();
  }
}

export class OpenShiftUseCase {
  constructor(private readonly shiftRepo: IShiftRepository) {}

  async execute(input: OpenShiftInput): Promise<CashShiftEntity> {
    if (!input.cashierName || input.cashierName.trim().length === 0) {
      throw new ValidationError("Tên thu ngân không được để trống.");
    }

    if (input.startingCash < 0) {
      throw new ValidationError("Tiền mặt đầu ca không được là số âm.");
    }

    // Kiểm tra xem đã có ca nào đang mở chưa
    const existing = await this.shiftRepo.getCurrentOpenShift();
    if (existing) {
      throw new ConflictError(
        `Hiện đang có ca làm việc [${existing.shiftCode}] của thu ngân ${existing.cashierName} chưa đóng. Vui lòng đóng ca hiện tại trước khi mở ca mới.`
      );
    }

    return await this.shiftRepo.openShift({
      cashierName: input.cashierName.trim(),
      startingCash: input.startingCash,
      notes: input.notes?.trim() || undefined,
    });
  }
}

export class CloseShiftUseCase {
  constructor(private readonly shiftRepo: IShiftRepository) {}

  async execute(input: CloseShiftInput): Promise<CashShiftEntity> {
    if (input.endingCash < 0) {
      throw new ValidationError("Tiền mặt thực tế kiểm đếm không được âm.");
    }

    const shift = await this.shiftRepo.findById(input.shiftId);
    if (!shift) {
      throw new NotFoundError(`Không tìm thấy ca làm việc với ID: ${input.shiftId}`);
    }

    if (shift.status === "CLOSED") {
      throw new ValidationError(`Ca làm việc [${shift.shiftCode}] đã được đóng trước đó.`);
    }

    return await this.shiftRepo.closeShift(input);
  }
}

export class AddCashTransactionUseCase {
  constructor(private readonly shiftRepo: IShiftRepository) {}

  async execute(input: AddCashTransactionInput): Promise<CashTransactionEntity> {
    if (input.amount <= 0) {
      throw new ValidationError("Số tiền giao dịch phải lớn hơn 0.");
    }

    if (!input.reason || input.reason.trim().length === 0) {
      throw new ValidationError("Lý do thu / chi tiền không được để trống.");
    }

    const shift = await this.shiftRepo.findById(input.shiftId);
    if (!shift) {
      throw new NotFoundError(`Không tìm thấy ca làm việc.`);
    }

    if (shift.status !== "OPEN") {
      throw new ValidationError("Chỉ có thể ghi nhận thu/chi tiền khi ca đang mở.");
    }

    return await this.shiftRepo.addCashTransaction({
      ...input,
      reason: input.reason.trim(),
    });
  }
}

export class ListShiftsUseCase {
  constructor(private readonly shiftRepo: IShiftRepository) {}

  async execute(filter?: FindShiftsFilter): Promise<{
    shifts: CashShiftEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return await this.shiftRepo.findMany(filter);
  }
}

export class GetShiftDetailsUseCase {
  constructor(private readonly shiftRepo: IShiftRepository) {}

  async execute(id: string): Promise<CashShiftEntity> {
    const shift = await this.shiftRepo.findById(id);
    if (!shift) {
      throw new NotFoundError(`Không tìm thấy ca làm việc ID: ${id}`);
    }
    return shift;
  }
}
