import { nanoid } from "@reduxjs/toolkit";

import { apiRequest } from "@/core/api/axiosInstance";
import { masterDataEndpoints } from "@/core/api/endpoints";
import { encodeFrappeJson, fetchFrappeCount, parseFrappeNumber } from "@/core/api/frappe";
import type {
  DocumentEngineConfig,
  DocumentLineItem,
  DocumentListFilters,
  DocumentListRow,
  DocumentRecord,
  DocumentTaxLine,
  PricingResolution,
  RowStockValidation,
  UomConversionResult
} from "@/modules/shared/document/types/document-engine";
import type { FrappeDocumentPayload, FrappeListPayload } from "@/modules/stock/types/master-data";

type FrappeItemRow = {
  name?: string;
  item_code?: string;
  item_name?: string | null;
  qty?: number | string | null;
  uom?: string | null;
  conversion_factor?: number | string | null;
  stock_qty?: number | string | null;
  rate?: number | string | null;
  amount?: number | string | null;
  warehouse?: string | null;
  target_warehouse?: string | null;
  source_warehouse?: string | null;
};

type FrappeTaxRow = {
  name?: string;
  charge_type?: string;
  account_head?: string;
  description?: string;
  rate?: number | string | null;
  tax_amount?: number | string | null;
};

const DOCUMENT_ENDPOINTS: Record<DocumentEngineConfig["key"], string> = {
  purchaseReceipt: masterDataEndpoints.stock.purchaseReceipt,
  salesInvoice: masterDataEndpoints.stock.salesInvoice
};

const PARTY_LABEL_FIELDS: Record<DocumentEngineConfig["partyField"], string> = {
  supplier: "supplier_name",
  customer: "customer_name"
};

export const documentConfigs: Record<DocumentEngineConfig["key"], DocumentEngineConfig> = {
  purchaseReceipt: {
    key: "purchaseReceipt",
    doctype: "Purchase Receipt",
    routeBase: "/buying/purchase-receipts",
    title: "Purchase Receipt",
    partyField: "supplier",
    priceListField: "buying_price_list",
    warehouseField: "set_warehouse",
    childTableField: "items",
    taxTableField: "taxes",
    warehouseMode: "target",
    pricingMode: "buying",
    stockValidation: false
  },
  salesInvoice: {
    key: "salesInvoice",
    doctype: "Sales Invoice",
    routeBase: "/selling/sales-invoices",
    title: "Sales Invoice",
    partyField: "customer",
    priceListField: "selling_price_list",
    warehouseField: "set_warehouse",
    childTableField: "items",
    taxTableField: "taxes",
    warehouseMode: "source",
    pricingMode: "selling",
    stockValidation: true
  }
};

export const createDocumentLine = (): DocumentLineItem => ({
  id: nanoid(),
  qty: 1,
  conversion_factor: 1,
  stock_qty: 1,
  rate: 0,
  amount: 0,
  manual_rate: false
});

export const createDocumentTaxLine = (): DocumentTaxLine => ({
  id: nanoid(),
  rate: 0,
  tax_amount: 0
});

export const getDocumentEndpoint = (config: DocumentEngineConfig) => DOCUMENT_ENDPOINTS[config.key];

export const buildDocumentFilters = (config: DocumentEngineConfig, filters?: DocumentListFilters) => {
  const queryFilters: unknown[][] = [];
  const orFilters: unknown[][] = [];

  if (filters?.fromDate?.trim()) {
    queryFilters.push(["posting_date", ">=", filters.fromDate.trim()]);
  }

  if (filters?.toDate?.trim()) {
    queryFilters.push(["posting_date", "<=", filters.toDate.trim()]);
  }

  if (filters?.status && filters.status !== "all") {
    queryFilters.push(["docstatus", "=", Number(filters.status)]);
  }

  if (filters?.search?.trim()) {
    const token = `%${filters.search.trim()}%`;
    orFilters.push(["name", "like", token]);
    orFilters.push([config.partyField, "like", token]);
  }

  return { queryFilters, orFilters };
};

export const getDocumentListFields = (config: DocumentEngineConfig) => [
  "name",
  config.partyField,
  "posting_date",
  "posting_time",
  config.warehouseField,
  config.priceListField,
  "status",
  "workflow_state",
  "docstatus",
  "grand_total",
  "rounded_total",
  "base_grand_total",
  "currency",
  "modified"
];

export const toDocumentLineItem = (row: FrappeItemRow): DocumentLineItem => {
  const qty = parseFrappeNumber(row.qty);
  const conversionFactor = parseFrappeNumber(row.conversion_factor) || 1;
  const rate = parseFrappeNumber(row.rate);

  return {
    id: row.name || nanoid(),
    item_code: row.item_code,
    item_name: row.item_name,
    qty,
    uom: row.uom || undefined,
    conversion_factor: conversionFactor,
    stock_qty: parseFrappeNumber(row.stock_qty) || qty * conversionFactor,
    rate,
    amount: parseFrappeNumber(row.amount) || qty * rate,
    warehouse: row.warehouse || undefined,
    source_warehouse: row.source_warehouse || undefined,
    target_warehouse: row.target_warehouse || undefined,
    manual_rate: true
  };
};

const toDocumentTaxLine = (row: FrappeTaxRow): DocumentTaxLine => ({
  id: row.name || nanoid(),
  charge_type: row.charge_type || undefined,
  account_head: row.account_head || undefined,
  description: row.description || undefined,
  rate: parseFrappeNumber(row.rate),
  tax_amount: parseFrappeNumber(row.tax_amount)
});

export const toDocumentRecord = (config: DocumentEngineConfig, data: Record<string, unknown>): DocumentRecord => ({
  name: String(data.name ?? ""),
  party: typeof data[config.partyField] === "string" ? (data[config.partyField] as string) : null,
  posting_date: typeof data.posting_date === "string" ? data.posting_date : null,
  posting_time: typeof data.posting_time === "string" ? data.posting_time : null,
  set_warehouse: typeof data[config.warehouseField] === "string" ? (data[config.warehouseField] as string) : null,
  buying_price_list: typeof data.buying_price_list === "string" ? data.buying_price_list : null,
  selling_price_list: typeof data.selling_price_list === "string" ? data.selling_price_list : null,
  currency: typeof data.currency === "string" ? data.currency : null,
  docstatus: typeof data.docstatus === "number" ? (data.docstatus as 0 | 1 | 2) : 0,
  status: typeof data.status === "string" ? data.status : null,
  workflow_state: typeof data.workflow_state === "string" ? data.workflow_state : null,
  remarks: typeof data.remarks === "string" ? data.remarks : null,
  items: Array.isArray(data.items) ? (data.items as FrappeItemRow[]).map(toDocumentLineItem) : [],
  taxes: Array.isArray(data.taxes) ? (data.taxes as FrappeTaxRow[]).map(toDocumentTaxLine) : [],
  grand_total: parseFrappeNumber(data.grand_total),
  total: parseFrappeNumber(data.total),
  rounded_total: parseFrappeNumber(data.rounded_total),
  base_grand_total: parseFrappeNumber(data.base_grand_total),
  modified: typeof data.modified === "string" ? data.modified : null,
  owner: typeof data.owner === "string" ? data.owner : null,
  creation: typeof data.creation === "string" ? data.creation : null,
  modified_by: typeof data.modified_by === "string" ? data.modified_by : null
});

export const computeDocumentTotals = (items: DocumentLineItem[], taxes: DocumentTaxLine[]) => {
  const total = items.reduce((sum, row) => sum + parseFrappeNumber(row.amount), 0);
  const taxTotal = taxes.reduce((sum, row) => sum + parseFrappeNumber(row.tax_amount), 0);
  return {
    total,
    taxTotal,
    grandTotal: total + taxTotal
  };
};

export const normalizeDocumentLine = (line: DocumentLineItem): DocumentLineItem => {
  const qty = parseFrappeNumber(line.qty) || 0;
  const conversionFactor = parseFrappeNumber(line.conversion_factor) || 1;
  const rate = parseFrappeNumber(line.rate) || 0;
  return {
    ...line,
    qty,
    conversion_factor: conversionFactor,
    stock_qty: qty * conversionFactor,
    rate,
    amount: qty * rate
  };
};

export const serializeDocumentPayload = (config: DocumentEngineConfig, document: Partial<DocumentRecord>) => ({
  [config.partyField]: document.party || undefined,
  posting_date: document.posting_date || undefined,
  posting_time: document.posting_time || undefined,
  [config.warehouseField]: document.set_warehouse || undefined,
  [config.priceListField]:
    config.priceListField === "buying_price_list" ? document.buying_price_list || undefined : document.selling_price_list || undefined,
  remarks: document.remarks || undefined,
  items: (document.items ?? [])
    .filter((row) => row.item_code)
    .map((row) => ({
      item_code: row.item_code,
      qty: parseFrappeNumber(row.qty),
      uom: row.uom || undefined,
      conversion_factor: parseFrappeNumber(row.conversion_factor) || 1,
      stock_qty: parseFrappeNumber(row.stock_qty) || parseFrappeNumber(row.qty),
      rate: parseFrappeNumber(row.rate),
      amount: parseFrappeNumber(row.amount),
      warehouse: row.warehouse || undefined,
      source_warehouse: row.source_warehouse || undefined,
      target_warehouse: row.target_warehouse || undefined
    })),
  taxes: (document.taxes ?? [])
    .filter((row) => row.account_head || row.description)
    .map((row) => ({
      charge_type: row.charge_type || undefined,
      account_head: row.account_head || undefined,
      description: row.description || undefined,
      rate: parseFrappeNumber(row.rate),
      tax_amount: parseFrappeNumber(row.tax_amount)
    }))
});

export const fetchDocumentListApi = async (config: DocumentEngineConfig, filters?: DocumentListFilters) => {
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 20;
  const { queryFilters, orFilters } = buildDocumentFilters(config, filters);
  const endpoint = getDocumentEndpoint(config);
  const [total, response] = await Promise.all([
    fetchFrappeCount({
      url: endpoint,
      filters: queryFilters,
      orFilters: orFilters.length ? orFilters : undefined
    }),
    apiRequest<FrappeListPayload<Record<string, unknown>>>({
      url: endpoint,
      method: "GET",
      params: {
        fields: encodeFrappeJson(getDocumentListFields(config)),
        ...(queryFilters.length ? { filters: encodeFrappeJson(queryFilters) } : {}),
        ...(orFilters.length ? { or_filters: encodeFrappeJson(orFilters) } : {}),
        order_by: "posting_date desc, modified desc",
        limit_start: (page - 1) * pageSize,
        limit_page_length: pageSize
      }
    })
  ]);

  return {
    rows: (response.data ?? []).map((row) => ({
      name: String(row.name ?? ""),
      party: typeof row[config.partyField] === "string" ? (row[config.partyField] as string) : null,
      posting_date: typeof row.posting_date === "string" ? row.posting_date : null,
      posting_time: typeof row.posting_time === "string" ? row.posting_time : null,
      docstatus: typeof row.docstatus === "number" ? (row.docstatus as 0 | 1 | 2) : 0,
      status: typeof row.status === "string" ? row.status : null,
      workflow_state: typeof row.workflow_state === "string" ? row.workflow_state : null,
      grand_total: parseFrappeNumber(row.grand_total ?? row.rounded_total ?? row.base_grand_total),
      currency: typeof row.currency === "string" ? row.currency : null,
      set_warehouse: typeof row[config.warehouseField] === "string" ? (row[config.warehouseField] as string) : null,
      modified: typeof row.modified === "string" ? row.modified : null
    })) as DocumentListRow[],
    total,
    page,
    pageSize
  };
};

export const fetchDocumentDetailApi = async (config: DocumentEngineConfig, name: string) => {
  const payload = await apiRequest<FrappeDocumentPayload<Record<string, unknown>>>({
    url: `${getDocumentEndpoint(config)}/${encodeURIComponent(name)}`,
    method: "GET"
  });
  return toDocumentRecord(config, payload.data);
};

export const saveDocumentDraftApi = async (config: DocumentEngineConfig, document: Partial<DocumentRecord>) => {
  const endpoint = getDocumentEndpoint(config);
  const payload = serializeDocumentPayload(config, document);
  const response = document.name
    ? await apiRequest<FrappeDocumentPayload<Record<string, unknown>>>({
        url: `${endpoint}/${encodeURIComponent(document.name)}`,
        method: "PUT",
        data: payload
      })
    : await apiRequest<FrappeDocumentPayload<Record<string, unknown>>>({
        url: endpoint,
        method: "POST",
        data: payload
      });

  return toDocumentRecord(config, response.data);
};

export const submitDocumentApi = async (config: DocumentEngineConfig, document: Partial<DocumentRecord>) => {
  const saved = await saveDocumentDraftApi(config, document);
  const submitted = await apiRequest<{ message: Record<string, unknown> }>({
    url: "/method/frappe.client.submit",
    method: "POST",
    data: { doc: { doctype: config.doctype, name: saved.name } }
  });
  return toDocumentRecord(config, submitted.message);
};

export const cancelDocumentApi = async (config: DocumentEngineConfig, name: string) => {
  const cancelled = await apiRequest<{ message: Record<string, unknown> }>({
    url: "/method/frappe.client.cancel",
    method: "POST",
    data: { doctype: config.doctype, name }
  });
  return toDocumentRecord(config, cancelled.message);
};

export const resolveUomConversion = async (
  itemCode: string | undefined,
  uom: string | undefined,
  stockUom?: string | null
): Promise<UomConversionResult> => {
  if (!itemCode || !uom) {
    return { uom, stockUom, conversionFactor: 1 };
  }

  if (stockUom && stockUom === uom) {
    return { uom, stockUom, conversionFactor: 1 };
  }

  const payload = await apiRequest<FrappeListPayload<{ conversion_factor?: number | string | null }>>({
    url: masterDataEndpoints.uomConversionFactor.list,
    method: "GET",
    params: {
      fields: encodeFrappeJson(["conversion_factor"]),
      filters: encodeFrappeJson([
        ["parent", "=", itemCode],
        ["uom", "=", uom]
      ]),
      limit_page_length: 1
    }
  }).catch(() => ({ data: [] }));

  const factor = parseFrappeNumber(payload.data?.[0]?.conversion_factor) || 1;
  return {
    uom,
    stockUom,
    conversionFactor: factor,
    warning: factor === 1 && stockUom && stockUom !== uom ? "Conversion factor not found. Using 1." : null
  };
};

export const resolveItemPricing = async ({
  itemCode,
  party,
  priceList,
  pricingMode
}: {
  itemCode?: string;
  party?: string | null;
  priceList?: string | null;
  pricingMode: "buying" | "selling";
}): Promise<PricingResolution> => {
  if (!itemCode) {
    return { rate: 0, source: "none" };
  }

  const filters = [["item_code", "=", itemCode]] as unknown[][];
  if (priceList) {
    filters.push(["price_list", "=", priceList]);
  }

  filters.push([pricingMode === "selling" ? "selling" : "buying", "=", 1]);

  const pricePayload = await apiRequest<
    FrappeListPayload<{ price_list_rate?: number | string | null; currency?: string | null; customer?: string | null; supplier?: string | null }>
  >({
    url: masterDataEndpoints.itemPrice.list,
    method: "GET",
    params: {
      fields: encodeFrappeJson(["price_list_rate", "currency", "customer", "supplier"]),
      filters: encodeFrappeJson(filters),
      order_by: "modified desc",
      limit_page_length: 20
    }
  }).catch(() => ({ data: [] }));

  const directPartyField = pricingMode === "selling" ? "customer" : "supplier";
  const directPartyRow = (pricePayload.data ?? []).find((row) => row[directPartyField] === party);
  if (directPartyRow) {
    return {
      rate: parseFrappeNumber(directPartyRow.price_list_rate),
      currency: directPartyRow.currency ?? null,
      source: "party-price"
    };
  }

  const genericRow = (pricePayload.data ?? []).find((row) => !row[directPartyField]);
  if (genericRow) {
    return {
      rate: parseFrappeNumber(genericRow.price_list_rate),
      currency: genericRow.currency ?? null,
      source: "price-list"
    };
  }

  const itemPayload = await apiRequest<FrappeDocumentPayload<{ last_purchase_rate?: number | string | null; standard_rate?: number | string | null }>>({
    url: `${masterDataEndpoints.item.list}/${encodeURIComponent(itemCode)}`,
    method: "GET"
  }).catch(() => ({ data: {} }));

  const itemData = itemPayload.data as { last_purchase_rate?: number | string | null; standard_rate?: number | string | null };

  if (pricingMode === "buying" && parseFrappeNumber(itemData.last_purchase_rate) > 0) {
    return {
      rate: parseFrappeNumber(itemData.last_purchase_rate),
      source: "last-purchase-rate"
    };
  }

  return {
    rate: parseFrappeNumber(itemData.standard_rate),
    source: "item-standard-rate"
  };
};

export const validateStockAvailability = async ({
  itemCode,
  warehouse,
  requiredQty
}: {
  itemCode?: string;
  warehouse?: string;
  requiredQty: number;
}): Promise<RowStockValidation> => {
  if (!itemCode || !warehouse || requiredQty <= 0) {
    return {
      rowId: itemCode || warehouse || "unknown",
      warehouse,
      availableQty: 0,
      requiredQty,
      shortageQty: 0,
      ok: true
    };
  }

  const payload = await apiRequest<FrappeListPayload<{ actual_qty?: number | string | null; reserved_qty?: number | string | null }>>({
    url: masterDataEndpoints.stock.bin,
    method: "GET",
    params: {
      fields: encodeFrappeJson(["actual_qty", "reserved_qty"]),
      filters: encodeFrappeJson([
        ["item_code", "=", itemCode],
        ["warehouse", "=", warehouse]
      ]),
      limit_page_length: 1
    }
  }).catch(() => ({ data: [] }));

  const row = payload.data?.[0];
  const availableQty = Math.max(parseFrappeNumber(row?.actual_qty) - parseFrappeNumber(row?.reserved_qty), 0);
  const shortageQty = Math.max(requiredQty - availableQty, 0);

  return {
    rowId: itemCode,
    warehouse,
    availableQty,
    requiredQty,
    shortageQty,
    ok: shortageQty <= 0,
    message: shortageQty > 0 ? `Short by ${shortageQty.toFixed(2)} in ${warehouse}.` : null
  };
};

export const getPartyLabelField = (partyField: DocumentEngineConfig["partyField"]) => PARTY_LABEL_FIELDS[partyField];
