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

export const submitDoc = async <T>(runner: ResourceRunner, doctype: string, name: string, _fallbackDoc?: Record<string, unknown>): Promise<T | { error: ResourceApiError }> => {
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

  // Fallback legacy strategy.
  // Prefer the minimal reference form first because some ERPNext setups reject
  // a fully-expanded document payload during submit.
  const minimalSubmit = await runner({
    url: "/method/frappe.client.submit",
    method: "POST",
    data: {
      doc: {
        doctype,
        name
      }
    }
  });

  if (!isResourceError(minimalSubmit)) {
    const minimalPayload = minimalSubmit.data as FrappeDocResponse<T> | { message?: T };
    if (minimalPayload && typeof minimalPayload === "object" && "data" in minimalPayload && minimalPayload.data) {
      return minimalPayload.data;
    }

    if (minimalPayload && typeof minimalPayload === "object" && "message" in minimalPayload && minimalPayload.message) {
      return minimalPayload.message;
    }
  }

  if (isResourceError(minimalSubmit)) {
    return { error: toResourceError(minimalSubmit.error) };
  }

  return {
    error: {
      data: "Document submit did not return a valid ERPNext response."
    }
  };
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
