import { NextResponse } from "next/server";
import { StorageError } from "./storage-error";

export function storageErrorResponse(
  error: unknown,
  fallbackMessage: string,
): NextResponse {
  if (error instanceof StorageError) {
    console.error(`[api] ${error.code}: ${error.message}`, error);
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: 503 },
    );
  }

  console.error("[api] unexpected error", error);
  return NextResponse.json(
    { error: fallbackMessage, code: "INTERNAL_ERROR" },
    { status: 500 },
  );
}
