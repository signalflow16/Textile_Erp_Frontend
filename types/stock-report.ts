import type { LookupOption } from "@/types/item";
import type { FrappeListPayload, MasterDataRequestState } from "@/types/master-data";

export type ReportSortOrder = "asc" | "desc";

export type StockReportFilters = {
  fromDate?: string;
  toDate?: string;
  itemCode?: string;
  warehouse?: string;
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: ReportSortOrder;
};

export type StockLedgerFilters = StockReportFilters & {
  voucherType?: string;
};

export type ItemShortageFilters = StockReportFilters & {
  threshold?: number;
};

export type ReportPaginationState = {
  current: number;
  pageSize: number;
  total: number;
};

export type StockBalanceRow = {
  key: string;
  itemCode: string;
  warehouse: string;
  actualQty: number;
  reservedQty: number;
  projectedQty: number;
  availableQty: number;
  stockValue: number;
};

export type StockLedgerRow = {
  key: string;
  postingDate: string;
  itemCode: string;
  warehouse: string;
  actualQty: number;
  voucherType: string;
};

export type WarehouseStockRow = {
  key: string;
  warehouse: string;
  totalItems: number;
  totalQuantity: number;
  totalStockValue: number;
};

export type WarehouseStockSummary = {
  warehouseCount: number;
  totalQuantity: number;
  totalStockValue: number;
};

export type ItemShortageRow = {
  key: string;
  itemCode: string;
  warehouse: string;
  currentQty: number;
  minimumLevel: number;
  shortageQty: number;
  thresholdSource: "manual";
};

export type StockReportLookups = {
  items: LookupOption[];
  warehouses: LookupOption[];
  voucherTypes: LookupOption[];
};

export type StockReportResourceState<T, TMeta = undefined> = {
  rows: T[];
  pagination: ReportPaginationState;
  meta?: TMeta;
};

export type StockReportState = {
  stockBalance: StockReportResourceState<StockBalanceRow>;
  stockLedger: StockReportResourceState<StockLedgerRow>;
  warehouseStock: StockReportResourceState<WarehouseStockRow, WarehouseStockSummary>;
  itemShortage: StockReportResourceState<ItemShortageRow, { thresholdSource: "manual"; threshold: number }>;
  lookups: StockReportLookups;
  lookupsStatus: MasterDataRequestState;
  lookupsError: string | null;
  loading: {
    stockBalance: boolean;
    stockLedger: boolean;
    warehouseStock: boolean;
    itemShortage: boolean;
  };
  error: {
    stockBalance: string | null;
    stockLedger: string | null;
    warehouseStock: string | null;
    itemShortage: string | null;
  };
};

export type FrappeBinRow = {
  name?: string;
  item_code?: string | null;
  warehouse?: string | null;
  actual_qty?: number | string | null;
  reserved_qty?: number | string | null;
  projected_qty?: number | string | null;
  stock_value?: number | string | null;
};

export type FrappeStockLedgerRow = {
  name?: string;
  posting_date?: string | null;
  item_code?: string | null;
  warehouse?: string | null;
  actual_qty?: number | string | null;
  voucher_type?: string | null;
};

export type StockBalancePayload = StockReportResourceState<StockBalanceRow>;
export type StockLedgerPayload = StockReportResourceState<StockLedgerRow>;
export type WarehouseStockPayload = StockReportResourceState<WarehouseStockRow, WarehouseStockSummary>;
export type ItemShortagePayload = StockReportResourceState<ItemShortageRow, { thresholdSource: "manual"; threshold: number }>;

export type FrappeBinPayload = FrappeListPayload<FrappeBinRow>;
export type FrappeStockLedgerPayload = FrappeListPayload<FrappeStockLedgerRow>;
