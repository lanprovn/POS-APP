import { NextRequest } from "next/server";
import { PrismaCustomerRepository } from "@/adapters/repositories/prisma-customer.repository";
import { ListCustomersUseCase, CreateCustomerUseCase } from "@/core/use-cases/customer.use-cases";
import { jsonSuccess, jsonError } from "@/adapters/presenters/api-response";
import { z } from "zod";

const customerRepo = new PrismaCustomerRepository();
const listCustomersUseCase = new ListCustomersUseCase(customerRepo);
const createCustomerUseCase = new CreateCustomerUseCase(customerRepo);

const createCustomerSchema = z.object({
  name: z.string().min(1, "Tên khách hàng không được để trống"),
  phone: z.string().optional().nullable(),
  email: z.string().email("Email không hợp lệ").optional().nullable().or(z.literal("")),
  address: z.string().optional().nullable(),
  initialPoints: z.number().int().min(0).optional().default(0),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const tier = searchParams.get("tier") || undefined;
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 15;

    const result = await listCustomersUseCase.execute({
      search,
      tier,
      page,
      limit,
    });

    return jsonSuccess(result);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = createCustomerSchema.parse(body);

    const customer = await createCustomerUseCase.execute({
      name: validated.name,
      phone: validated.phone || null,
      email: validated.email || null,
      address: validated.address || null,
      initialPoints: validated.initialPoints,
    });

    return jsonSuccess(customer, 201);
  } catch (error) {
    return jsonError(error);
  }
}
