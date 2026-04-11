const asText = (value: unknown): string | null => {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (value && typeof value === "object" && "message" in value) {
    const nested = (value as { message?: unknown }).message;
    if (typeof nested === "string") {
      return nested;
    }
  }

  return null;
};

const parseFrappeServerMessages = (raw: unknown): string | null => {
  const text = asText(raw);
  if (!text) {
    return null;
  }

  try {
    const outer = JSON.parse(text) as unknown;
    if (!Array.isArray(outer) || outer.length === 0) {
      return null;
    }

    const first = outer[0];
    const firstText = asText(first);
    if (!firstText) {
      return null;
    }

    try {
      const parsed = JSON.parse(firstText) as { message?: unknown };
      const innerMessage = asText(parsed?.message);
      return innerMessage || firstText;
    } catch {
      return firstText;
    }
  } catch {
    return null;
  }
};

export const extractEnvelopeMessage = (payload: unknown, fallback: string) => {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const rootMessage = asText((payload as { message?: unknown }).message);
  const rootServerMessages = parseFrappeServerMessages(
    (payload as { _server_messages?: unknown })._server_messages
  );

  const details = (payload as { details?: unknown }).details;
  const detailsServerMessages =
    details && typeof details === "object"
      ? parseFrappeServerMessages((details as { _server_messages?: unknown })._server_messages)
      : null;

  return detailsServerMessages || rootServerMessages || rootMessage || fallback;
};

export const extractApiErrorMessage = (error: unknown, fallback: string) => {
  if (!error || typeof error !== "object") {
    return fallback;
  }

  if ("data" in error) {
    const payload = (error as { data?: unknown }).data;
    if (payload && typeof payload === "object") {
      const serverMessage = parseFrappeServerMessages(
        (payload as { _server_messages?: unknown })._server_messages
      );
      if (serverMessage) {
        return serverMessage;
      }

      if ("error" in payload) {
        const details = (payload as { error?: { message?: string } }).error;
        const detailsMessage = asText(details?.message);
        if (detailsMessage) {
          return detailsMessage;
        }
      }

      const message = asText((payload as { message?: unknown }).message);
      const exception = asText((payload as { exception?: unknown }).exception);
      const details = asText((payload as { details?: unknown }).details);
      if (message || exception || details) {
        return message || exception || details || fallback;
      }
    }
  }

  if ("message" in error) {
    const message = asText((error as { message?: unknown }).message);
    if (message) {
      return message;
    }
  }

  return fallback;
};
