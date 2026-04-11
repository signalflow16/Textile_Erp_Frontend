import { extractApiErrorMessage, extractEnvelopeMessage } from "@/lib/api-errors";
import type { InitialSetupEnvelope } from "@/modules/initial-setup/types/initialSetup";

export type NormalizedSetupError = {
  title: string;
  message: string;
  code?: string;
  details?: Record<string, unknown> | null;
  isUnauthorized: boolean;
  isForbidden: boolean;
  isValidation: boolean;
  status?: number;
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

export const normalizeSetupEnvelopeError = <T>(
  envelope: InitialSetupEnvelope<T>,
  fallbackMessage: string
): NormalizedSetupError | null => {
  if (envelope.ok) {
    return null;
  }

  return {
    title: "Request failed",
    message: extractEnvelopeMessage(envelope, fallbackMessage),
    code: envelope.code,
    details: envelope.details ?? null,
    isUnauthorized: envelope.code === "UNAUTHORIZED",
    isForbidden: envelope.code === "FORBIDDEN",
    isValidation: envelope.code === "VALIDATION_ERROR"
  };
};

export const normalizeSetupApiError = (error: unknown, fallbackMessage: string): NormalizedSetupError => {
  const baseMessage = extractApiErrorMessage(error, fallbackMessage);
  const status =
    error && typeof error === "object" && "status" in error && typeof (error as { status?: unknown }).status === "number"
      ? ((error as { status: number }).status as number)
      : undefined;
  const payload =
    error && typeof error === "object" && "data" in error ? (error as { data?: unknown }).data : undefined;
  const payloadRecord = asRecord(payload);
  const code =
    typeof payloadRecord?.code === "string"
      ? payloadRecord.code
      : typeof payloadRecord?.error === "string"
        ? payloadRecord.error
        : undefined;
  const details = asRecord(payloadRecord?.details) ?? null;

  const isUnauthorized = status === 401 || code === "UNAUTHORIZED";
  const isForbidden = status === 403 || code === "FORBIDDEN";
  const isValidation = status === 422 || code === "VALIDATION_ERROR";

  const title = isUnauthorized
    ? "Authentication required"
    : isForbidden
      ? "Permission denied"
      : "Request failed";

  return {
    title,
    message: baseMessage,
    code,
    details,
    isUnauthorized,
    isForbidden,
    isValidation,
    status
  };
};