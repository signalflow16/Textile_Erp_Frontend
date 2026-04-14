"use client";

import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
  type EntityState,
  type PayloadAction
} from "@reduxjs/toolkit";

import { apiRequest, normalizeApiError } from "@/services/axiosInstance";
import { masterDataEndpoints } from "@/services/endpoints";
import { fetchAllFrappePages } from "@/services/frappe";
import { invalidateStockSnapshots } from "@/store/actions/stockSync";
import type { RootState } from "@/store";
import type {
  FrappeDocumentPayload,
  FrappeListPayload,
  LookupState,
  MasterDataRequestState,
  WarehouseCreateValues,
  WarehouseNode,
  WarehouseRow
} from "@/types/master-data";
import type { LookupOption } from "@/types/item";

type WarehouseState = EntityState<WarehouseRow, string> & {
  selectedWarehouse?: string;
  fetchStatus: MasterDataRequestState;
  detailStatus: MasterDataRequestState;
  createStatus: MasterDataRequestState;
  updateStatus: MasterDataRequestState;
  lookupStatus: MasterDataRequestState;
  error: string | null;
  lookups: LookupState;
};

const warehouseAdapter = createEntityAdapter<WarehouseRow, string>({
  selectId: (warehouse) => warehouse.name,
  sortComparer: (left, right) => (left.warehouse_name ?? left.name).localeCompare(right.warehouse_name ?? right.name)
});

const initialState: WarehouseState = warehouseAdapter.getInitialState({
  selectedWarehouse: undefined,
  fetchStatus: "idle",
  detailStatus: "idle",
  createStatus: "idle",
  updateStatus: "idle",
  lookupStatus: "idle",
  error: null,
  lookups: {
    companies: []
  }
});

const encodeFrappeJson = (value: unknown) => JSON.stringify(value);

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

export const fetchWarehouses = createAsyncThunk<WarehouseRow[], void, { rejectValue: string }>(
  "warehouses/fetchWarehouses",
  async (_arg, thunkApi) => {
    try {
      return await fetchAllFrappePages<WarehouseRow>({
        url: masterDataEndpoints.warehouse.list,
        fields: ["name", "warehouse_name", "parent_warehouse", "company", "is_group", "disabled", "modified"],
        orderBy: "warehouse_name asc"
      });
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error, "Unable to fetch warehouses.").message);
    }
  }
);

export const fetchWarehouseLookups = createAsyncThunk<LookupState, void, { rejectValue: string }>(
  "warehouses/fetchLookups",
  async (_arg, thunkApi) => {
    try {
      const payload = await apiRequest<FrappeListPayload<{ name: string; company_name?: string | null }>>({
        url: masterDataEndpoints.company.list,
        method: "GET",
        params: {
          fields: encodeFrappeJson(["name", "company_name"]),
          order_by: "company_name asc",
          limit_page_length: 200
        }
      });

      return {
        companies: mapLookupOptions(payload.data ?? [], "name", "company_name")
      };
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error, "Unable to fetch warehouse lookups.").message);
    }
  }
);

export const createWarehouse = createAsyncThunk<WarehouseRow, WarehouseCreateValues, { rejectValue: string }>(
  "warehouses/createWarehouse",
  async (values, thunkApi) => {
    try {
      const response = await apiRequest<FrappeDocumentPayload<WarehouseRow>>({
        url: masterDataEndpoints.warehouse.list,
        method: "POST",
        data: {
          warehouse_name: values.warehouse_name.trim(),
          ...(values.parent_warehouse ? { parent_warehouse: values.parent_warehouse } : {}),
          ...(values.company ? { company: values.company } : {}),
          ...(typeof values.is_group === "boolean" ? { is_group: values.is_group ? 1 : 0 } : {})
        }
      });

      thunkApi.dispatch(invalidateStockSnapshots());
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error, "Unable to create warehouse.").message);
    }
  }
);

export const fetchWarehouseDetail = createAsyncThunk<WarehouseRow, string, { rejectValue: string }>(
  "warehouses/fetchWarehouseDetail",
  async (warehouseName, thunkApi) => {
    try {
      const response = await apiRequest<FrappeDocumentPayload<WarehouseRow>>({
        url: masterDataEndpoints.warehouse.detail(warehouseName),
        method: "GET",
        params: {
          fields: encodeFrappeJson(["name", "warehouse_name", "parent_warehouse", "company", "is_group", "disabled", "modified"])
        }
      });

      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error, "Unable to fetch warehouse details.").message);
    }
  }
);

export const updateWarehouse = createAsyncThunk<
  WarehouseRow,
  { warehouse: string; values: WarehouseCreateValues },
  { rejectValue: string }
>(
  "warehouses/updateWarehouse",
  async ({ warehouse, values }, thunkApi) => {
    try {
      const response = await apiRequest<FrappeDocumentPayload<WarehouseRow>>({
        url: masterDataEndpoints.warehouse.detail(warehouse),
        method: "PUT",
        data: {
          warehouse_name: values.warehouse_name.trim(),
          ...(values.parent_warehouse ? { parent_warehouse: values.parent_warehouse } : {}),
          ...(values.company ? { company: values.company } : {}),
          ...(typeof values.is_group === "boolean" ? { is_group: values.is_group ? 1 : 0 } : {})
        }
      });

      thunkApi.dispatch(invalidateStockSnapshots());
      return response.data;
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error, "Unable to update warehouse.").message);
    }
  }
);

export const deleteWarehouse = createAsyncThunk<string, string, { rejectValue: string }>(
  "warehouses/deleteWarehouse",
  async (warehouseName, thunkApi) => {
    try {
      await apiRequest({
        url: masterDataEndpoints.warehouse.detail(warehouseName),
        method: "DELETE"
      });

      return warehouseName;
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error, "Unable to delete warehouse.").message);
    }
  }
);

const warehouseSlice = createSlice({
  name: "warehouses",
  initialState,
  reducers: {
    clearWarehouseError(state) {
      state.error = null;
    },
    setSelectedWarehouse(state, action: PayloadAction<string | undefined>) {
      state.selectedWarehouse = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWarehouses.pending, (state) => {
        state.fetchStatus = "loading";
        state.error = null;
      })
      .addCase(fetchWarehouses.fulfilled, (state, action) => {
        state.fetchStatus = "succeeded";
        warehouseAdapter.setAll(state, action.payload);
      })
      .addCase(fetchWarehouses.rejected, (state, action) => {
        state.fetchStatus = "failed";
        state.error = action.payload ?? "Unable to fetch warehouses.";
      })
      .addCase(fetchWarehouseLookups.pending, (state) => {
        state.lookupStatus = "loading";
      })
      .addCase(fetchWarehouseLookups.fulfilled, (state, action) => {
        state.lookupStatus = "succeeded";
        state.lookups = action.payload;
      })
      .addCase(fetchWarehouseLookups.rejected, (state, action) => {
        state.lookupStatus = "failed";
        state.error = action.payload ?? "Unable to fetch warehouse lookups.";
      })
      .addCase(fetchWarehouseDetail.pending, (state) => {
        state.detailStatus = "loading";
        state.error = null;
      })
      .addCase(fetchWarehouseDetail.fulfilled, (state, action) => {
        state.detailStatus = "succeeded";
        warehouseAdapter.upsertOne(state, action.payload);
      })
      .addCase(fetchWarehouseDetail.rejected, (state, action) => {
        state.detailStatus = "failed";
        state.error = action.payload ?? "Unable to fetch warehouse details.";
      })
      .addCase(createWarehouse.pending, (state) => {
        state.createStatus = "loading";
        state.error = null;
      })
      .addCase(createWarehouse.fulfilled, (state, action) => {
        state.createStatus = "succeeded";
        warehouseAdapter.addOne(state, action.payload);
        state.selectedWarehouse = action.payload.name;
      })
      .addCase(createWarehouse.rejected, (state, action) => {
        state.createStatus = "failed";
        state.error = action.payload ?? "Unable to create warehouse.";
      })
      .addCase(updateWarehouse.pending, (state) => {
        state.updateStatus = "loading";
        state.error = null;
      })
      .addCase(updateWarehouse.fulfilled, (state, action) => {
        state.updateStatus = "succeeded";
        warehouseAdapter.upsertOne(state, action.payload);
        state.selectedWarehouse = action.payload.name;
      })
      .addCase(updateWarehouse.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.error = action.payload ?? "Unable to update warehouse.";
      })
      .addCase(deleteWarehouse.pending, (state) => {
        state.updateStatus = "loading";
        state.error = null;
      })
      .addCase(deleteWarehouse.fulfilled, (state, action) => {
        state.updateStatus = "succeeded";
        warehouseAdapter.removeOne(state, action.payload);
        if (state.selectedWarehouse === action.payload) {
          state.selectedWarehouse = undefined;
        }
      })
      .addCase(deleteWarehouse.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.error = action.payload ?? "Unable to delete warehouse.";
      });
  }
});

export const { clearWarehouseError, setSelectedWarehouse } = warehouseSlice.actions;

const adapterSelectors = warehouseAdapter.getSelectors<RootState>((state) => state.warehouses);

export const selectAllWarehouses = adapterSelectors.selectAll;
export const selectWarehouseState = (state: RootState) => state.warehouses;
export const selectWarehouseCompanies = (state: RootState) => state.warehouses.lookups.companies;
export const selectSelectedWarehouseId = (state: RootState) => state.warehouses.selectedWarehouse;
export const selectSelectedWarehouse = createSelector(
  [adapterSelectors.selectEntities, selectSelectedWarehouseId],
  (entities, selectedWarehouseId) => (selectedWarehouseId ? entities[selectedWarehouseId] : undefined)
);

export const selectWarehouseTree = createSelector([selectAllWarehouses], (warehouses): WarehouseNode[] => {
  const nodesById = new Map<string, WarehouseNode>();
  const roots: WarehouseNode[] = [];

  warehouses.forEach((warehouse) => {
    nodesById.set(warehouse.name, {
      ...warehouse,
      title: warehouse.warehouse_name || warehouse.name,
      key: warehouse.name,
      children: [],
      depth: 0
    });
  });

  nodesById.forEach((node) => {
    if (node.parent_warehouse && nodesById.has(node.parent_warehouse)) {
      const parent = nodesById.get(node.parent_warehouse);
      if (parent) {
        node.depth = parent.depth + 1;
        parent.children.push(node);
      }
      return;
    }

    roots.push(node);
  });

  const sortNodes = (entries: WarehouseNode[]) => {
    entries.sort((left, right) => left.title.localeCompare(right.title));
    entries.forEach((entry) => sortNodes(entry.children));
  };

  sortNodes(roots);
  return roots;
});

export default warehouseSlice.reducer;
