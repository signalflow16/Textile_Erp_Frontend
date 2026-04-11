import type { EntityState } from "@reduxjs/toolkit";

import type { LookupOption } from "@/types/item";
import type { FrappeDocumentPayload, FrappeListPayload, MasterDataRequestState } from "@/types/master-data";

export type StockSummary = {
  activeItems: number;
  warehouses: number;
  totalStockValue: number;
};

export type WarehouseStockPoint = {
  warehouse: string;
  stockValue: number;
};

export type MonthlyTrendPoint = {
  month: string;
  value: number;
};

export type OldestStockItem = {
  name: string;
  itemCode: string;
  warehouse?: string | null;
  postingDate?: string | null;
  actualQty?: number;
  valuationRate?: number;
};

export type ItemShortageRow = {
  itemCode: string;
  warehouse: string;
  actualQty: number;
  shortageQty: number;
};

export type DashboardModuleStatus = "ready" | "partial";

export type StockDashboardData = {
  summary: StockSummary;
  warehouseWiseStockValue: WarehouseStockPoint[];
  purchaseReceiptTrends: MonthlyTrendPoint[];
  deliveryTrends: MonthlyTrendPoint[];
  oldestItems: OldestStockItem[];
  shortageItems: ItemShortageRow[];
  moduleStatus: {
    purchaseReceipts: DashboardModuleStatus;
    deliveryNotes: DashboardModuleStatus;
  };
};

export type StockEntryListRow = {
  name: string;
  stock_entry_type?: string | null;
  purpose?: string | null;
  posting_date?: string | null;
  posting_time?: string | null;
  total_outgoing_value?: number | null;
  total_incoming_value?: number | null;
  modified?: string | null;
  itemCodes?: string[];
};

export type StockEntryItemRow = {
  idx?: number;
  item_code: string;
  s_warehouse?: string | null;
  t_warehouse?: string | null;
  qty: number;
  basic_rate?: number | null;
  valuation_rate?: number | null;
  allow_zero_valuation_rate?: 0 | 1;
};

export type StockEntryDocument = {
  name: string;
  stock_entry_type?: string | null;
  purpose?: string | null;
  posting_date?: string | null;
  posting_time?: string | null;
  items?: StockEntryItemRow[];
  total_outgoing_value?: number | null;
  total_incoming_value?: number | null;
  modified?: string | null;
};

export type StockEntryCreateItem = {
  item_code: string;
  source_warehouse?: string;
  target_warehouse?: string;
  qty: number;
  basic_rate?: number;
  allow_zero_valuation_rate?: boolean;
};

export type StockEntryCreateValues = {
  stock_entry_type: string;
  posting_date: string;
  posting_time: string;
  items: StockEntryCreateItem[];
};

export type StockEntryLookups = {
  stockEntryTypes: LookupOption[];
  items: LookupOption[];
  warehouses: LookupOption[];
};

export type StockEntryFilters = {
  search?: string;
  fromDate?: string;
  toDate?: string;
};

export type StockState = {
  dashboardData: StockDashboardData | null;
  dashboardStatus: MasterDataRequestState;
  dashboardError: string | null;
  stockEntries: EntityState<StockEntryListRow, string>;
  stockEntriesStatus: MasterDataRequestState;
  stockEntriesError: string | null;
  stockEntryDetails: Record<string, StockEntryDocument | undefined>;
  detailStatus: Record<string, MasterDataRequestState | undefined>;
  detailError: Record<string, string | undefined>;
  createStatus: MasterDataRequestState;
  createError: string | null;
  lookups: StockEntryLookups;
  lookupsStatus: MasterDataRequestState;
  lookupsError: string | null;
  hydratedEntries: string[];
};

export type FrappeStockEntryListPayload = FrappeListPayload<StockEntryListRow>;
export type FrappeStockEntryDocumentPayload = FrappeDocumentPayload<StockEntryDocument>;
