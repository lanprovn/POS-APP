import { NextRequest } from "next/server";
import { PrismaShiftRepository } from "@/adapters/repositories/prisma-shift.repository";
import { GetCurrentShiftUseCase } from "@/core/use-cases/shift.use-cases";
import { jsonSuccess, jsonError } from "@/adapters/presenters/api-response";

const shiftRepo = new PrismaShiftRepository();
const getCurrentShiftUseCase = new GetCurrentShiftUseCase(shiftRepo);

export async function GET(req: NextRequest) {
  try {
    const shift = await getCurrentShiftUseCase.execute();
    return jsonSuccess(shift);
  } catch (error) {
    return jsonError(error);
  }
}
