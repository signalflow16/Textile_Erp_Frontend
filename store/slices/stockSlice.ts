"use client";

import { createAsyncThunk, createEntityAdapter, createSlice } from "@reduxjs/toolkit";

import { apiRequest, normalizeApiError } from "@/services/axiosInstance";
import { stockEndpoints } from "@/store/api/stockEndpoints";
import type { RootState } from "@/store";
import type { FrappeListPayload, MasterDataRequestState } from "@/types/master-data";
import type { LookupOption } from "@/types/item";
import type {
  DashboardModuleStatus,
  FrappeStockEntryDocumentPayload,
  FrappeStockEntryListPayload,
  ItemShortageRow,
  MonthlyTrendPoint,
  OldestStockItem,
  StockDashboardData,
  StockEntryCreateValues,
  StockEntryDocument,
  StockEntryFilters,
  StockEntryItemRow,
  StockEntryListRow,
  StockEntryLookups,
  StockState,
  StockSummary,
  WarehouseStockPoint
} from "@/types/stock";

const stockEntryAdapter = createEntityAdapter<StockEntryListRow, string>({
  selectId: (entry) => entry.name,
  sortComparer: (left, right) => `${right.posting_date ?? ""} ${right.posting_time ?? ""}`.localeCompare(
    `${left.posting_date ?? ""} ${left.posting_time ?? ""}`
  )
});

const ERP_NEXT_STOCK_ENTRY_TYPES: LookupOption[] = [
  "Material Issue",
  "Material Receipt",
  "Material Transfer",
  "Material Transfer for Manufacture",
  "Material Consumption for Manufacture",
  "Manufacture",
  "Repack",
  "Send to Subcontractor"
].map((value) => ({ label: value, value }));

const initialState: StockState = {
  dashboardData: null,
  dashboardStatus: "idle",
  dashboardError: null,
  stockEntries: stockEntryAdapter.getInitialState(),
  stockEntriesStatus: "idle",
  stockEntriesError: null,
  stockEntryDetails: {},
  detailStatus: {},
  detailError: {},
  createStatus: "idle",
  createError: null,
  lookups: {
    stockEntryTypes: [],
    items: [],
    warehouses: []
  },
  lookupsStatus: "idle",
  lookupsError: null,
  hydratedEntries: []
};

const encodeFrappeJson = (value: unknown) => JSON.stringify(value);

const parseNumber = (value: unknown) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const monthKey = (dateValue?: string | null) => {
  if (!dateValue) {
    return "Unknown";
  }

  const [year, month] = dateValue.split("-");
  if (!year || !month) {
    return dateValue;
  }

  return `${year}-${month}`;
};

const aggregateMonthlyValues = <T extends Record<string, unknown>>(
  rows: T[],
  dateKey: keyof T,
  amountKeys: (keyof T)[]
): MonthlyTrendPoint[] => {
  const totals = new Map<string, number>();

  rows.forEach((row) => {
    const month = monthKey(typeof row[dateKey] === "string" ? row[dateKey] : undefined);
    const amount = amountKeys.reduce((sum, key) => sum + parseNumber(row[key]), 0);
    totals.set(month, (totals.get(month) ?? 0) + amount);
  });

  return Array.from(totals.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([month, value]) => ({ month, value }));
};

const isFulfilled = <T>(result: PromiseSettledResult<T>): result is PromiseFulfilledResult<T> => result.status === "fulfilled";

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

const createDashboardData = (args: {
  items: Array<{ name: string; disabled?: 0 | 1 }>;
  warehouses: Array<{ name: string }>;
  bins: Array<{ warehouse?: string | null; stock_value?: number | string | null; actual_qty?: number | string | null; item_code?: string | null }>;
  ledger: Array<{ name: string; item_code?: string | null; warehouse?: string | null; posting_date?: string | null; actual_qty?: number | string | null; valuation_rate?: number | string | null }>;
  purchaseReceipts: Array<{ posting_date?: string | null; grand_total?: number | string | null; base_grand_total?: number | string | null }>;
  deliveryNotes: Array<{ posting_date?: string | null; grand_total?: number | string | null; base_grand_total?: number | string | null }>;
  purchaseReceiptsReady: DashboardModuleStatus;
  deliveryNotesReady: DashboardModuleStatus;
}): StockDashboardData => {
  const summary: StockSummary = {
    activeItems: args.items.filter((item) => !item.disabled).length,
    warehouses: args.warehouses.length,
    totalStockValue: args.bins.reduce((sum, bin) => sum + parseNumber(bin.stock_value), 0)
  };

  const warehouseMap = new Map<string, number>();
  args.bins.forEach((bin) => {
    const warehouse = bin.warehouse?.trim();
    if (!warehouse) {
      return;
    }

    warehouseMap.set(warehouse, (warehouseMap.get(warehouse) ?? 0) + parseNumber(bin.stock_value));
  });

  const warehouseWiseStockValue: WarehouseStockPoint[] = Array.from(warehouseMap.entries())
    .map(([warehouse, stockValue]) => ({ warehouse, stockValue }))
    .sort((left, right) => right.stockValue - left.stockValue)
    .slice(0, 8);

  const purchaseReceiptTrends = aggregateMonthlyValues(args.purchaseReceipts, "posting_date", ["base_grand_total", "grand_total"]);
  const deliveryTrends = aggregateMonthlyValues(args.deliveryNotes, "posting_date", ["base_grand_total", "grand_total"]);

  const oldestItems: OldestStockItem[] = args.ledger
    .slice()
    .sort((left, right) => `${left.posting_date ?? ""}`.localeCompare(`${right.posting_date ?? ""}`))
    .slice(0, 6)
    .map((entry) => ({
      name: entry.name,
      itemCode: entry.item_code ?? "Unknown Item",
      warehouse: entry.warehouse,
      postingDate: entry.posting_date,
      actualQty: parseNumber(entry.actual_qty),
      valuationRate: parseNumber(entry.valuation_rate)
    }));

  const shortageItems: ItemShortageRow[] = args.bins
    .filter((bin) => parseNumber(bin.actual_qty) <= 0 && typeof bin.item_code === "string" && typeof bin.warehouse === "string")
    .map((bin) => ({
      itemCode: bin.item_code as string,
      warehouse: bin.warehouse as string,
      actualQty: parseNumber(bin.actual_qty),
      shortageQty: Math.abs(parseNumber(bin.actual_qty))
    }))
    .sort((left, right) => left.actualQty - right.actualQty)
    .slice(0, 8);

  return {
    summary,
    warehouseWiseStockValue,
    purchaseReceiptTrends,
    deliveryTrends,
    oldestItems,
    shortageItems,
    moduleStatus: {
      purchaseReceipts: args.purchaseReceiptsReady,
      deliveryNotes: args.deliveryNotesReady
    }
  };
};

export const fetchDashboardData = createAsyncThunk<StockDashboardData, void, { rejectValue: string }>(
  "stock/fetchDashboardData",
  async (_arg, thunkApi) => {
    try {
      const results = await Promise.allSettled([
        apiRequest<FrappeListPayload<{ name: string; disabled?: 0 | 1 }>>({
          url: stockEndpoints.item.list,
          method: "GET",
          params: {
            fields: encodeFrappeJson(["name", "disabled"]),
            limit_page_length: 1000
          }
        }),
        apiRequest<FrappeListPayload<{ name: string }>>({
          url: stockEndpoints.warehouse.list,
          method: "GET",
          params: {
            fields: encodeFrappeJson(["name"]),
            limit_page_length: 1000
          }
        }),
        apiRequest<FrappeListPayload<{ warehouse?: string | null; stock_value?: number | string | null; actual_qty?: number | string | null; item_code?: string | null }>>({
          url: stockEndpoints.bin.list,
          method: "GET",
          params: {
            fields: encodeFrappeJson(["warehouse", "stock_value", "actual_qty", "item_code"]),
            limit_page_length: 1000
          }
        }),
        apiRequest<FrappeListPayload<{ name: string; item_code?: string | null; warehouse?: string | null; posting_date?: string | null; actual_qty?: number | string | null; valuation_rate?: number | string | null }>>({
          url: stockEndpoints.stockLedgerEntry.list,
          method: "GET",
          params: {
            fields: encodeFrappeJson(["name", "item_code", "warehouse", "posting_date", "actual_qty", "valuation_rate"]),
            order_by: "posting_date asc",
            limit_page_length: 12
          }
        }),
        apiRequest<FrappeListPayload<{ posting_date?: string | null; grand_total?: number | string | null; base_grand_total?: number | string | null }>>({
          url: stockEndpoints.purchaseReceipt.list,
          method: "GET",
          params: {
            fields: encodeFrappeJson(["posting_date", "grand_total", "base_grand_total"]),
            order_by: "posting_date asc",
            limit_page_length: 500
          }
        }),
        apiRequest<FrappeListPayload<{ posting_date?: string | null; grand_total?: number | string | null; base_grand_total?: number | string | null }>>({
          url: stockEndpoints.deliveryNote.list,
          method: "GET",
          params: {
            fields: encodeFrappeJson(["posting_date", "grand_total", "base_grand_total"]),
            order_by: "posting_date asc",
            limit_page_length: 500
          }
        })
      ]);

      const [itemsResult, warehousesResult, binsResult, ledgerResult, purchaseReceiptResult, deliveryNoteResult] = results;

      if (!isFulfilled(itemsResult) || !isFulfilled(warehousesResult) || !isFulfilled(binsResult) || !isFulfilled(ledgerResult)) {
        return thunkApi.rejectWithValue("Unable to fetch core stock dashboard data.");
      }

      return createDashboardData({
        items: itemsResult.value.data ?? [],
        warehouses: warehousesResult.value.data ?? [],
        bins: binsResult.value.data ?? [],
        ledger: ledgerResult.value.data ?? [],
        purchaseReceipts: isFulfilled(purchaseReceiptResult) ? purchaseReceiptResult.value.data ?? [] : [],
        deliveryNotes: isFulfilled(deliveryNoteResult) ? deliveryNoteResult.value.data ?? [] : [],
        purchaseReceiptsReady: isFulfilled(purchaseReceiptResult) ? "ready" : "partial",
        deliveryNotesReady: isFulfilled(deliveryNoteResult) ? "ready" : "partial"
      });
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error, "Unable to fetch stock dashboard.").message);
    }
  }
);

export const fetchStockEntryLookups = createAsyncThunk<StockEntryLookups, void, { rejectValue: string }>(
  "stock/fetchStockEntryLookups",
  async (_arg, thunkApi) => {
    try {
      const [stockEntryTypeResult, itemResult, warehouseResult] = await Promise.allSettled([
        apiRequest<FrappeListPayload<{ name: string }>>({
          url: stockEndpoints.stockEntryType.list,
          method: "GET",
          params: {
            fields: encodeFrappeJson(["name"]),
            order_by: "name asc",
            limit_page_length: 100
          }
        }),
        apiRequest<FrappeListPayload<{ name: string; item_name?: string | null }>>({
          url: stockEndpoints.item.list,
          method: "GET",
          params: {
            fields: encodeFrappeJson(["name", "item_name"]),
            order_by: "item_name asc",
            limit_page_length: 1000
          }
        }),
        apiRequest<FrappeListPayload<{ name: string; warehouse_name?: string | null }>>({
          url: stockEndpoints.warehouse.list,
          method: "GET",
          params: {
            fields: encodeFrappeJson(["name", "warehouse_name"]),
            order_by: "warehouse_name asc",
            limit_page_length: 1000
          }
        })
      ]);

      if (!isFulfilled(itemResult) || !isFulfilled(warehouseResult)) {
        return thunkApi.rejectWithValue("Unable to fetch stock entry lookups.");
      }

      const stockEntryTypes = isFulfilled(stockEntryTypeResult)
        ? mapLookupOptions(stockEntryTypeResult.value.data ?? [], "name")
        : ERP_NEXT_STOCK_ENTRY_TYPES;

      return {
        stockEntryTypes: stockEntryTypes.length > 0 ? stockEntryTypes : ERP_NEXT_STOCK_ENTRY_TYPES,
        items: mapLookupOptions(itemResult.value.data ?? [], "name", "item_name"),
        warehouses: mapLookupOptions(warehouseResult.value.data ?? [], "name", "warehouse_name")
      };
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error, "Unable to fetch stock entry lookups.").message);
    }
  }
);

export const fetchStockEntries = createAsyncThunk<StockEntryListRow[], StockEntryFilters | void, { rejectValue: string }>(
  "stock/fetchStockEntries",
  async (filters, thunkApi) => {
    try {
      const rows = await apiRequest<FrappeStockEntryListPayload>({
        url: stockEndpoints.stockEntry.list,
        method: "GET",
        params: {
          fields: encodeFrappeJson([
            "name",
            "stock_entry_type",
            "purpose",
            "posting_date",
            "posting_time",
            "total_outgoing_value",
            "total_incoming_value",
            "modified"
          ]),
          order_by: "posting_date desc, modified desc",
          limit_page_length: 200
        }
      });

      const search = filters?.search?.trim().toLowerCase();
      const fromDate = filters?.fromDate;
      const toDate = filters?.toDate;

      return (rows.data ?? []).filter((entry) => {
        const matchesSearch = search
          ? [entry.name, entry.stock_entry_type ?? "", entry.purpose ?? "", ...(entry.itemCodes ?? [])].some((value) =>
              value.toLowerCase().includes(search)
            )
          : true;
        const matchesFrom = fromDate ? `${entry.posting_date ?? ""}` >= fromDate : true;
        const matchesTo = toDate ? `${entry.posting_date ?? ""}` <= toDate : true;
        return matchesSearch && matchesFrom && matchesTo;
      });
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error, "Unable to fetch stock entries.").message);
    }
  }
);

export const fetchStockEntryDetail = createAsyncThunk<StockEntryDocument, string, { rejectValue: { name: string; message: string } }>(
  "stock/fetchStockEntryDetail",
  async (name, thunkApi) => {
    try {
      const payload = await apiRequest<FrappeStockEntryDocumentPayload>({
        url: stockEndpoints.stockEntry.detail(name),
        method: "GET"
      });
      return payload.data;
    } catch (error) {
      return thunkApi.rejectWithValue({
        name,
        message: normalizeApiError(error, "Unable to fetch stock entry details.").message
      });
    }
  }
);

export const hydrateStockEntryItems = createAsyncThunk<
  Array<{ name: string; itemCodes: string[] }>,
  string[] | undefined,
  { rejectValue: string; state: RootState }
>(
  "stock/hydrateStockEntryItems",
  async (names, thunkApi) => {
    try {
      const state = thunkApi.getState();
      const existing = new Set(state.stock.hydratedEntries);
      const queue = (names ?? selectAllStockEntries(state).map((entry) => entry.name).slice(0, 24)).filter((name) => !existing.has(name));

      const results = await Promise.allSettled(queue.map((name) => apiRequest<FrappeStockEntryDocumentPayload>({
        url: stockEndpoints.stockEntry.detail(name),
        method: "GET"
      })));

      return results
        .map((result, index) => ({ result, name: queue[index] }))
        .filter((entry): entry is { result: PromiseFulfilledResult<FrappeStockEntryDocumentPayload>; name: string } => isFulfilled(entry.result))
        .map(({ name, result }) => ({
          name,
          itemCodes: (result.value.data.items ?? []).map((item) => item.item_code).filter(Boolean)
        }));
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error, "Unable to enrich stock entries.").message);
    }
  }
);

export const createStockEntry = createAsyncThunk<StockEntryDocument, StockEntryCreateValues, { rejectValue: string }>(
  "stock/createStockEntry",
  async (values, thunkApi) => {
    try {
      const payload = await apiRequest<FrappeStockEntryDocumentPayload>({
        url: stockEndpoints.stockEntry.list,
        method: "POST",
        data: {
          stock_entry_type: values.stock_entry_type,
          posting_date: values.posting_date,
          posting_time: values.posting_time,
          items: values.items.map((item) => ({
            item_code: item.item_code,
            qty: parseNumber(item.qty),
            s_warehouse: item.source_warehouse || undefined,
            t_warehouse: item.target_warehouse || undefined,
            basic_rate: item.basic_rate != null ? parseNumber(item.basic_rate) : undefined,
            valuation_rate: item.basic_rate != null ? parseNumber(item.basic_rate) : undefined,
            allow_zero_valuation_rate: item.allow_zero_valuation_rate ? 1 : 0
          }))
        }
      });

      return payload.data;
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error, "Unable to create stock entry.").message);
    }
  }
);

const stockSlice = createSlice({
  name: "stock",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.dashboardStatus = "loading";
        state.dashboardError = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.dashboardStatus = "succeeded";
        state.dashboardData = action.payload;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.dashboardStatus = "failed";
        state.dashboardError = action.payload ?? "Unable to fetch stock dashboard.";
      })
      .addCase(fetchStockEntryLookups.pending, (state) => {
        state.lookupsStatus = "loading";
        state.lookupsError = null;
      })
      .addCase(fetchStockEntryLookups.fulfilled, (state, action) => {
        state.lookupsStatus = "succeeded";
        state.lookups = action.payload;
      })
      .addCase(fetchStockEntryLookups.rejected, (state, action) => {
        state.lookupsStatus = "failed";
        state.lookupsError = action.payload ?? "Unable to fetch stock entry lookups.";
      })
      .addCase(fetchStockEntries.pending, (state) => {
        state.stockEntriesStatus = "loading";
        state.stockEntriesError = null;
      })
      .addCase(fetchStockEntries.fulfilled, (state, action) => {
        state.stockEntriesStatus = "succeeded";
        stockEntryAdapter.setAll(state.stockEntries, action.payload);
      })
      .addCase(fetchStockEntries.rejected, (state, action) => {
        state.stockEntriesStatus = "failed";
        state.stockEntriesError = action.payload ?? "Unable to fetch stock entries.";
      })
      .addCase(fetchStockEntryDetail.pending, (state, action) => {
        state.detailStatus[action.meta.arg] = "loading";
        state.detailError[action.meta.arg] = undefined;
      })
      .addCase(fetchStockEntryDetail.fulfilled, (state, action) => {
        state.stockEntryDetails[action.payload.name] = action.payload;
        state.detailStatus[action.payload.name] = "succeeded";
      })
      .addCase(fetchStockEntryDetail.rejected, (state, action) => {
        if (!action.payload) {
          return;
        }

        state.detailStatus[action.payload.name] = "failed";
        state.detailError[action.payload.name] = action.payload.message;
      })
      .addCase(hydrateStockEntryItems.fulfilled, (state, action) => {
        action.payload.forEach(({ name, itemCodes }) => {
          if (!state.hydratedEntries.includes(name)) {
            state.hydratedEntries.push(name);
          }

          const existing = state.stockEntries.entities[name];
          if (existing) {
            existing.itemCodes = itemCodes;
          }
        });
      })
      .addCase(createStockEntry.pending, (state) => {
        state.createStatus = "loading";
        state.createError = null;
      })
      .addCase(createStockEntry.fulfilled, (state, action) => {
        state.createStatus = "succeeded";
        stockEntryAdapter.addOne(state.stockEntries, {
          name: action.payload.name,
          stock_entry_type: action.payload.stock_entry_type,
          purpose: action.payload.purpose,
          posting_date: action.payload.posting_date,
          posting_time: action.payload.posting_time,
          total_outgoing_value: action.payload.total_outgoing_value,
          total_incoming_value: action.payload.total_incoming_value,
          modified: action.payload.modified,
          itemCodes: (action.payload.items ?? []).map((item) => item.item_code)
        });
        state.stockEntryDetails[action.payload.name] = action.payload;
      })
      .addCase(createStockEntry.rejected, (state, action) => {
        state.createStatus = "failed";
        state.createError = action.payload ?? "Unable to create stock entry.";
      });
  }
});

export const selectStockState = (state: RootState) => state.stock;
export const selectStockDashboard = (state: RootState) => state.stock.dashboardData;
export const selectStockEntryLookups = (state: RootState) => state.stock.lookups;
export const selectAllStockEntries = stockEntryAdapter.getSelectors<RootState>((state) => state.stock.stockEntries).selectAll;
export const selectStockEntryByName = (state: RootState, name: string) => state.stock.stockEntries.entities[name];
export const selectStockEntryDetail = (state: RootState, name: string) => state.stock.stockEntryDetails[name];
export const selectStockEntryDetailStatus = (state: RootState, name: string): MasterDataRequestState =>
  state.stock.detailStatus[name] ?? "idle";

export default stockSlice.reducer;
