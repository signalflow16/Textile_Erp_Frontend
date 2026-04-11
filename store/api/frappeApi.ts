"use client";

import { createApi } from "@reduxjs/toolkit/query/react";

import { axiosBaseQuery } from "@/lib/axiosBaseQuery";
import type { FrappeListResponse, FrappeMessageResponse, SessionStatus } from "@/types/frappe";
import type {
  ItemGroupDeleteResponse,
  ItemGroupDocument,
  ItemGroupListParams,
  ItemGroupListResponse,
  ItemGroupLookups,
  ItemGroupLookupsParams,
  ItemGroupMutationPayload,
  ItemGroupTreeResponse
} from "@/types/item-group";
import type {
  ItemDocument,
  ItemListParams,
  ItemListSortBy,
  ItemListSortOrder,
  ItemMutationResponse,
  ItemListResponse,
  ItemMasterLookups,
  ItemPriceListParams,
  ItemPriceListResponse,
  ItemPriceSummary,
  ItemVariantAttributeLookups
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

  if (params.sortOrder) {
    searchParams.set("sort_order", params.sortOrder);
  }

  return searchParams.toString();
};

const serializeItemPriceFilters = (params: ItemPriceListParams) => {
  const searchParams = new URLSearchParams({
    item_code: params.itemCode,
    page: String(params.page ?? 1),
    page_size: String(params.pageSize ?? 20)
  });

  if (params.priceList) {
    searchParams.set("price_list", params.priceList);
  }

  if (params.selling) {
    searchParams.set("selling", params.selling);
  }

  if (params.buying) {
    searchParams.set("buying", params.buying);
  }

  return searchParams.toString();
};

const serializeItemGroupListFilters = (params: ItemGroupListParams) => {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.pageSize)
  });

  if (params.search) {
    searchParams.set("search", params.search);
  }

  if (params.parentItemGroup) {
    searchParams.set("parent_item_group", params.parentItemGroup);
  }

  if (params.isGroup && params.isGroup !== "all") {
    searchParams.set("is_group", params.isGroup);
  }

  if (params.disabled && params.disabled !== "all") {
    searchParams.set("disabled", params.disabled);
  }

  if (params.sortBy) {
    searchParams.set("sort_by", params.sortBy);
  }

  if (params.sortOrder) {
    searchParams.set("sort_order", params.sortOrder);
  }

  return searchParams.toString();
};

const serializeItemGroupLookups = (params?: ItemGroupLookupsParams) => {
  const searchParams = new URLSearchParams();

  if (params?.currentItemGroup) {
    searchParams.set("current_item_group", params.currentItemGroup);
  }

  return searchParams.toString();
};

const extractItemGroupDocument = (
  response: FrappeMessageResponse<{ item_group?: ItemGroupDocument } | ItemGroupDocument>
) => {
  const message = response.message;

  if (
    message &&
    typeof message === "object" &&
    "item_group" in message &&
    message.item_group
  ) {
    return message.item_group;
  }

  return message as ItemGroupDocument;
};

export const frappeApi = createApi({
  reducerPath: "frappeApi",
  refetchOnFocus: true,
  refetchOnReconnect: true,
  baseQuery: axiosBaseQuery({
    baseUrl: "/api/frappe",
    prepareHeaders: (headers, { getState, endpoint, type }) => {
      const state = getState() as RootState;
      const csrfToken = state.session.csrfToken;
      const isWriteRequest = type === "mutation" || endpoint === "createItem" || endpoint === "updateItem";

      if (isWriteRequest && csrfToken) {
        headers["x-frappe-csrf-token"] = csrfToken;
      }

      return headers;
    }
  }),
  tagTypes: [
    "Session",
    "Item",
    "ItemList",
    "Lookups",
    "ItemPrice",
    "ItemGroupTree",
    "ItemGroupList",
    "ItemGroupDetail",
    "ItemGroupLookups"
  ],
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
    getItemGroupLookups: builder.query<ItemGroupLookups, ItemGroupLookupsParams | void>({
      query: (params) => {
        const queryString = serializeItemGroupLookups(params || undefined);
        return queryString
          ? `/method/textile_erp.api.item_group_lookups?${queryString}`
          : "/method/textile_erp.api.item_group_lookups";
      },
      transformResponse: (response: FrappeMessageResponse<ItemGroupLookups>) => response.message,
      providesTags: ["ItemGroupLookups"]
    }),
    getItemGroupList: builder.query<ItemGroupListResponse, ItemGroupListParams>({
      query: (params) => `/method/textile_erp.api.item_group_list?${serializeItemGroupListFilters(params)}`,
      transformResponse: (response: FrappeMessageResponse<ItemGroupListResponse>) => response.message,
      providesTags: ["ItemGroupList"]
    }),
    getItemGroupTree: builder.query<ItemGroupTreeResponse, { search?: string; includeDisabled?: boolean } | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.search) {
          searchParams.set("search", params.search);
        }
        if (params?.includeDisabled) {
          searchParams.set("include_disabled", "1");
        }

        const queryString = searchParams.toString();
        return queryString
          ? `/method/textile_erp.api.item_group_tree?${queryString}`
          : "/method/textile_erp.api.item_group_tree";
      },
      transformResponse: (response: FrappeMessageResponse<ItemGroupTreeResponse | ItemGroupTreeResponse["data"]>) => {
        const message = response.message;
        if (Array.isArray(message)) {
          return { data: message };
        }

        return message;
      },
      providesTags: ["ItemGroupTree"]
    }),
    getItemGroup: builder.query<ItemGroupDocument, string>({
      query: (itemGroup) => `/method/textile_erp.api.item_group_get?item_group=${encodeURIComponent(itemGroup)}`,
      transformResponse: (response: FrappeMessageResponse<ItemGroupDocument>) => response.message,
      providesTags: (_result, _error, itemGroup) => [{ type: "ItemGroupDetail", id: itemGroup }]
    }),
    getItem: builder.query<ItemDocument, string>({
      query: (itemCode) => `/resource/Item/${encodeURIComponent(itemCode)}`,
      transformResponse: (response: { data: ItemDocument }) => response.data,
      providesTags: (_result, _error, itemCode) => [{ type: "Item", id: itemCode }]
    }),
    getItemVariantAttributeLookups: builder.query<ItemVariantAttributeLookups, string | void>({
      query: (templateItem) =>
        templateItem
          ? `/method/textile_erp.api.item_variant_attribute_lookups?template_item=${encodeURIComponent(templateItem)}`
          : "/method/textile_erp.api.item_variant_attribute_lookups",
      transformResponse: (response: FrappeMessageResponse<ItemVariantAttributeLookups>) => response.message,
      providesTags: ["Lookups"]
    }),
    getItemPriceSummary: builder.query<ItemPriceSummary, string>({
      query: (itemCode) =>
        `/method/textile_erp.api.item_price_summary?item_code=${encodeURIComponent(itemCode)}`,
      transformResponse: (response: FrappeMessageResponse<ItemPriceSummary>) => response.message,
      providesTags: (_result, _error, itemCode) => [{ type: "ItemPrice", id: itemCode }]
    }),
    getItemPriceList: builder.query<ItemPriceListResponse, ItemPriceListParams>({
      query: (params) => `/method/textile_erp.api.item_price_list?${serializeItemPriceFilters(params)}`,
      transformResponse: (response: FrappeMessageResponse<ItemPriceListResponse>) => response.message,
      providesTags: (_result, _error, arg) => [{ type: "ItemPrice", id: arg.itemCode }]
    }),
    createItem: builder.mutation<ItemDocument, ItemDocument>({
      query: (payload) => ({
        url: "/method/textile_erp.api.item_save",
        method: "POST",
        data: { payload }
      }),
      transformResponse: (response: FrappeMessageResponse<ItemMutationResponse>) => response.message.item,
      invalidatesTags: ["ItemList", "Lookups"]
    }),
    updateItem: builder.mutation<ItemDocument, { itemCode: string; values: Partial<ItemDocument> }>({
      query: ({ itemCode, values: payload }) => ({
        url: "/method/textile_erp.api.item_update",
        method: "POST",
        data: {
          item_code: itemCode,
          payload
        }
      }),
      transformResponse: (response: FrappeMessageResponse<ItemMutationResponse>) => response.message.item,
      invalidatesTags: (_result, _error, arg) => [
        "ItemList",
        "Lookups",
        { type: "Item", id: arg.itemCode },
        { type: "ItemPrice", id: arg.itemCode }
      ]
    }),
    createItemGroup: builder.mutation<ItemGroupDocument, ItemGroupMutationPayload>({
      query: (payload) => ({
        url: "/method/textile_erp.api.item_group_save",
        method: "POST",
        data: { payload }
      }),
      transformResponse: extractItemGroupDocument,
      invalidatesTags: ["ItemGroupTree", "ItemGroupList", "ItemGroupLookups"]
    }),
    updateItemGroup: builder.mutation<
      ItemGroupDocument,
      { itemGroup: string; values: ItemGroupMutationPayload }
    >({
      query: ({ itemGroup, values }) => ({
        url: "/method/textile_erp.api.item_group_update",
        method: "POST",
        data: {
          item_group: itemGroup,
          payload: values
        }
      }),
      transformResponse: extractItemGroupDocument,
      invalidatesTags: (_result, _error, arg) => [
        "ItemGroupTree",
        "ItemGroupList",
        "ItemGroupLookups",
        { type: "ItemGroupDetail", id: arg.itemGroup }
      ]
    }),
    toggleItemGroupDisabled: builder.mutation<
      ItemGroupDocument,
      { itemGroup: string; disabled: boolean }
    >({
      query: ({ itemGroup, disabled }) => ({
        url: "/method/textile_erp.api.item_group_toggle_disabled",
        method: "POST",
        data: {
          item_group: itemGroup,
          disabled: disabled ? 1 : 0
        }
      }),
      transformResponse: extractItemGroupDocument,
      invalidatesTags: (_result, _error, arg) => [
        "ItemGroupTree",
        "ItemGroupList",
        "ItemGroupLookups",
        { type: "ItemGroupDetail", id: arg.itemGroup }
      ]
    }),
    deleteItemGroup: builder.mutation<ItemGroupDeleteResponse, string>({
      query: (itemGroup) => ({
        url: "/method/textile_erp.api.item_group_delete",
        method: "POST",
        data: {
          item_group: itemGroup
        }
      }),
      transformResponse: (response: FrappeMessageResponse<ItemGroupDeleteResponse>) => response.message,
      invalidatesTags: (_result, _error, itemGroup) => [
        "ItemGroupTree",
        "ItemGroupList",
        "ItemGroupLookups",
        { type: "ItemGroupDetail", id: itemGroup }
      ]
    }),
    moveItemGroup: builder.mutation<
      ItemGroupDocument,
      { itemGroup: string; newParentItemGroup?: string | null }
    >({
      query: ({ itemGroup, newParentItemGroup }) => ({
        url: "/method/textile_erp.api.item_group_move",
        method: "POST",
        data: {
          item_group: itemGroup,
          new_parent_item_group: newParentItemGroup ?? ""
        }
      }),
      transformResponse: extractItemGroupDocument,
      invalidatesTags: (_result, _error, arg) => [
        "ItemGroupTree",
        "ItemGroupList",
        "ItemGroupLookups",
        { type: "ItemGroupDetail", id: arg.itemGroup }
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
  useCreateItemGroupMutation,
  useCreateItemMutation,
  useDeleteItemGroupMutation,
  useGetHealthQuery,
  useGetItemGroupListQuery,
  useGetItemGroupLookupsQuery,
  useGetItemGroupQuery,
  useGetItemGroupTreeQuery,
  useGetItemListQuery,
  useGetItemLookupsQuery,
  useGetItemPriceListQuery,
  useGetItemPriceSummaryQuery,
  useGetItemQuery,
  useGetItemVariantAttributeLookupsQuery,
  useGetSessionQuery,
  useMoveItemGroupMutation,
  useToggleItemGroupDisabledMutation,
  useUpdateItemGroupMutation,
  useUpdateItemMutation
} = frappeApi;
