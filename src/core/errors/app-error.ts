export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      timestamp: new Date().toISOString(),
    };
  }
}

export class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly code = "VALIDATION_ERROR";
}

export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly code = "NOT_FOUND";
}

export class InsufficientStockError extends AppError {
  readonly statusCode = 409;
  readonly code = "INSUFFICIENT_STOCK";

  constructor(productName: string, available: number, requested: number) {
    super(`Sản phẩm "${productName}" chỉ còn ${available} tồn kho, không đủ số lượng yêu cầu (${requested}).`);
  }
}

export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly code = "CONFLICT_ERROR";
}

export class BusinessRuleError extends AppError {
  readonly statusCode = 422;
  readonly code = "BUSINESS_RULE_VIOLATION";
}

export class SystemError extends AppError {
  readonly statusCode = 500;
  readonly code = "INTERNAL_SERVER_ERROR";
}

