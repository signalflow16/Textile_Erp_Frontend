import { extractApiErrorMessage } from "@/lib/api-errors";

export const toSellingErrorMessage = (error: unknown, fallback: string) =>
  extractApiErrorMessage(error, fallback);
