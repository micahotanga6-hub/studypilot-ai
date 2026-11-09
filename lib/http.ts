import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function jsonError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message, code: error.code ?? null }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json({ error: error.issues[0]?.message || "Check the form and try again." }, { status: 400 });
  }
  const message = error instanceof Error ? error.message : "";
  if (message.includes("requires an index") || message.includes("FAILED_PRECONDITION")) {
    return NextResponse.json(
      {
        error:
          "Firestore is still building an index for this action. Deploy firestore.indexes.json, wait until the index shows as Enabled, then try again.",
      },
      { status: 503 },
    );
  }
  console.error(error);
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
