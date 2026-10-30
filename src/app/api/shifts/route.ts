import { NextRequest } from "next/server";
import { PrismaShiftRepository } from "@/adapters/repositories/prisma-shift.repository";
import { ListShiftsUseCase } from "@/core/use-cases/shift.use-cases";
import { jsonSuccess, jsonError } from "@/adapters/presenters/api-response";

const shiftRepo = new PrismaShiftRepository();
const listShiftsUseCase = new ListShiftsUseCase(shiftRepo);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 15;

    const result = await listShiftsUseCase.execute({ page, limit });
    return jsonSuccess(result);
  } catch (error) {
    return jsonError(error);
  }
}
