import { prisma } from "@/infrastructure/db/prisma";
import { ICustomerRepository, FindCustomersFilter, CustomerStats } from "@/core/ports/customer-repository.port";
import { CustomerEntity, CustomerWithOrdersEntity, CUSTOMER_TIERS } from "@/core/entities/customer.entity";

export class PrismaCustomerRepository implements ICustomerRepository {
  async findById(id: string): Promise<CustomerEntity | null> {
    return await prisma.customer.findUnique({
      where: { id },
    });
  }

  async findByIdWithOrders(id: string): Promise<(CustomerEntity & { orders: any[] }) | null> {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            orderNumber: true,
            finalAmount: true,
            paymentMethod: true,
            createdAt: true,
          },
        },
      },
    });
    return customer;
  }

  async findByPhone(phone: string): Promise<CustomerEntity | null> {
    return await prisma.customer.findFirst({
      where: {
        phone: { equals: phone },
      },
    });
  }

  async findMany(filter?: FindCustomersFilter): Promise<{
    customers: CustomerWithOrdersEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, filter?.page || 1);
    const limit = Math.max(1, Math.min(100, filter?.limit || 15));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filter?.search) {
      const q = filter.search.trim();
      where.OR = [
        { name: { contains: q } },
        { phone: { contains: q } },
        { email: { contains: q } },
      ];
    }

    if (filter?.tier) {
      const tierKey = filter.tier.toUpperCase();
      if (tierKey === "DIAMOND") {
        where.totalSpent = { gte: CUSTOMER_TIERS.DIAMOND.minSpent };
      } else if (tierKey === "GOLD") {
        where.totalSpent = {
          gte: CUSTOMER_TIERS.GOLD.minSpent,
          lt: CUSTOMER_TIERS.DIAMOND.minSpent,
        };
      } else if (tierKey === "SILVER") {
        where.totalSpent = {
          gte: CUSTOMER_TIERS.SILVER.minSpent,
          lt: CUSTOMER_TIERS.GOLD.minSpent,
        };
      } else if (tierKey === "BRONZE") {
        where.totalSpent = { lt: CUSTOMER_TIERS.SILVER.minSpent };
      }
    }

    const [rawCustomers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ totalSpent: "desc" }, { createdAt: "desc" }],
        include: {
          _count: {
            select: { orders: true },
          },
          orders: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { createdAt: true },
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    const customers: CustomerWithOrdersEntity[] = rawCustomers.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: c.address,
      totalSpent: c.totalSpent,
      points: c.points,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      ordersCount: c._count.orders,
      lastOrderDate: c.orders.length > 0 ? c.orders[0].createdAt : null,
    }));

    return {
      customers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async create(data: {
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    points?: number;
  }): Promise<CustomerEntity> {
    return await prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        points: data.points || 0,
        totalSpent: 0,
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      phone?: string | null;
      email?: string | null;
      address?: string | null;
      points?: number;
    }
  ): Promise<CustomerEntity> {
    return await prisma.customer.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.points !== undefined && { points: data.points }),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.customer.delete({
      where: { id },
    });
  }

  async adjustPoints(id: string, pointsDelta: number): Promise<CustomerEntity> {
    return await prisma.customer.update({
      where: { id },
      data: {
        points: {
          increment: pointsDelta,
        },
      },
    });
  }

  async getStats(): Promise<CustomerStats> {
    const [totalCustomers, totalPointsAgg, vipCount, totalSpentAgg] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.aggregate({
        _sum: { points: true },
      }),
      prisma.customer.count({
        where: {
          totalSpent: { gte: CUSTOMER_TIERS.GOLD.minSpent },
        },
      }),
      prisma.customer.aggregate({
        _sum: { totalSpent: true },
      }),
    ]);

    return {
      totalCustomers,
      vipCustomers: vipCount,
      totalPointsCirculating: totalPointsAgg._sum.points || 0,
      totalSpentAll: totalSpentAgg._sum.totalSpent || 0,
    };
  }
}

