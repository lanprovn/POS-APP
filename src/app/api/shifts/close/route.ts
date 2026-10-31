import { NextRequest } from "next/server";
import { PrismaShiftRepository } from "@/adapters/repositories/prisma-shift.repository";
import { CloseShiftUseCase } from "@/core/use-cases/shift.use-cases";
import { jsonSuccess, jsonError } from "@/adapters/presenters/api-response";
import { z } from "zod";

const shiftRepo = new PrismaShiftRepository();
const closeShiftUseCase = new CloseShiftUseCase(shiftRepo);

const closeShiftSchema = z.object({
  shiftId: z.string().min(1, "Thiếu mã ca làm việc"),
  endingCash: z.number().min(0, "Tiền mặt thực tế không được là số âm"),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = closeShiftSchema.parse(body);

    const shift = await closeShiftUseCase.execute({
      shiftId: validated.shiftId,
      endingCash: validated.endingCash,
      notes: validated.notes,
    });

    return jsonSuccess(shift);
  } catch (error) {
    return jsonError(error);
  }
}

