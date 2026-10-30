import { CustomerEntity, CustomerWithOrdersEntity } from "../entities/customer.entity";

export interface FindCustomersFilter {
  search?: string;
  tier?: string;
  page?: number;
  limit?: number;
}

export interface CustomerStats {
  totalCustomers: number;
  vipCustomers: number;
  totalPointsCirculating: number;
  totalSpentAll: number;
}

export interface ICustomerRepository {
  findById(id: string): Promise<CustomerEntity | null>;
  findByIdWithOrders(id: string): Promise<(CustomerEntity & { orders: any[] }) | null>;
  findByPhone(phone: string): Promise<CustomerEntity | null>;
  findMany(filter?: FindCustomersFilter): Promise<{
    customers: CustomerWithOrdersEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  create(data: {
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    points?: number;
  }): Promise<CustomerEntity>;
  update(
    id: string,
    data: {
      name?: string;
      phone?: string | null;
      email?: string | null;
      address?: string | null;
      points?: number;
    }
  ): Promise<CustomerEntity>;
  delete(id: string): Promise<void>;
  adjustPoints(id: string, pointsDelta: number): Promise<CustomerEntity>;
  getStats(): Promise<CustomerStats>;
}

