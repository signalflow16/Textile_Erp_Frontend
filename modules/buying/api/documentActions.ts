import type { FrappeDocResponse, FrappeListResponse } from "@/modules/buying/types/frappe";
import { encodeJson, isResourceError, toResourceError, type ResourceApiError, type ResourceRunner } from "@/modules/buying/api/frappeResourceClient";

export const createDoc = async <T>(runner: ResourceRunner, doctype: string, payload: unknown): Promise<T | { error: ResourceApiError }> => {
  const result = await runner({
    url: `/resource/${encodeURIComponent(doctype)}`,
    method: "POST",
    data: payload
  });

  if (isResourceError(result)) {
    return { error: toResourceError(result.error) };
  }

  return (result.data as FrappeDocResponse<T>).data;
};

export const updateDoc = async <T>(runner: ResourceRunner, doctype: string, name: string, payload: unknown): Promise<T | { error: ResourceApiError }> => {
  const result = await runner({
    url: `/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`,
    method: "PUT",
    data: payload
  });

  if (isResourceError(result)) {
    return { error: toResourceError(result.error) };
  }

  return (result.data as FrappeDocResponse<T>).data;
};

export const getDoc = async <T>(runner: ResourceRunner, doctype: string, name: string): Promise<T | { error: ResourceApiError }> => {
  const result = await runner({
    url: `/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`,
    method: "GET"
  });

  if (isResourceError(result)) {
    return { error: toResourceError(result.error) };
  }

  return (result.data as FrappeDocResponse<T>).data;
};

export const listDocs = async <T>(runner: ResourceRunner, doctype: string, params?: Record<string, unknown>): Promise<T[] | { error: ResourceApiError }> => {
  const result = await runner({
    url: `/resource/${encodeURIComponent(doctype)}`,
    method: "GET",
    params
  });

  if (isResourceError(result)) {
    return { error: toResourceError(result.error) };
  }

  return (result.data as FrappeListResponse<T>).data;
};

export const submitDoc = async <T>(runner: ResourceRunner, doctype: string, name: string, fallbackDoc?: Record<string, unknown>): Promise<T | { error: ResourceApiError }> => {
  const primary = await runner({
    // Primary modern strategy
    url: `/v2/document/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}/method/submit`,
    method: "POST"
  });

  if (!isResourceError(primary)) {
    const payload = primary.data as FrappeDocResponse<T> | { message?: T };
    if (payload && typeof payload === "object" && "data" in payload && payload.data) {
      return payload.data;
    }

    if (payload && typeof payload === "object" && "message" in payload && payload.message) {
      return payload.message;
    }
  }

  // Fallback legacy strategy
  const loaded = fallbackDoc ?? (() => {
    const maybeLoaded = primary;
    if (!isResourceError(maybeLoaded)) {
      return null;
    }
    return null;
  })();

  const docForSubmit = loaded ?? await getDoc<Record<string, unknown>>(runner, doctype, name);
  if (typeof docForSubmit === "object" && docForSubmit !== null && "error" in docForSubmit) {
    return { error: (docForSubmit as { error: ResourceApiError }).error };
  }

  const fallback = await runner({
    url: "/method/frappe.client.submit",
    method: "POST",
    data: {
      doc: docForSubmit
    }
  });

  if (isResourceError(fallback)) {
    return { error: toResourceError(fallback.error) };
  }

  const fallbackPayload = fallback.data as FrappeDocResponse<T> | { message?: T };
  if (fallbackPayload && typeof fallbackPayload === "object" && "data" in fallbackPayload && fallbackPayload.data) {
    return fallbackPayload.data;
  }

  if (fallbackPayload && typeof fallbackPayload === "object" && "message" in fallbackPayload && fallbackPayload.message) {
    return fallbackPayload.message;
  }

  return docForSubmit as T;
};

export const saveDraft = async <T>(runner: ResourceRunner, doctype: string, payload: unknown, name?: string) => {
  if (!name) {
    return createDoc<T>(runner, doctype, payload);
  }

  return updateDoc<T>(runner, doctype, name, payload);
};

export const saveAndSubmit = async <T>(
  runner: ResourceRunner,
  doctype: string,
  payload: unknown,
  name?: string
): Promise<{ saved: T; submitted: T } | { error: ResourceApiError; saved?: T }> => {
  const saved = await saveDraft<T>(runner, doctype, payload, name);
  if (typeof saved === "object" && saved !== null && "error" in saved) {
    return saved;
  }

  const savedDoc = saved as unknown as { name?: string };
  const finalName = typeof savedDoc.name === "string" ? savedDoc.name : name;

  if (!finalName) {
    return {
      error: {
        data: "Document name missing after save."
      }
    };
  }

  const submitted = await submitDoc<T>(runner, doctype, finalName, saved as unknown as Record<string, unknown>);
  if (typeof submitted === "object" && submitted !== null && "error" in submitted) {
    return {
      error: submitted.error,
      saved: saved as T
    };
  }

  return {
    saved,
    submitted
  };
};

export const toListParams = (fields: string[], filters?: unknown[][], order_by?: string, limit_page_length?: number, limit_start?: number) => ({
  fields: encodeJson(fields),
  ...(filters && filters.length ? { filters: encodeJson(filters) } : {}),
  ...(order_by ? { order_by } : {}),
  ...(typeof limit_page_length === "number" ? { limit_page_length } : {}),
  ...(typeof limit_start === "number" ? { limit_start } : {})
});
