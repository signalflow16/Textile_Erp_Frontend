"use client";

import axios, { AxiosError, type AxiosRequestConfig, type AxiosResponse } from "axios";

type RuntimeHooks = {
  onUnauthorized?: () => void;
};

type RetryableRequestConfig = AxiosRequestConfig & {
  _retry?: boolean;
  _transientRetry?: boolean;
};

const API_BASE_URL = "/api/frappe";
const AUTH_RECOVERY_TIMEOUT_MS = 15000;
const AUTH_EXCLUDED_PATHS = [
  "/method/login",
  "/method/logout",
  "/method/frappe.auth.get_logged_user"
];

let runtimeHooks: RuntimeHooks = {};
let sessionRecoveryPromise: Promise<boolean> | null = null;

const isBrowser = () => typeof window !== "undefined";

export const configureAuthRuntime = (hooks: RuntimeHooks) => {
  runtimeHooks = hooks;
};

export const isAuthExcludedPath = (url?: string) =>
  Boolean(url && AUTH_EXCLUDED_PATHS.some((path) => url.includes(path)));

export const isNetworkOrTimeoutError = (error: AxiosError) =>
  !error.response || error.code === "ECONNABORTED";

export const isTransientServerError = (error: AxiosError) =>
  Boolean(error.response?.status && error.response.status >= 500);

export const shouldRetryTransientError = (error: AxiosError, config?: RetryableRequestConfig) =>
  !config?._transientRetry && (isNetworkOrTimeoutError(error) || isTransientServerError(error));

export const handleUnauthorizedSession = () => {
  runtimeHooks.onUnauthorized?.();
};

export const recoverCookieSession = async () => {
  if (!isBrowser()) {
    return false;
  }

  if (!sessionRecoveryPromise) {
    sessionRecoveryPromise = (async () => {
      try {
        const response = await axios.get<{ message?: string }>(
          `${API_BASE_URL}/method/frappe.auth.get_logged_user`,
          {
            withCredentials: true,
            timeout: AUTH_RECOVERY_TIMEOUT_MS,
            headers: {
              Accept: "application/json"
            }
          }
        );

        const user = typeof response.data?.message === "string" ? response.data.message : null;
        return Boolean(user && user !== "Guest");
      } catch {
        return false;
      } finally {
        sessionRecoveryPromise = null;
      }
    })();
  }

  return sessionRecoveryPromise;
};

export const retryAxiosRequest = async <T>(
  request: RetryableRequestConfig,
  executor: (config: RetryableRequestConfig) => Promise<AxiosResponse<T>>
) => executor(request);

export type { RetryableRequestConfig };
