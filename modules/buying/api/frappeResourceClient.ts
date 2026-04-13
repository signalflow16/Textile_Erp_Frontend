export type ResourceQueryArg = string | {
  url: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  data?: unknown;
  params?: Record<string, unknown>;
};

export type ResourceApiError = {
  status?: number;
  data: unknown;
};

export type ResourceQueryResult = { data: unknown } | { error: ResourceApiError };

export type ResourceRunner = (arg: ResourceQueryArg) => Promise<ResourceQueryResult>;

export const isResourceError = (result: ResourceQueryResult): result is { error: ResourceApiError } =>
  "error" in result;

export const toResourceError = (error: unknown): ResourceApiError => {
  if (error && typeof error === "object" && "data" in error) {
    const statusRaw = (error as { status?: unknown }).status;
    return {
      status: typeof statusRaw === "number" ? statusRaw : undefined,
      data: (error as { data: unknown }).data
    };
  }

  return { data: error };
};

export const encodeJson = (value: unknown) => JSON.stringify(value);
