"use client";

import axios, { AxiosError, type AxiosRequestConfig } from "axios";

import { extractApiErrorMessage } from "@/lib/api-errors";
import {
  handleUnauthorizedSession,
  isAuthExcludedPath,
  recoverCookieSession,
  shouldRetryTransientError,
  type RetryableRequestConfig
} from "@/lib/auth-runtime";

const API_BASE_URL = "/api/frappe";

const readCookieValue = (name: string) => {
  if (typeof document === "undefined") {
    return null;
  }

  const cookie = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${name}=`));

  if (!cookie) {
    return null;
  }

  const value = cookie.slice(name.length + 1).trim();
  return value ? decodeURIComponent(value) : null;
};

export type NormalizedApiError = {
  status?: number;
  message: string;
  data: unknown;
};

export const normalizeApiError = (error: unknown, fallback: string): NormalizedApiError => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    return {
      status,
      message:
        status === 403
          ? extractApiErrorMessage(
              { data: error.response?.data },
              "You do not have permission to perform this action."
            )
          : extractApiErrorMessage({ data: error.response?.data }, fallback),
      data: error.response?.data ?? error.message
    };
  }

  return {
    message: fallback,
    data: error
  };
};

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000,
  headers: {
    Accept: "application/json"
  }
});

axiosInstance.interceptors.request.use((config) => {
  const headers = config.headers ?? {};
  const csrfToken = readCookieValue("csrf_token");

  if (csrfToken) {
    headers["x-frappe-csrf-token"] = csrfToken;
  }

  config.headers = headers;
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const requestConfig = (error.config ?? {}) as RetryableRequestConfig;
    const status = error.response?.status;

    if (status === 401) {
      if (isAuthExcludedPath(requestConfig.url)) {
        handleUnauthorizedSession();
        return Promise.reject(error);
      }

      if (!requestConfig._retry) {
        requestConfig._retry = true;

        const sessionRecovered = await recoverCookieSession();
        if (sessionRecovered) {
          return axiosInstance.request(requestConfig);
        }
      }

      handleUnauthorizedSession();
      return Promise.reject(error);
    }

    if (shouldRetryTransientError(error, requestConfig)) {
      requestConfig._transientRetry = true;
      return axiosInstance.request(requestConfig);
    }

    return Promise.reject(error);
  }
);

export const apiRequest = async <T>(config: AxiosRequestConfig) => {
  const response = await axiosInstance.request<T>(config);
  return response.data;
};
