"use client";

type AuthErrorLike = {
  status?: number;
  data?: unknown;
};

export const AUTH_RETRY_DELAY_MS = 1500;
export const AUTH_LOADING_GRACE_MS = 2200;

export const waitFor = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

export const getAuthErrorStatus = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  return typeof (error as AuthErrorLike).status === "number"
    ? (error as AuthErrorLike).status
    : undefined;
};

export const isUnauthorizedAuthError = (error: unknown) => getAuthErrorStatus(error) === 401;

export const isRetryableAuthError = (error: unknown) => {
  const status = getAuthErrorStatus(error);
  return status === undefined || status >= 500;
};
