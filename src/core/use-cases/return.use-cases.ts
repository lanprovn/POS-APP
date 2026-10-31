import { IReturnRepository, CreateReturnInput, FindReturnsFilter } from "../ports/return-repository.port";
import { ValidationError, NotFoundError } from "../errors/app-error";

export class CreateReturnUseCase {
  constructor(private returnRepo: IReturnRepository) {}

  async execute(input: CreateReturnInput) {
    if (!input.orderId) {
      throw new ValidationError("Mã đơn hàng gốc là bắt buộc");
    }
    if (!input.items || input.items.length === 0) {
      throw new ValidationError("Cần chọn ít nhất một sản phẩm để trả lại");
    }

    const hasInvalidQty = input.items.some((i) => i.quantity <= 0);
    if (hasInvalidQty) {
      throw new ValidationError("Số lượng trả lại phải lớn hơn 0");
    }

    return await this.returnRepo.createReturn(input);
  }
}

export class GetOrderReturnEligibilityUseCase {
  constructor(private returnRepo: IReturnRepository) {}

  async execute(orderIdOrNumber: string) {
    if (!orderIdOrNumber || !orderIdOrNumber.trim()) {
      throw new ValidationError("Cần cung cấp mã hóa đơn");
    }
    const result = await this.returnRepo.checkOrderReturnEligibility(orderIdOrNumber.trim());
    if (!result) {
      throw new NotFoundError("Không tìm thấy đơn hàng hoặc đơn hàng không hợp lệ");
    }
    return result;
  }
}

export class GetReturnsListUseCase {
  constructor(private returnRepo: IReturnRepository) {}

  async execute(filter?: FindReturnsFilter) {
    return await this.returnRepo.findMany(filter);
  }
}

export class GetReturnDetailUseCase {
  constructor(private returnRepo: IReturnRepository) {}

  async execute(id: string) {
    const returnReceipt = await this.returnRepo.findById(id);
    if (!returnReceipt) {
      throw new NotFoundError("Không tìm thấy phiếu trả hàng");
    }
    return returnReceipt;
  }
}
