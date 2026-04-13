import { extractApiErrorMessage } from "@/lib/api-errors";

export const toBuyingErrorMessage = (error: unknown, fallback: string) =>
  extractApiErrorMessage(error, fallback);
