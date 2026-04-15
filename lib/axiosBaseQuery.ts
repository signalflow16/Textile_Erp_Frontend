import axios, { AxiosError, type AxiosRequestConfig, type Method } from "axios";
import type { BaseQueryFn } from "@reduxjs/toolkit/query";

import {
  handleUnauthorizedSession,
  isAuthExcludedPath,
  recoverCookieSession,
  retryAxiosRequest,
  shouldRetryTransientError,
  type RetryableRequestConfig
} from "@/core/auth/auth-runtime";

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

    const executeRequest = async (requestConfig: RetryableRequestConfig) =>
      axios({
        url: requestConfig.url,
        method: requestConfig.method,
        data: requestConfig.data,
        params: requestConfig.params,
        headers: requestConfig.headers,
        withCredentials: true
      });

    const requestConfig: RetryableRequestConfig = {
      url: `${baseUrl}${url}`,
      method,
      data,
      params,
      headers,
      withCredentials: true
    };

    try {
      const result = await retryAxiosRequest(requestConfig, executeRequest);

      return {
        data: result.data
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      const failedRequest = (axiosError.config ?? requestConfig) as RetryableRequestConfig;

      if (axiosError.response?.status === 401) {
        if (isAuthExcludedPath(failedRequest.url)) {
          handleUnauthorizedSession();
        } else if (!failedRequest._retry) {
          failedRequest._retry = true;

          const sessionRecovered = await recoverCookieSession();
          if (sessionRecovered) {
            try {
              const retryResult = await retryAxiosRequest(failedRequest, executeRequest);
              return {
                data: retryResult.data
              };
            } catch (retryError) {
              const retryAxiosError = retryError as AxiosError;
              if (retryAxiosError.response?.status === 401) {
                handleUnauthorizedSession();
              }

              return {
                error: {
                  status: retryAxiosError.response?.status,
                  data: retryAxiosError.response?.data ?? retryAxiosError.message
                }
              };
            }
          }

          handleUnauthorizedSession();
        } else {
          handleUnauthorizedSession();
        }
      } else if (shouldRetryTransientError(axiosError, failedRequest)) {
        failedRequest._transientRetry = true;

        try {
          const retryResult = await retryAxiosRequest(failedRequest, executeRequest);
          return {
            data: retryResult.data
          };
        } catch (retryError) {
          const retryAxiosError = retryError as AxiosError;
          return {
            error: {
              status: retryAxiosError.response?.status,
              data: retryAxiosError.response?.data ?? retryAxiosError.message
            }
          };
        }
      }

      return {
        error: {
          status: axiosError.response?.status,
          data: axiosError.response?.data ?? axiosError.message
        }
      };
    }
  };
