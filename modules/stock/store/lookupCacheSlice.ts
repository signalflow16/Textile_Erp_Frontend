"use client";

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { normalizeApiError, apiRequest } from "@/core/api/axiosInstance";
import { masterDataEndpoints } from "@/core/api/endpoints";
import { encodeFrappeJson, fetchAllFrappePages } from "@/core/api/frappe";
import type { RootState } from "@/store";
import type { LookupCacheEntry, LookupCacheState } from "@/modules/stock/types/document-engine";
import type { LookupOption } from "@/modules/stock/types/item";

const LOOKUP_TTL_MS = 5 * 60 * 1000;

const createEntry = (): LookupCacheEntry => ({
  status: "idle",
  error: null,
  items: [],
  lastFetchedAt: null
});

const initialState: LookupCacheState = {
  items: createEntry(),
  warehouses: createEntry(),
  uoms: createEntry(),
  priceLists: createEntry(),
  suppliers: createEntry(),
  customers: createEntry()
};

const shouldSkipFetch = (entry: LookupCacheEntry, force?: boolean) => {
  if (force) {
    return false;
  }

  return Boolean(entry.lastFetchedAt && Date.now() - entry.lastFetchedAt < LOOKUP_TTL_MS && entry.items.length > 0);
};

const mapLookupOptions = <T extends Record<string, unknown>>(rows: T[], key: keyof T, labelKey?: keyof T): LookupOption[] =>
  rows.reduce<LookupOption[]>((options, row) => {
    const value = row[key];
    const label = labelKey ? row[labelKey] : value;
    if (typeof value !== "string" || !value.trim()) {
      return options;
    }

    options.push({
      value,
      label: typeof label === "string" && label.trim() ? label : value
    });
    return options;
  }, []);

export const fetchLookupCache = createAsyncThunk<
  { key: keyof LookupCacheState; items: LookupOption[]; fetchedAt: number },
  { key: keyof LookupCacheState; force?: boolean },
  { rejectValue: { key: keyof LookupCacheState; message: string }; state: RootState }
>("lookupCache/fetch", async ({ key, force }, thunkApi) => {
  const state = thunkApi.getState().lookupCache[key];
  if (shouldSkipFetch(state, force)) {
    return {
      key,
      items: state.items,
      fetchedAt: state.lastFetchedAt ?? Date.now()
    };
  }

  try {
    let items: LookupOption[] = [];

    switch (key) {
      case "items":
        items = mapLookupOptions(
          await fetchAllFrappePages<{ name: string; item_name?: string | null }>({
            url: masterDataEndpoints.item.list,
            fields: ["name", "item_name"],
            orderBy: "item_name asc"
          }),
          "name",
          "item_name"
        );
        break;
      case "warehouses":
        items = mapLookupOptions(
          await fetchAllFrappePages<{ name: string; warehouse_name?: string | null }>({
            url: masterDataEndpoints.warehouse.list,
            fields: ["name", "warehouse_name"],
            filters: [["is_group", "=", 0]],
            orderBy: "warehouse_name asc"
          }),
          "name",
          "warehouse_name"
        );
        break;
      case "uoms":
        items = mapLookupOptions(
          await fetchAllFrappePages<{ name: string }>({
            url: masterDataEndpoints.uom.list,
            fields: ["name"],
            orderBy: "name asc"
          }),
          "name"
        );
        break;
      case "priceLists":
        items = mapLookupOptions(
          await fetchAllFrappePages<{ name: string; price_list_name?: string | null }>({
            url: masterDataEndpoints.priceList.list,
            fields: ["name", "price_list_name"],
            orderBy: "price_list_name asc"
          }),
          "name",
          "price_list_name"
        );
        break;
      case "suppliers":
        items = mapLookupOptions(
          await fetchAllFrappePages<{ name: string; supplier_name?: string | null }>({
            url: masterDataEndpoints.supplier.list,
            fields: ["name", "supplier_name"],
            orderBy: "supplier_name asc"
          }),
          "name",
          "supplier_name"
        );
        break;
      case "customers":
        items = mapLookupOptions(
          await fetchAllFrappePages<{ name: string; customer_name?: string | null }>({
            url: masterDataEndpoints.customer.list,
            fields: ["name", "customer_name"],
            orderBy: "customer_name asc"
          }),
          "name",
          "customer_name"
        );
        break;
    }

    return {
      key,
      items,
      fetchedAt: Date.now()
    };
  } catch (error) {
    return thunkApi.rejectWithValue({
      key,
      message: normalizeApiError(error, `Unable to fetch ${key}.`).message
    });
  }
});

const lookupCacheSlice = createSlice({
  name: "lookupCache",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLookupCache.pending, (state, action) => {
        state[action.meta.arg.key].status = "loading";
        state[action.meta.arg.key].error = null;
      })
      .addCase(fetchLookupCache.fulfilled, (state, action) => {
        state[action.payload.key] = {
          status: "succeeded",
          error: null,
          items: action.payload.items,
          lastFetchedAt: action.payload.fetchedAt
        };
      })
      .addCase(fetchLookupCache.rejected, (state, action) => {
        if (!action.payload) {
          return;
        }

        state[action.payload.key].status = "failed";
        state[action.payload.key].error = action.payload.message;
      });
  }
});

export const selectLookupCache = (state: RootState) => state.lookupCache;

export default lookupCacheSlice.reducer;
