import { PrismaReportRepository } from "@/adapters/repositories/prisma-report.repository";
import { GetSalesReportUseCase } from "@/core/use-cases/report.use-cases";
import { jsonSuccess, jsonError } from "@/adapters/presenters/api-response";

const reportRepo = new PrismaReportRepository();
const reportUseCase = new GetSalesReportUseCase(reportRepo);

export async function GET() {
  try {
    const summary = await reportUseCase.execute();
    return jsonSuccess(summary);
  } catch (error) {
    return jsonError(error);
  }
}

