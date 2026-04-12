"use client";

import { createAsyncThunk, createEntityAdapter, createSlice } from "@reduxjs/toolkit";

import { apiRequest, normalizeApiError } from "@/services/axiosInstance";
import { masterDataEndpoints } from "@/services/endpoints";
import { buildPagedParams, encodeFrappeJson, fetchAllFrappePages, fetchFrappeCount, parseFrappeNumber } from "@/services/frappe";
import {
  buildShortageRecord,
  DEFAULT_STOCK_SHORTAGE_THRESHOLD,
  isShortage,
  resolveMinimumQuantity
} from "@/services/stockLogic";
import { invalidateStockSnapshots } from "@/store/actions/stockSync";
import type { RootState } from "@/store";
import type { FrappeListPayload, MasterDataRequestState } from "@/types/master-data";
import type { LookupOption } from "@/types/item";
import type {
  FrappeSubmitDocumentPayload,
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
  StockValueTrendPoint,
  StockSummary,
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
  hydratedEntries: [],
  stockEntriesPagination: {
    current: 1,
    pageSize: 20,
    total: 0
  },
  stockDataVersion: 0
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
    const amount = amountKeys.reduce((sum, key) => sum + parseFrappeNumber(row[key]), 0);
    totals.set(month, (totals.get(month) ?? 0) + amount);
  });

  return Array.from(totals.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([month, value]) => ({ month, value }));
};

const aggregateDailyStockValueTrend = (
  rows: Array<{
    posting_date?: string | null;
    stock_value_difference?: number | string | null;
    actual_qty?: number | string | null;
    valuation_rate?: number | string | null;
  }>
): StockValueTrendPoint[] => {
  const dailyDeltas = new Map<string, number>();

  rows.forEach((row) => {
    const postingDate = row.posting_date?.trim();
    if (!postingDate) {
      return;
    }

    const delta =
      parseFrappeNumber(row.stock_value_difference) ||
      parseFrappeNumber(row.actual_qty) * parseFrappeNumber(row.valuation_rate);

    dailyDeltas.set(postingDate, (dailyDeltas.get(postingDate) ?? 0) + delta);
  });

  let runningValue = 0;

  return Array.from(dailyDeltas.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, dailyValue]) => {
      runningValue += dailyValue;

      return {
        date,
        value: runningValue
      };
    });
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

const buildStockEntryFilters = (filters?: StockEntryFilters) => {
  const queryFilters: unknown[][] = [];
  const orFilters: unknown[][] = [];

  if (filters?.fromDate?.trim()) {
    queryFilters.push(["posting_date", ">=", filters.fromDate.trim()]);
  }

  if (filters?.toDate?.trim()) {
    queryFilters.push(["posting_date", "<=", filters.toDate.trim()]);
  }

  if (filters?.search?.trim()) {
    const token = `%${filters.search.trim()}%`;
    orFilters.push(["name", "like", token]);
    orFilters.push(["stock_entry_type", "like", token]);
    orFilters.push(["purpose", "like", token]);
  }

  return { queryFilters, orFilters };
};

const createDashboardData = (args: {
  activeItemsCount: number;
  warehousesCount: number;
  bins: Array<{
    warehouse?: string | null;
    stock_value?: number | string | null;
    actual_qty?: number | string | null;
    item_code?: string | null;
  }>;
  ledger: Array<{
    name: string;
    item_code?: string | null;
    warehouse?: string | null;
    posting_date?: string | null;
    actual_qty?: number | string | null;
    valuation_rate?: number | string | null;
    stock_value_difference?: number | string | null;
  }>;
  purchaseReceipts: Array<{ posting_date?: string | null; grand_total?: number | string | null; base_grand_total?: number | string | null }>;
  deliveryNotes: Array<{ posting_date?: string | null; grand_total?: number | string | null; base_grand_total?: number | string | null }>;
  purchaseReceiptsReady: DashboardModuleStatus;
  deliveryNotesReady: DashboardModuleStatus;
}): StockDashboardData => {
  const summary: StockSummary = {
    activeItems: args.activeItemsCount,
    warehouses: args.warehousesCount,
    totalStockValue: args.bins.reduce((sum, bin) => sum + parseFrappeNumber(bin.stock_value), 0)
  };

  const warehouseStockTrend = aggregateDailyStockValueTrend(args.ledger);

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
      actualQty: parseFrappeNumber(entry.actual_qty),
      valuationRate: parseFrappeNumber(entry.valuation_rate)
    }));

  const shortageItems: ItemShortageRow[] = args.bins
    .filter((bin) => typeof bin.item_code === "string" && typeof bin.warehouse === "string")
    .map((bin) => {
      const actualQty = parseFrappeNumber(bin.actual_qty);
      const minimumQty = resolveMinimumQuantity(undefined, DEFAULT_STOCK_SHORTAGE_THRESHOLD);
      return {
        actualQty,
        minimumQty,
        row: buildShortageRecord({
          itemCode: bin.item_code as string,
          warehouse: bin.warehouse as string,
          actualQty,
          minimumQty
        })
      };
    })
    .filter((entry) => isShortage(entry.actualQty, entry.minimumQty))
    .sort((left, right) => left.row.shortageQty - right.row.shortageQty)
    .slice(0, 8)
    .map((entry) => entry.row);

  return {
    summary,
    warehouseStockTrend,
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
      const activeItemFilters: unknown[][] = [["disabled", "=", 0]];
      const [activeItemsCount, warehousesCount, bins, ledger, purchaseReceiptResult, deliveryNoteResult] = await Promise.all([
        fetchFrappeCount({
          url: masterDataEndpoints.item.list,
          filters: activeItemFilters
        }),
        fetchFrappeCount({
          url: masterDataEndpoints.warehouse.list
        }),
        fetchAllFrappePages<{
          warehouse?: string | null;
          stock_value?: number | string | null;
          actual_qty?: number | string | null;
          item_code?: string | null;
        }>({
          url: masterDataEndpoints.stock.bin,
          fields: ["warehouse", "stock_value", "actual_qty", "item_code"],
          orderBy: "warehouse asc, item_code asc"
        }),
        fetchAllFrappePages<{
          name: string;
          item_code?: string | null;
          warehouse?: string | null;
          posting_date?: string | null;
          actual_qty?: number | string | null;
          valuation_rate?: number | string | null;
          stock_value_difference?: number | string | null;
        }>({
          url: masterDataEndpoints.stock.stockLedgerEntry,
          fields: ["name", "item_code", "warehouse", "posting_date", "actual_qty", "valuation_rate", "stock_value_difference"],
          orderBy: "posting_date asc, creation asc"
        }),
        apiRequest<FrappeListPayload<{ posting_date?: string | null; grand_total?: number | string | null; base_grand_total?: number | string | null }>>({
          url: masterDataEndpoints.stock.purchaseReceipt,
          method: "GET",
          params: {
            fields: encodeFrappeJson(["posting_date", "grand_total", "base_grand_total"]),
            order_by: "posting_date asc",
            limit_page_length: 500
          }
        }).catch(() => ({ data: [] })),
        apiRequest<FrappeListPayload<{ posting_date?: string | null; grand_total?: number | string | null; base_grand_total?: number | string | null }>>({
          url: masterDataEndpoints.stock.deliveryNote,
          method: "GET",
          params: {
            fields: encodeFrappeJson(["posting_date", "grand_total", "base_grand_total"]),
            order_by: "posting_date asc",
            limit_page_length: 500
          }
        }).catch(() => ({ data: [] }))
      ]);

      return createDashboardData({
        activeItemsCount,
        warehousesCount,
        bins,
        ledger,
        purchaseReceipts: purchaseReceiptResult.data ?? [],
        deliveryNotes: deliveryNoteResult.data ?? [],
        purchaseReceiptsReady: "ready",
        deliveryNotesReady: "ready"
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
          url: masterDataEndpoints.stock.stockEntryType,
          method: "GET",
          params: {
            fields: encodeFrappeJson(["name"]),
            order_by: "name asc",
            limit_page_length: 100
          }
        }),
        fetchAllFrappePages<{ name: string; item_name?: string | null }>({
          url: masterDataEndpoints.item.list,
          fields: ["name", "item_name"],
          orderBy: "item_name asc"
        }),
        fetchAllFrappePages<{ name: string; warehouse_name?: string | null }>({
          url: masterDataEndpoints.warehouse.list,
          fields: ["name", "warehouse_name"],
          filters: [["is_group", "=", 0]],
          orderBy: "warehouse_name asc"
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
        items: mapLookupOptions(itemResult.value ?? [], "name", "item_name"),
        warehouses: mapLookupOptions(warehouseResult.value ?? [], "name", "warehouse_name")
      };
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error, "Unable to fetch stock entry lookups.").message);
    }
  }
);

export const fetchStockEntries = createAsyncThunk<
  { rows: StockEntryListRow[]; total: number; page: number; pageSize: number },
  StockEntryFilters | void,
  { rejectValue: string }
>(
  "stock/fetchStockEntries",
  async (filters, thunkApi) => {
    try {
      const page = filters?.page ?? 1;
      const pageSize = filters?.pageSize ?? 20;
      const { queryFilters, orFilters } = buildStockEntryFilters(filters ?? undefined);
      const [total, rows] = await Promise.all([
        fetchFrappeCount({
          url: masterDataEndpoints.stock.stockEntry,
          filters: queryFilters,
          orFilters: orFilters.length ? orFilters : undefined
        }),
        apiRequest<FrappeStockEntryListPayload>({
          url: masterDataEndpoints.stock.stockEntry,
          method: "GET",
          params: buildPagedParams({
            fields: [
              "name",
              "stock_entry_type",
            "purpose",
            "posting_date",
            "posting_time",
            "docstatus",
            "total_outgoing_value",
            "total_incoming_value",
            "modified"
            ],
            filters: queryFilters,
            orFilters,
            orderBy: "posting_date desc, modified desc",
            page,
            pageSize
          })
        })
      ]);

      return {
        rows: rows.data ?? [],
        total,
        page,
        pageSize
      };
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
        url: `${masterDataEndpoints.stock.stockEntry}/${encodeURIComponent(name)}`,
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

      const results = await Promise.allSettled(
        queue.map((name) =>
          apiRequest<FrappeStockEntryDocumentPayload>({
            url: `${masterDataEndpoints.stock.stockEntry}/${encodeURIComponent(name)}`,
            method: "GET"
          })
        )
      );

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
      const created = await apiRequest<FrappeStockEntryDocumentPayload>({
        url: masterDataEndpoints.stock.stockEntry,
        method: "POST",
        data: {
          stock_entry_type: values.stock_entry_type,
          posting_date: values.posting_date,
          posting_time: values.posting_time,
          items: values.items.map((item) => ({
            item_code: item.item_code,
            qty: parseFrappeNumber(item.qty),
            s_warehouse: item.source_warehouse || undefined,
            t_warehouse: item.target_warehouse || undefined,
            basic_rate: item.basic_rate != null ? parseFrappeNumber(item.basic_rate) : undefined,
            valuation_rate: item.basic_rate != null ? parseFrappeNumber(item.basic_rate) : undefined,
            allow_zero_valuation_rate: item.allow_zero_valuation_rate ? 1 : 0
          }))
        }
      });

      const submitWithPayload = async (doc: unknown) =>
        apiRequest<FrappeSubmitDocumentPayload>({
          url: "/method/frappe.client.submit",
          method: "POST",
          data: { doc }
        });

      const fetchCurrentDocument = async () =>
        apiRequest<FrappeStockEntryDocumentPayload>({
          url: `${masterDataEndpoints.stock.stockEntry}/${encodeURIComponent(created.data.name)}`,
          method: "GET"
        });

      let submitted: FrappeSubmitDocumentPayload | null = null;

      try {
        submitted = await submitWithPayload(created.data);
      } catch (firstSubmitError) {
        const current = await fetchCurrentDocument().catch(() => null);
        if (current?.data?.docstatus === 1) {
          thunkApi.dispatch(invalidateStockSnapshots());
          return current.data;
        }

        try {
          submitted = await submitWithPayload(JSON.stringify(created.data));
        } catch (secondSubmitError) {
          const afterRetry = await fetchCurrentDocument().catch(() => null);
          if (afterRetry?.data?.docstatus === 1) {
            thunkApi.dispatch(invalidateStockSnapshots());
            return afterRetry.data;
          }

          return thunkApi.rejectWithValue(
            normalizeApiError(secondSubmitError, "Unable to submit stock entry.").message
          );
        }
      }

      thunkApi.dispatch(invalidateStockSnapshots());
      return submitted.message;
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error, "Unable to create and submit stock entry.").message);
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
        state.stockEntriesPagination = {
          current: action.payload.page,
          pageSize: action.payload.pageSize,
          total: action.payload.total
        };
        stockEntryAdapter.setAll(state.stockEntries, action.payload.rows);
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
          docstatus: action.payload.docstatus,
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
      })
      .addCase(invalidateStockSnapshots, (state) => {
        state.stockDataVersion += 1;
        state.dashboardStatus = "idle";
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
