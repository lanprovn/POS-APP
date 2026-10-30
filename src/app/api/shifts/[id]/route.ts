import { NextRequest } from "next/server";
import { PrismaShiftRepository } from "@/adapters/repositories/prisma-shift.repository";
import { GetShiftDetailsUseCase } from "@/core/use-cases/shift.use-cases";
import { jsonSuccess, jsonError } from "@/adapters/presenters/api-response";

const shiftRepo = new PrismaShiftRepository();
const getShiftDetailsUseCase = new GetShiftDetailsUseCase(shiftRepo);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shift = await getShiftDetailsUseCase.execute(id);
    return jsonSuccess(shift);
  } catch (error) {
    return jsonError(error);
  }
}
