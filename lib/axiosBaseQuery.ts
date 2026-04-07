import axios, { AxiosError, type AxiosRequestConfig, type Method } from "axios";
import type { BaseQueryFn } from "@reduxjs/toolkit/query";

type AxiosBaseQueryArgs = {
  url: string;
  method?: Method;
  data?: unknown;
  params?: AxiosRequestConfig["params"];
  headers?: Record<string, string>;
};

type AxiosBaseQueryInput = string | AxiosBaseQueryArgs;

type AxiosBaseQueryError = {
  status?: number;
  data: unknown;
};

export const axiosBaseQuery =
  ({
    baseUrl,
    prepareHeaders
  }: {
    baseUrl: string;
    prepareHeaders?: (
      headers: Record<string, string>,
      api: { endpoint: string; type: "query" | "mutation"; getState: () => unknown }
    ) => Record<string, string>;
  }): BaseQueryFn<AxiosBaseQueryInput, unknown, AxiosBaseQueryError> =>
  async (args, api) => {
    const normalizedArgs = typeof args === "string" ? { url: args } : args;
    const { url, method = "GET", data, params, headers: extraHeaders } = normalizedArgs;
    const headers = prepareHeaders?.(
      {
        ...(extraHeaders ?? {})
      },
      {
        endpoint: api.endpoint,
        type: api.type,
        getState: api.getState
      }
    ) ?? extraHeaders;

    try {
      const result = await axios({
        url: `${baseUrl}${url}`,
        method,
        data,
        params,
        headers,
        withCredentials: true
      });

      return {
        data: result.data
      };
    } catch (error) {
      const axiosError = error as AxiosError;

      return {
        error: {
          status: axiosError.response?.status,
          data: axiosError.response?.data ?? axiosError.message
        }
      };
    }
  };
