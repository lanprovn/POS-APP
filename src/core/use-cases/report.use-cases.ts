import { IReportRepository, SalesSummaryDto } from "../ports/report-repository.port";

export class GetSalesReportUseCase {
  constructor(private readonly reportRepo: IReportRepository) {}

  async execute(): Promise<SalesSummaryDto> {
    return await this.reportRepo.getSummary();
  }
}

