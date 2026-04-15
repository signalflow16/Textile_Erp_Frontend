"use client";

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { apiRequest, normalizeApiError } from "@/core/api/axiosInstance";
import { masterDataEndpoints } from "@/core/api/endpoints";
import { buildPagedParams, encodeFrappeJson, fetchAllFrappePages, fetchFrappeCount, parseFrappeNumber } from "@/core/api/frappe";
import {
  buildShortageRecord,
  DEFAULT_STOCK_SHORTAGE_THRESHOLD,
  isShortage,
  resolveMinimumQuantity
} from "@/modules/stock/api/stockService";
import { invalidateStockSnapshots } from "@/core/store/stockSync";
import { stockEvents } from "@/core/store/stockEvents";
import type { RootState } from "@/store";
import type {
  FrappeBinPayload,
  FrappeBinRow,
  FrappeStockLedgerPayload,
  ItemShortageFilters,
  ItemShortagePayload,
  StockBalancePayload,
  StockLedgerFilters,
  StockLedgerPayload,
  StockReportLookups,
  StockReportState,
  WarehouseStockPayload
} from "@/modules/stock/types/stock-report";

const sortRows = <T extends Record<string, unknown>>(rows: T[], sortBy: keyof T, sortOrder: "asc" | "desc") =>
  rows.slice().sort((left, right) => {
    const leftValue = left[sortBy];
    const rightValue = right[sortBy];

    if (typeof leftValue === "number" && typeof rightValue === "number") {
      return sortOrder === "asc" ? leftValue - rightValue : rightValue - leftValue;
    }

    return sortOrder === "asc"
      ? `${leftValue ?? ""}`.localeCompare(`${rightValue ?? ""}`)
      : `${rightValue ?? ""}`.localeCompare(`${leftValue ?? ""}`);
  });

const paginateRows = <T>(rows: T[], page: number, pageSize: number) => rows.slice((page - 1) * pageSize, page * pageSize);

const buildBinFilters = ({
  itemCode,
  warehouse
}: {
  itemCode?: string;
  warehouse?: string;
}) => {
  const queryFilters: unknown[][] = [];

  if (itemCode?.trim()) {
    queryFilters.push(["item_code", "=", itemCode.trim()]);
  }

  if (warehouse?.trim()) {
    queryFilters.push(["warehouse", "=", warehouse.trim()]);
  }

  return queryFilters;
};

const buildLedgerFilters = (filters: StockLedgerFilters) => {
  const queryFilters = buildBinFilters(filters);

  if (filters.fromDate?.trim()) {
    queryFilters.push(["posting_date", ">=", filters.fromDate.trim()]);
  }

  if (filters.toDate?.trim()) {
    queryFilters.push(["posting_date", "<=", filters.toDate.trim()]);
  }

  if (filters.voucherType?.trim()) {
    queryFilters.push(["voucher_type", "=", filters.voucherType.trim()]);
  }

  return queryFilters;
};

const initialState: StockReportState = {
  stockBalance: {
    rows: [],
    pagination: {
      current: 1,
      pageSize: 20,
      total: 0
    }
  },
  stockLedger: {
    rows: [],
    pagination: {
      current: 1,
      pageSize: 20,
      total: 0
    }
  },
  warehouseStock: {
    rows: [],
    pagination: {
      current: 1,
      pageSize: 20,
      total: 0
    },
    meta: {
      warehouseCount: 0,
      totalQuantity: 0,
      totalStockValue: 0
    }
  },
  itemShortage: {
    rows: [],
    pagination: {
      current: 1,
      pageSize: 20,
      total: 0
    },
    meta: {
      thresholdSource: "manual",
      threshold: DEFAULT_STOCK_SHORTAGE_THRESHOLD
    }
  },
  lookups: {
    items: [],
    warehouses: [],
    voucherTypes: []
  },
  lookupsStatus: "idle",
  lookupsError: null,
  loading: {
    stockBalance: false,
    stockLedger: false,
    warehouseStock: false,
    itemShortage: false
  },
  error: {
    stockBalance: null,
    stockLedger: null,
    warehouseStock: null,
    itemShortage: null
  }
};

export const fetchStockReportLookups = createAsyncThunk<StockReportLookups, void, { rejectValue: string }>(
  "stockReports/fetchLookups",
  async (_arg, thunkApi) => {
    try {
      const [items, warehouses, voucherRows] = await Promise.all([
        apiRequest<{ data: Array<{ name: string; item_name?: string | null }> }>({
          url: masterDataEndpoints.item.list,
          method: "GET",
          params: {
            fields: encodeFrappeJson(["name", "item_name"]),
            order_by: "item_name asc",
            limit_page_length: 500
          }
        }),
        apiRequest<{ data: Array<{ name: string; warehouse_name?: string | null }> }>({
          url: masterDataEndpoints.warehouse.list,
          method: "GET",
          params: {
            fields: encodeFrappeJson(["name", "warehouse_name"]),
            order_by: "warehouse_name asc",
            limit_page_length: 500
          }
        }),
        apiRequest<FrappeStockLedgerPayload>({
          url: masterDataEndpoints.stock.stockLedgerEntry,
          method: "GET",
          params: {
            fields: encodeFrappeJson(["voucher_type"]),
            order_by: "modified desc",
            limit_page_length: 200
          }
        })
      ]);

      const voucherTypes = Array.from(
        new Set(
          (voucherRows.data ?? [])
            .map((row) => row.voucher_type?.trim())
            .filter((value): value is string => Boolean(value))
        )
      )
        .sort((left, right) => left.localeCompare(right))
        .map((value) => ({ label: value, value }));

      return {
        items: (items.data ?? []).map((row) => ({
          value: row.name,
          label: row.item_name?.trim() ? `${row.item_name} (${row.name})` : row.name
        })),
        warehouses: (warehouses.data ?? []).map((row) => ({
          value: row.name,
          label: row.warehouse_name?.trim() ? `${row.warehouse_name} (${row.name})` : row.name
        })),
        voucherTypes
      };
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error, "Unable to fetch stock report lookups.").message);
    }
  }
);

export const fetchStockBalance = createAsyncThunk<StockBalancePayload, { page: number; pageSize: number; itemCode?: string; warehouse?: string; sortBy?: string; sortOrder?: "asc" | "desc" }, { rejectValue: string }>(
  "stockReports/fetchStockBalance",
  async (filters, thunkApi) => {
    try {
      const queryFilters = buildBinFilters(filters);
      const [total, response] = await Promise.all([
        fetchFrappeCount({
          url: masterDataEndpoints.stock.bin,
          filters: queryFilters
        }),
        apiRequest<FrappeBinPayload>({
          url: masterDataEndpoints.stock.bin,
          method: "GET",
          params: buildPagedParams({
            fields: ["name", "item_code", "warehouse", "actual_qty", "reserved_qty", "projected_qty", "stock_value"],
            filters: queryFilters,
            orderBy: `${filters.sortBy ?? "item_code"} ${filters.sortOrder ?? "asc"}`,
            page: filters.page,
            pageSize: filters.pageSize
          })
        })
      ]);

      const rows = (response.data ?? []).map((row) => {
        const actualQty = parseFrappeNumber(row.actual_qty);
        const reservedQty = parseFrappeNumber(row.reserved_qty);

        return {
          key: row.name ?? `${row.item_code ?? "item"}-${row.warehouse ?? "warehouse"}`,
          itemCode: row.item_code ?? "Unknown Item",
          warehouse: row.warehouse ?? "Unknown Warehouse",
          actualQty,
          reservedQty,
          projectedQty: parseFrappeNumber(row.projected_qty),
          availableQty: actualQty - reservedQty,
          stockValue: parseFrappeNumber(row.stock_value)
        };
      });

      return {
        rows,
        pagination: {
          current: filters.page,
          pageSize: filters.pageSize,
          total
        }
      };
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error, "Unable to fetch stock balance.").message);
    }
  }
);

export const fetchStockLedger = createAsyncThunk<StockLedgerPayload, StockLedgerFilters, { rejectValue: string }>(
  "stockReports/fetchStockLedger",
  async (filters, thunkApi) => {
    try {
      const queryFilters = buildLedgerFilters(filters);
      const [total, response] = await Promise.all([
        fetchFrappeCount({
          url: masterDataEndpoints.stock.stockLedgerEntry,
          filters: queryFilters
        }),
        apiRequest<FrappeStockLedgerPayload>({
          url: masterDataEndpoints.stock.stockLedgerEntry,
          method: "GET",
          params: buildPagedParams({
            fields: ["name", "posting_date", "item_code", "warehouse", "actual_qty", "voucher_type"],
            filters: queryFilters,
            orderBy: `${filters.sortBy ?? "posting_date"} ${filters.sortOrder ?? "desc"}`,
            page: filters.page,
            pageSize: filters.pageSize
          })
        })
      ]);

      const rows = (response.data ?? []).map((row) => ({
        key: row.name ?? `${row.posting_date ?? "date"}-${row.item_code ?? "item"}-${row.warehouse ?? "warehouse"}`,
        postingDate: row.posting_date ?? "",
        itemCode: row.item_code ?? "Unknown Item",
        warehouse: row.warehouse ?? "Unknown Warehouse",
        actualQty: parseFrappeNumber(row.actual_qty),
        voucherType: row.voucher_type ?? "Unknown"
      }));

      return {
        rows,
        pagination: {
          current: filters.page,
          pageSize: filters.pageSize,
          total
        }
      };
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error, "Unable to fetch stock ledger.").message);
    }
  }
);

export const fetchWarehouseStock = createAsyncThunk<WarehouseStockPayload, { page: number; pageSize: number; itemCode?: string; warehouse?: string; sortBy?: string; sortOrder?: "asc" | "desc" }, { rejectValue: string }>(
  "stockReports/fetchWarehouseStock",
  async (filters, thunkApi) => {
    try {
      const queryFilters = buildBinFilters(filters);
      const rows = await fetchAllFrappePages<FrappeBinRow>({
        url: masterDataEndpoints.stock.bin,
        fields: ["name", "item_code", "warehouse", "actual_qty", "stock_value"],
        filters: queryFilters,
        orderBy: "warehouse asc, item_code asc"
      });

      const warehouseMap = new Map<string, { items: Set<string>; totalQuantity: number; totalStockValue: number }>();

      rows.forEach((row) => {
        const warehouse = row.warehouse ?? "Unknown Warehouse";
        const entry = warehouseMap.get(warehouse) ?? {
          items: new Set<string>(),
          totalQuantity: 0,
          totalStockValue: 0
        };

        if (row.item_code) {
          entry.items.add(row.item_code);
        }

        entry.totalQuantity += parseFrappeNumber(row.actual_qty);
        entry.totalStockValue += parseFrappeNumber(row.stock_value);
        warehouseMap.set(warehouse, entry);
      });

      const aggregated = Array.from(warehouseMap.entries()).map(([warehouse, value]) => ({
        key: warehouse,
        warehouse,
        totalItems: value.items.size,
        totalQuantity: value.totalQuantity,
        totalStockValue: value.totalStockValue
      }));

      const sorted = sortRows(
        aggregated,
        (filters.sortBy as keyof (typeof aggregated)[number]) ?? "warehouse",
        filters.sortOrder ?? "asc"
      );

      return {
        rows: paginateRows(sorted, filters.page, filters.pageSize),
        pagination: {
          current: filters.page,
          pageSize: filters.pageSize,
          total: sorted.length
        },
        meta: {
          warehouseCount: sorted.length,
          totalQuantity: sorted.reduce((sum, row) => sum + row.totalQuantity, 0),
          totalStockValue: sorted.reduce((sum, row) => sum + row.totalStockValue, 0)
        }
      };
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error, "Unable to fetch warehouse stock.").message);
    }
  }
);

export const fetchItemShortage = createAsyncThunk<ItemShortagePayload, ItemShortageFilters, { rejectValue: string }>(
  "stockReports/fetchItemShortage",
  async (filters, thunkApi) => {
    try {
      const fallbackThreshold = Number.isFinite(filters.threshold) ? Number(filters.threshold) : DEFAULT_STOCK_SHORTAGE_THRESHOLD;
      const queryFilters = buildBinFilters(filters);
      const rows = await fetchAllFrappePages<FrappeBinRow>({
        url: masterDataEndpoints.stock.bin,
        fields: ["name", "item_code", "warehouse", "actual_qty"],
        filters: queryFilters,
        orderBy: "actual_qty asc"
      });

      const shortageRows = rows
        .filter((row) => typeof row.item_code === "string" && typeof row.warehouse === "string")
        .map((row) => {
          const currentQty = parseFrappeNumber(row.actual_qty);
          const minimumLevel = resolveMinimumQuantity(undefined, fallbackThreshold);
          const shortage = buildShortageRecord({
            itemCode: row.item_code ?? "Unknown Item",
            warehouse: row.warehouse ?? "Unknown Warehouse",
            actualQty: currentQty,
            minimumQty: minimumLevel
          });

          return {
            key: row.name ?? `${row.item_code ?? "item"}-${row.warehouse ?? "warehouse"}`,
            itemCode: shortage.itemCode,
            warehouse: shortage.warehouse,
            currentQty,
            minimumLevel,
            shortageQty: shortage.shortageQty,
            thresholdSource: "manual" as const,
            isShortage: isShortage(currentQty, minimumLevel)
          };
        })
        .filter((row) => row.isShortage)
        .map(({ isShortage: _isShortage, ...row }) => row);

      const sorted = shortageRows.sort((left, right) => right.shortageQty - left.shortageQty);

      return {
        rows: paginateRows(sorted, filters.page, filters.pageSize),
        pagination: {
          current: filters.page,
          pageSize: filters.pageSize,
          total: sorted.length
        },
        meta: {
          thresholdSource: "manual" as const,
          threshold: fallbackThreshold
        }
      };
    } catch (error) {
      return thunkApi.rejectWithValue(normalizeApiError(error, "Unable to fetch item shortage.").message);
    }
  }
);

const stockReportSlice = createSlice({
  name: "stockReports",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStockReportLookups.pending, (state) => {
        state.lookupsStatus = "loading";
        state.lookupsError = null;
      })
      .addCase(fetchStockReportLookups.fulfilled, (state, action) => {
        state.lookupsStatus = "succeeded";
        state.lookups = action.payload;
      })
      .addCase(fetchStockReportLookups.rejected, (state, action) => {
        state.lookupsStatus = "failed";
        state.lookupsError = action.payload ?? "Unable to fetch stock report lookups.";
      })
      .addCase(fetchStockBalance.pending, (state) => {
        state.loading.stockBalance = true;
        state.error.stockBalance = null;
      })
      .addCase(fetchStockBalance.fulfilled, (state, action) => {
        state.loading.stockBalance = false;
        state.stockBalance = action.payload;
      })
      .addCase(fetchStockBalance.rejected, (state, action) => {
        state.loading.stockBalance = false;
        state.error.stockBalance = action.payload ?? "Unable to fetch stock balance.";
      })
      .addCase(fetchStockLedger.pending, (state) => {
        state.loading.stockLedger = true;
        state.error.stockLedger = null;
      })
      .addCase(fetchStockLedger.fulfilled, (state, action) => {
        state.loading.stockLedger = false;
        state.stockLedger = action.payload;
      })
      .addCase(fetchStockLedger.rejected, (state, action) => {
        state.loading.stockLedger = false;
        state.error.stockLedger = action.payload ?? "Unable to fetch stock ledger.";
      })
      .addCase(fetchWarehouseStock.pending, (state) => {
        state.loading.warehouseStock = true;
        state.error.warehouseStock = null;
      })
      .addCase(fetchWarehouseStock.fulfilled, (state, action) => {
        state.loading.warehouseStock = false;
        state.warehouseStock = action.payload;
      })
      .addCase(fetchWarehouseStock.rejected, (state, action) => {
        state.loading.warehouseStock = false;
        state.error.warehouseStock = action.payload ?? "Unable to fetch warehouse stock.";
      })
      .addCase(fetchItemShortage.pending, (state) => {
        state.loading.itemShortage = true;
        state.error.itemShortage = null;
      })
      .addCase(fetchItemShortage.fulfilled, (state, action) => {
        state.loading.itemShortage = false;
        state.itemShortage = action.payload;
      })
      .addCase(fetchItemShortage.rejected, (state, action) => {
        state.loading.itemShortage = false;
        state.error.itemShortage = action.payload ?? "Unable to fetch item shortage.";
      })
      .addCase(invalidateStockSnapshots, (state) => {
        state.loading.stockBalance = false;
        state.loading.stockLedger = false;
        state.loading.warehouseStock = false;
        state.loading.itemShortage = false;
      })
      .addCase(stockEvents.documentSubmitted, (state) => {
        state.loading.stockBalance = false;
        state.loading.stockLedger = false;
        state.loading.warehouseStock = false;
        state.loading.itemShortage = false;
      })
      .addCase(stockEvents.documentCancelled, (state) => {
        state.loading.stockBalance = false;
        state.loading.stockLedger = false;
        state.loading.warehouseStock = false;
        state.loading.itemShortage = false;
      });
  }
});

export const selectStockReportsState = (state: RootState) => state.stockReports;
export const selectStockReportLookups = (state: RootState) => state.stockReports.lookups;

export default stockReportSlice.reducer;
