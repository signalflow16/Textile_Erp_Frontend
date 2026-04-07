"use client";

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import type { FrappeListResponse, FrappeMessageResponse, SessionStatus } from "@/types/frappe";
import type {
  ItemDocument,
  ItemListParams,
  ItemListResponse,
  ItemMasterLookups
} from "@/types/item";
import { setCsrfToken } from "@/store/features/session/sessionSlice";
import type { RootState } from "@/store";

const serializeFilters = (params: ItemListParams) => {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.pageSize)
  });

  if (params.search) {
    searchParams.set("search", params.search);
  }

  if (params.itemCode) {
    searchParams.set("item_code", params.itemCode);
  }

  if (params.itemName) {
    searchParams.set("item_name", params.itemName);
  }

  if (params.itemGroup) {
    searchParams.set("item_group", params.itemGroup);
  }

  if (params.variantOf) {
    searchParams.set("variant_of", params.variantOf);
  }

  if (params.hasVariants && params.hasVariants !== "all") {
    searchParams.set("has_variants", params.hasVariants);
  }

  if (params.disabled && params.disabled !== "all") {
    searchParams.set("disabled", params.disabled);
  }

  if (params.sortBy) {
    searchParams.set("sort_by", params.sortBy);
  }

  return searchParams.toString();
};

export const frappeApi = createApi({
  reducerPath: "frappeApi",
  refetchOnFocus: true,
  refetchOnReconnect: true,
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/frappe",
    credentials: "include",
    prepareHeaders: (headers, { getState, endpoint, type }) => {
      const state = getState() as RootState;
      const csrfToken = state.session.csrfToken;
      const isWriteRequest = type === "mutation" || endpoint === "createItem" || endpoint === "updateItem";

      if (isWriteRequest && csrfToken) {
        headers.set("x-frappe-csrf-token", csrfToken);
      }

      return headers;
    }
  }),
  tagTypes: ["Session", "Item", "ItemList", "Lookups"],
  endpoints: (builder) => ({
    getSession: builder.query<SessionStatus, void>({
      query: () => "/method/textile_erp.api.session_status",
      transformResponse: (response: FrappeMessageResponse<SessionStatus>) => response.message,
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCsrfToken(data.csrf_token));
        } catch {
          dispatch(setCsrfToken(null));
        }
      },
      providesTags: ["Session"]
    }),
    getHealth: builder.query<{ status: string; app: string }, void>({
      query: () => "/method/textile_erp.api.health_check",
      transformResponse: (
        response: FrappeMessageResponse<{ status: string; app: string }>
      ) => response.message
    }),
    getItemList: builder.query<ItemListResponse, ItemListParams>({
      query: (params) => `/method/textile_erp.api.item_master_list?${serializeFilters(params)}`,
      transformResponse: (response: FrappeMessageResponse<ItemListResponse>) => response.message,
      providesTags: ["ItemList"]
    }),
    getItemLookups: builder.query<ItemMasterLookups, void>({
      query: () => "/method/textile_erp.api.item_master_lookups",
      transformResponse: (response: FrappeMessageResponse<ItemMasterLookups>) => response.message,
      providesTags: ["Lookups"]
    }),
    getItem: builder.query<ItemDocument, string>({
      query: (itemCode) => `/resource/Item/${encodeURIComponent(itemCode)}`,
      transformResponse: (response: { data: ItemDocument }) => response.data,
      providesTags: (_result, _error, itemCode) => [{ type: "Item", id: itemCode }]
    }),
    createItem: builder.mutation<ItemDocument, ItemDocument>({
      query: (body) => ({
        url: "/resource/Item",
        method: "POST",
        body
      }),
      transformResponse: (response: { data: ItemDocument }) => response.data,
      invalidatesTags: ["ItemList"]
    }),
    updateItem: builder.mutation<ItemDocument, { itemCode: string; values: Partial<ItemDocument> }>({
      query: ({ itemCode, values }) => ({
        url: `/resource/Item/${encodeURIComponent(itemCode)}`,
        method: "PUT",
        body: values
      }),
      transformResponse: (response: { data: ItemDocument }) => response.data,
      invalidatesTags: (_result, _error, arg) => [
        "ItemList",
        "Lookups",
        { type: "Item", id: arg.itemCode }
      ]
    }),
    getBrands: builder.query<{ label: string; value: string }[], void>({
      query: () =>
        "/resource/Brand?fields=%5B%22name%22%5D&order_by=name%20asc&limit_page_length=500",
      transformResponse: (response: FrappeListResponse<{ name: string }>) =>
        response.data.map((entry) => ({ label: entry.name, value: entry.name })),
      providesTags: ["Lookups"]
    })
  })
});

export const {
  useCreateItemMutation,
  useGetHealthQuery,
  useGetItemListQuery,
  useGetItemLookupsQuery,
  useGetItemQuery,
  useGetSessionQuery,
  useUpdateItemMutation
} = frappeApi;
