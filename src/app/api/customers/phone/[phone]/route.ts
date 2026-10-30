import { NextRequest } from "next/server";
import { PrismaCustomerRepository } from "@/adapters/repositories/prisma-customer.repository";
import { GetCustomerByPhoneUseCase } from "@/core/use-cases/customer.use-cases";
import { jsonSuccess, jsonError } from "@/adapters/presenters/api-response";

const customerRepo = new PrismaCustomerRepository();
const getCustomerByPhoneUseCase = new GetCustomerByPhoneUseCase(customerRepo);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  try {
    const { phone } = await params;
    const customer = await getCustomerByPhoneUseCase.execute(phone);
    return jsonSuccess(customer);
  } catch (error) {
    return jsonError(error);
  }
}
