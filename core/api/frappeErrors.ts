import { extractApiErrorMessage, extractEnvelopeMessage } from "@/lib/api-errors";

type FrappeFieldError = {
  field?: string;
  message: string;
};

export type NormalizedFrappeError = {
  message: string;
  inline?: FrappeFieldError[];
};

const fieldPattern = /(["'`]?)([a-zA-Z_][a-zA-Z0-9_ ]+)\1\s*(is required|cannot be empty|must be greater than|must be selected)/i;

export const normalizeFrappeError = (error: unknown, fallback: string): NormalizedFrappeError => {
  const message = extractApiErrorMessage(error, "") || extractEnvelopeMessage(error, "") || fallback;
  const normalized = message || fallback;
  const match = normalized.match(fieldPattern);

  if (!match) {
    return { message: normalized };
  }

  return {
    message: normalized,
    inline: [
      {
        field: match[2].trim().toLowerCase().replace(/\s+/g, "_"),
        message: normalized
      }
    ]
  };
};
