"use client";

import {
  createAsyncThunk,
  createEntityAdapter,
  createSlice,
  type EntityState
} from "@reduxjs/toolkit";

import { apiRequest, normalizeApiError } from "@/core/api/axiosInstance";
import { masterDataEndpoints } from "@/core/api/endpoints";
import { buildPagedParams, fetchAllFrappePages, fetchFrappeCount } from "@/core/api/frappe";
import { invalidateStockSnapshots } from "@/core/store/stockSync";
import type { RootState } from "@/store";
import type {
  FrappeDocField,
  FrappeDocumentPayload,
  FrappeListPayload,
  ItemCreateValues,
  ItemFieldAvailability,
  ItemFormLookups,
  ItemMasterRow,
  MasterDataRequestState
} from "@/modules/stock/types/master-data";
import type { LookupOption } from "@/modules/stock/types/item";

type FetchItemsArgs = {
  search?: string;
  itemGroup?: string;
  page?: number;
  pageSize?: number;
};

type FetchLookupsResult = ItemFormLookups & {
  fieldAvailability: ItemFieldAvailability;
};

type ItemsSliceState = EntityState<ItemMasterRow, string> & {
  fetchStatus: MasterDataRequestState;
  createStatus: MasterDataRequestState;
  lookupsStatus: MasterDataRequestState;
  error: string | null;
  lookupsError: string | null;
  lookups: ItemFormLookups;
  fieldAvailability: ItemFieldAvailability;
  lastQuery: FetchItemsArgs;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
};

const itemsAdapter = createEntityAdapter<ItemMasterRow, string>({
  selectId: (item) => item.name,
  sortComparer: (left, right) => (right.modified ?? "").localeCompare(left.modified ?? "")
});

const initialState: ItemsSliceState = itemsAdapter.getInitialState({
  fetchStatus: "idle",
  createStatus: "idle",
  lookupsStatus: "idle",
  error: null,
  lookupsError: null,
  lookups: {
    itemGroups: [],
    uoms: []
  },
  fieldAvailability: {
    fabric_type: false,
    color: false,
    gsm: false
  },
  lastQuery: {},
  pagination: {
    current: 1,
    pageSize: 20,
    total: 0
  }
});

const mapLookupOptions = <T extends Record<string, unknown>>(rows: T[], valueKey: keyof T, labelKey?: keyof T): LookupOption[] => {
  const options: LookupOption[] = [];

  rows.forEach((row) => {
    const value = row[valueKey];
    const label = labelKey ? row[labelKey] : value;

    if (typeof value !== "string" || !value.trim()) {
      return;
    }

    options.push({
      value,
      label: typeof label === "string" && label.trim() ? label : value
    });
  });

  return options;
};

const buildFilters = ({ search, itemGroup }: FetchItemsArgs) => {
  const filters: unknown[][] = [["disabled", "in", [0, 1]]];
  const orFilters: unknown[][] = [];

  if (itemGroup?.trim()) {
    filters.push(["item_group", "=", itemGroup.trim()]);
  }

  if (search?.trim()) {
    const token = `%${search.trim()}%`;
    orFilters.push(["item_code", "like", token]);
    orFilters.push(["item_name", "like", token]);
  }

  return { filters, orFilters };
};

export const fetchItems = createAsyncThunk<
  { rows: ItemMasterRow[]; total: number; page: number; pageSize: number },
  FetchItemsArgs | undefined,
  { rejectValue: string }
>(
  "items/fetchItems",
  async (args, thunkApi) => {
    const query = args ?? {};
    const { filters, orFilters } = buildFilters(query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    try {
      const [total, payload] = await Promise.all([
        fetchFrappeCount({
          url: masterDataEndpoints.item.list,
          filters,
          orFilters
        }),
        apiRequest<FrappeListPayload<ItemMasterRow>>({
          url: masterDataEndpoints.item.list,
          method: "GET",
          params: buildPagedParams({
            fields: ["name", "item_code", "item_name", "item_group", "stock_uom", "disabled", "modified"],
            filters,
            orFilters,
            orderBy: "modified desc",
            page,
            pageSize
          })
        })
      ]);

      return {
        rows: payload.data ?? [],
        total,
        page,
        pageSize
      };
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error, "Unable to fetch items.").message);
    }
  }
);

export const fetchItemLookups = createAsyncThunk<FetchLookupsResult, void, { rejectValue: string }>(
  "items/fetchLookups",
  async (_arg, thunkApi) => {
    try {
      const [itemGroupsPayload, uomsPayload, itemMetaPayload] = await Promise.all([
        fetchAllFrappePages<{ name: string; item_group_name?: string | null }>({
          url: masterDataEndpoints.itemGroup.list,
          fields: ["name", "item_group_name"],
          filters: [["is_group", "=", 0]],
          orderBy: "item_group_name asc"
        }),
        fetchAllFrappePages<{ name: string; uom_name?: string | null }>({
          url: masterDataEndpoints.uom.list,
          fields: ["name", "uom_name"],
          orderBy: "uom_name asc"
        }),
        apiRequest<FrappeDocumentPayload<{ fields?: FrappeDocField[] }>>({
          url: masterDataEndpoints.item.meta,
          method: "GET"
        }).catch(() => ({ data: { fields: [] } }))
      ]);

      const fieldNames = new Set(
        (itemMetaPayload.data.fields ?? [])
          .map((field) => field.fieldname?.trim())
          .filter((field): field is string => Boolean(field))
      );

      return {
        itemGroups: mapLookupOptions(itemGroupsPayload ?? [], "name", "item_group_name"),
        uoms: mapLookupOptions(uomsPayload ?? [], "name", "uom_name"),
        fieldAvailability: {
          fabric_type: fieldNames.has("fabric_type"),
          color: fieldNames.has("color"),
          gsm: fieldNames.has("gsm")
        }
      };
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error, "Unable to fetch item master lookups.").message);
    }
  }
);

export const createItem = createAsyncThunk<ItemMasterRow, ItemCreateValues, { state: RootState; rejectValue: string }>(
  "items/createItem",
  async (values, thunkApi) => {
    const state = thunkApi.getState();
    const { fieldAvailability } = state.items;
    const payload: Record<string, unknown> = {
      item_code: values.item_code.trim(),
      item_name: values.item_name.trim(),
      item_group: values.item_group,
      stock_uom: values.stock_uom,
      is_stock_item: 1
    };

    if (fieldAvailability.fabric_type && values.fabric_type?.trim()) {
      payload.fabric_type = values.fabric_type.trim();
    }

    if (fieldAvailability.color && values.color?.trim()) {
      payload.color = values.color.trim();
    }

    if (fieldAvailability.gsm && typeof values.gsm === "number") {
      payload.gsm = values.gsm;
    }

    try {
      const response = await apiRequest<FrappeDocumentPayload<ItemMasterRow>>({
        url: masterDataEndpoints.item.list,
        method: "POST",
        data: payload
      });

      thunkApi.dispatch(invalidateStockSnapshots());
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error, "Unable to create item.").message);
    }
  }
);

const itemsSlice = createSlice({
  name: "items",
  initialState,
  reducers: {
    clearItemsError(state) {
      state.error = null;
      state.lookupsError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchItems.pending, (state, action) => {
        state.fetchStatus = "loading";
        state.error = null;
        state.lastQuery = action.meta.arg ?? {};
      })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.fetchStatus = "succeeded";
        state.pagination = {
          current: action.payload.page,
          pageSize: action.payload.pageSize,
          total: action.payload.total
        };
        itemsAdapter.setAll(state, action.payload.rows);
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.fetchStatus = "failed";
        state.error = action.payload ?? "Unable to fetch items.";
      })
      .addCase(fetchItemLookups.pending, (state) => {
        state.lookupsStatus = "loading";
        state.lookupsError = null;
      })
      .addCase(fetchItemLookups.fulfilled, (state, action) => {
        state.lookupsStatus = "succeeded";
        state.lookups.itemGroups = action.payload.itemGroups;
        state.lookups.uoms = action.payload.uoms;
        state.fieldAvailability = action.payload.fieldAvailability;
      })
      .addCase(fetchItemLookups.rejected, (state, action) => {
        state.lookupsStatus = "failed";
        state.lookupsError = action.payload ?? "Unable to fetch item lookups.";
      })
      .addCase(createItem.pending, (state) => {
        state.createStatus = "loading";
        state.error = null;
      })
      .addCase(createItem.fulfilled, (state, action) => {
        state.createStatus = "succeeded";
        itemsAdapter.addOne(state, action.payload);
      })
      .addCase(createItem.rejected, (state, action) => {
        state.createStatus = "failed";
        state.error = action.payload ?? "Unable to create item.";
      });
  }
});

export const { clearItemsError } = itemsSlice.actions;

const adapterSelectors = itemsAdapter.getSelectors<RootState>((state) => state.items);

export const selectAllItems = adapterSelectors.selectAll;
export const selectItemsState = (state: RootState) => state.items;
export const selectItemLookups = (state: RootState) => state.items.lookups;
export const selectItemFieldAvailability = (state: RootState) => state.items.fieldAvailability;

export default itemsSlice.reducer;
