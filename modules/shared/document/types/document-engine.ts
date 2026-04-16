import type { EntityState } from "@reduxjs/toolkit";

import type { LookupOption } from "@/modules/stock/types/item";
import type { MasterDataRequestState } from "@/modules/stock/types/master-data";

export type DocumentStatus = 0 | 1 | 2;

export type DocumentPartyType = "supplier" | "customer";
export type DocumentPricingMode = "buying" | "selling";
export type DocumentWarehouseMode = "target" | "source";

export type DocumentListFilters = {
  search?: string;
  status?: "all" | "0" | "1" | "2";
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
};

export type DocumentPagination = {
  current: number;
  pageSize: number;
  total: number;
};

export type DocumentLineItem = {
  id: string;
  item_code?: string;
  item_name?: string | null;
  qty: number;
  uom?: string;
  conversion_factor: number;
  stock_qty: number;
  rate: number;
  amount: number;
  warehouse?: string;
  source_warehouse?: string;
  target_warehouse?: string;
  pricing_source?: string | null;
  manual_rate?: boolean;
  stock_uom?: string | null;
  warning?: string | null;
};

export type DocumentTaxLine = {
  id: string;
  charge_type?: string;
  account_head?: string;
  description?: string;
  rate?: number;
  tax_amount?: number;
};

export type RowStockValidation = {
  rowId: string;
  warehouse?: string;
  availableQty: number;
  requiredQty: number;
  shortageQty: number;
  ok: boolean;
  message?: string | null;
};

export type PricingResolution = {
  rate: number;
  currency?: string | null;
  source: "party-price" | "price-list" | "last-purchase-rate" | "item-standard-rate" | "manual" | "none";
};

export type UomConversionResult = {
  uom?: string;
  stockUom?: string | null;
  conversionFactor: number;
  warning?: string | null;
};

export type AuditTimelineRecord = {
  owner?: string | null;
  creation?: string | null;
  modified_by?: string | null;
  modified?: string | null;
  submittedAt?: string | null;
  cancelledAt?: string | null;
};

export type DocumentRecord = {
  name: string;
  party?: string | null;
  posting_date?: string | null;
  posting_time?: string | null;
  set_warehouse?: string | null;
  selling_price_list?: string | null;
  buying_price_list?: string | null;
  currency?: string | null;
  docstatus?: DocumentStatus | null;
  status?: string | null;
  workflow_state?: string | null;
  remarks?: string | null;
  items?: DocumentLineItem[];
  taxes?: DocumentTaxLine[];
  grand_total?: number | null;
  total?: number | null;
  rounded_total?: number | null;
  base_grand_total?: number | null;
  modified?: string | null;
  owner?: string | null;
  creation?: string | null;
  modified_by?: string | null;
};

export type DocumentListRow = {
  name: string;
  party?: string | null;
  posting_date?: string | null;
  posting_time?: string | null;
  docstatus?: DocumentStatus | null;
  status?: string | null;
  workflow_state?: string | null;
  grand_total?: number | null;
  currency?: string | null;
  set_warehouse?: string | null;
  modified?: string | null;
};

export type DocumentEngineConfig = {
  key: "purchaseReceipt" | "salesInvoice";
  doctype: "Purchase Receipt" | "Sales Invoice";
  routeBase: string;
  title: string;
  partyField: "supplier" | "customer";
  priceListField: "buying_price_list" | "selling_price_list";
  warehouseField: "set_warehouse";
  childTableField: "items";
  taxTableField: "taxes";
  warehouseMode: DocumentWarehouseMode;
  pricingMode: DocumentPricingMode;
  stockValidation: boolean;
};

export type DocumentCommandState = {
  listStatus: MasterDataRequestState;
  listError: string | null;
  detailStatus: Record<string, MasterDataRequestState | undefined>;
  detailError: Record<string, string | undefined>;
  saveStatus: MasterDataRequestState;
  saveError: string | null;
  submitStatus: MasterDataRequestState;
  submitError: string | null;
  cancelStatus: MasterDataRequestState;
  cancelError: string | null;
};

export type DocumentFeatureLookups = {
  parties: LookupOption[];
  items: LookupOption[];
  warehouses: LookupOption[];
  uoms: LookupOption[];
  priceLists: LookupOption[];
};

export type LookupCacheEntry = {
  status: MasterDataRequestState;
  error: string | null;
  items: LookupOption[];
  lastFetchedAt: number | null;
};

export type LookupCacheState = {
  items: LookupCacheEntry;
  warehouses: LookupCacheEntry;
  uoms: LookupCacheEntry;
  priceLists: LookupCacheEntry;
  suppliers: LookupCacheEntry;
  customers: LookupCacheEntry;
};

export type DocumentModuleState = {
  list: EntityState<DocumentListRow, string>;
  pagination: DocumentPagination;
  details: Record<string, DocumentRecord | undefined>;
  validations: Record<string, RowStockValidation[] | undefined>;
  commands: DocumentCommandState;
};

export type DocumentEngineState = {
  purchaseReceipt: DocumentModuleState;
  salesInvoice: DocumentModuleState;
};

export type DocumentEvent = {
  doctype: string;
  name: string;
  postingDate?: string | null;
  warehouses?: string[];
};
