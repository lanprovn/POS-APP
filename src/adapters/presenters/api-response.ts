import { NextResponse } from "next/server";
import { AppError } from "@/core/errors/app-error";
import { ZodError } from "zod";

export interface ApiResponseSuccess<T> {
  success: true;
  data: T;
}

export interface ApiResponseError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    timestamp: string;
  };
}

export function jsonSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json<ApiResponseSuccess<T>>(
    {
      success: true,
      data,
    },
    { status }
  );
}

export function jsonError(error: unknown) {
  console.error("[API Error Handler]:", error);

  if (error instanceof AppError) {
    return NextResponse.json<ApiResponseError>(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    const message = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
    return NextResponse.json<ApiResponseError>(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message,
          details: error.format(),
          timestamp: new Date().toISOString(),
        },
      },
      { status: 400 }
    );
  }

  const message = error instanceof Error ? error.message : "Đã xảy ra lỗi hệ thống không mong muốn.";

  return NextResponse.json<ApiResponseError>(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message,
        timestamp: new Date().toISOString(),
      },
    },
    { status: 500 }
  );
}

