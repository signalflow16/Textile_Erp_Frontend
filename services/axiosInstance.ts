"use client";

import axios, { AxiosError, type AxiosRequestConfig } from "axios";

import { loadAuthTokens } from "@/lib/auth-storage";
import { extractApiErrorMessage } from "@/lib/api-errors";

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
    return {
      status: error.response?.status,
      message: extractApiErrorMessage({ data: error.response?.data }, fallback),
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
  const { accessToken } = loadAuthTokens();

  if (csrfToken) {
    headers["x-frappe-csrf-token"] = csrfToken;
  }

  if (accessToken && !headers.Authorization) {
    headers.Authorization = `token ${accessToken}`;
  }

  config.headers = headers;
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => Promise.reject(error)
);

export const apiRequest = async <T>(config: AxiosRequestConfig) => {
  const response = await axiosInstance.request<T>(config);
  return response.data;
};
