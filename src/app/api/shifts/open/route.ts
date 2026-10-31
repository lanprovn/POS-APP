import { NextRequest } from "next/server";
import { PrismaShiftRepository } from "@/adapters/repositories/prisma-shift.repository";
import { OpenShiftUseCase } from "@/core/use-cases/shift.use-cases";
import { jsonSuccess, jsonError } from "@/adapters/presenters/api-response";
import { z } from "zod";

const shiftRepo = new PrismaShiftRepository();
const openShiftUseCase = new OpenShiftUseCase(shiftRepo);

const openShiftSchema = z.object({
  cashierName: z.string().min(1, "Vui lòng nhập tên thu ngân"),
  startingCash: z.number().min(0, "Tiền mặt đầu ca không được là số âm"),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = openShiftSchema.parse(body);

    const shift = await openShiftUseCase.execute({
      cashierName: validated.cashierName,
      startingCash: validated.startingCash,
      notes: validated.notes,
    });

    return jsonSuccess(shift, 201);
  } catch (error) {
    return jsonError(error);
  }
}

