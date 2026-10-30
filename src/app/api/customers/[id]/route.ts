import { NextRequest } from "next/server";
import { PrismaCustomerRepository } from "@/adapters/repositories/prisma-customer.repository";
import { GetCustomerByIdUseCase, UpdateCustomerUseCase, DeleteCustomerUseCase } from "@/core/use-cases/customer.use-cases";
import { jsonSuccess, jsonError } from "@/adapters/presenters/api-response";
import { z } from "zod";

const customerRepo = new PrismaCustomerRepository();
const getCustomerByIdUseCase = new GetCustomerByIdUseCase(customerRepo);
const updateCustomerUseCase = new UpdateCustomerUseCase(customerRepo);
const deleteCustomerUseCase = new DeleteCustomerUseCase(customerRepo);

const updateCustomerSchema = z.object({
  name: z.string().min(1, "Tên khách hàng không được để trống").optional(),
  phone: z.string().optional().nullable(),
  email: z.string().email("Email không hợp lệ").optional().nullable().or(z.literal("")),
  address: z.string().optional().nullable(),
  points: z.number().int().min(0).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customer = await getCustomerByIdUseCase.execute(id);
    return jsonSuccess(customer);
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validated = updateCustomerSchema.parse(body);

    const updated = await updateCustomerUseCase.execute({
      id,
      name: validated.name,
      phone: validated.phone,
      email: validated.email,
      address: validated.address,
      points: validated.points,
    });

    return jsonSuccess(updated);
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteCustomerUseCase.execute(id);
    return jsonSuccess({ message: "Xóa khách hàng thành công" });
  } catch (error) {
    return jsonError(error);
  }
}

