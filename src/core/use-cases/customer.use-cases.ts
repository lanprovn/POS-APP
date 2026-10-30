import { ICustomerRepository, FindCustomersFilter, CustomerStats } from "../ports/customer-repository.port";
import { CustomerEntity, CustomerWithOrdersEntity } from "../entities/customer.entity";
import { ValidationError, NotFoundError, ConflictError } from "../errors/app-error";

export class ListCustomersUseCase {
  constructor(private readonly customerRepo: ICustomerRepository) {}

  async execute(filter?: FindCustomersFilter): Promise<{
    customers: CustomerWithOrdersEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return await this.customerRepo.findMany(filter);
  }
}

export class GetCustomerByIdUseCase {
  constructor(private readonly customerRepo: ICustomerRepository) {}

  async execute(id: string): Promise<CustomerEntity & { orders: any[] }> {
    const customer = await this.customerRepo.findByIdWithOrders(id);
    if (!customer) {
      throw new NotFoundError(`Không tìm thấy khách hàng với mã ID: ${id}`);
    }
    return customer;
  }
}

export class GetCustomerByPhoneUseCase {
  constructor(private readonly customerRepo: ICustomerRepository) {}

  async execute(phone: string): Promise<CustomerEntity | null> {
    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      throw new ValidationError("Số điện thoại không được để trống.");
    }
    return await this.customerRepo.findByPhone(cleanPhone);
  }
}

export interface CreateCustomerInput {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  initialPoints?: number;
}

export class CreateCustomerUseCase {
  constructor(private readonly customerRepo: ICustomerRepository) {}

  async execute(input: CreateCustomerInput): Promise<CustomerEntity> {
    if (!input.name || input.name.trim().length === 0) {
      throw new ValidationError("Tên khách hàng không được để trống.");
    }

    const cleanPhone = input.phone ? input.phone.trim() : null;

    if (cleanPhone) {
      // Kiểm tra trùng lặp số điện thoại
      const existing = await this.customerRepo.findByPhone(cleanPhone);
      if (existing) {
        throw new ConflictError(`Số điện thoại "${cleanPhone}" đã được đăng ký bởi khách hàng: ${existing.name}`);
      }
    }

    return await this.customerRepo.create({
      name: input.name.trim(),
      phone: cleanPhone,
      email: input.email ? input.email.trim() : null,
      address: input.address ? input.address.trim() : null,
      points: input.initialPoints ? Math.max(0, input.initialPoints) : 0,
    });
  }
}

export interface UpdateCustomerInput {
  id: string;
  name?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  points?: number;
}

export class UpdateCustomerUseCase {
  constructor(private readonly customerRepo: ICustomerRepository) {}

  async execute(input: UpdateCustomerInput): Promise<CustomerEntity> {
    const existing = await this.customerRepo.findById(input.id);
    if (!existing) {
      throw new NotFoundError(`Không tìm thấy khách hàng với ID: ${input.id}`);
    }

    if (input.name !== undefined && input.name.trim().length === 0) {
      throw new ValidationError("Tên khách hàng không được để trống.");
    }

    const cleanPhone = input.phone !== undefined ? (input.phone ? input.phone.trim() : null) : undefined;

    if (cleanPhone && cleanPhone !== existing.phone) {
      const phoneOwner = await this.customerRepo.findByPhone(cleanPhone);
      if (phoneOwner && phoneOwner.id !== input.id) {
        throw new ConflictError(`Số điện thoại "${cleanPhone}" đã thuộc về khách hàng khác (${phoneOwner.name})`);
      }
    }

    return await this.customerRepo.update(input.id, {
      name: input.name ? input.name.trim() : undefined,
      phone: cleanPhone,
      email: input.email !== undefined ? (input.email ? input.email.trim() : null) : undefined,
      address: input.address !== undefined ? (input.address ? input.address.trim() : null) : undefined,
      points: input.points !== undefined ? Math.max(0, input.points) : undefined,
    });
  }
}

export class DeleteCustomerUseCase {
  constructor(private readonly customerRepo: ICustomerRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.customerRepo.findById(id);
    if (!existing) {
      throw new NotFoundError(`Không tìm thấy khách hàng với ID: ${id}`);
    }
    await this.customerRepo.delete(id);
  }
}

export class GetCustomerStatsUseCase {
  constructor(private readonly customerRepo: ICustomerRepository) {}

  async execute(): Promise<CustomerStats> {
    return await this.customerRepo.getStats();
  }
}

