import { frappeApi } from "@/store/api/frappeApi";
import type {
  BuyingDashboardSummary,
  BuyingDocumentSummary,
  BuyingListParams,
  BuyingListResult,
  LookupOption,
  MaterialRequestDoc,
  PurchaseInvoiceDoc,
  PurchaseOrderDoc,
  PurchaseReceiptDoc,
  RequestForQuotationDoc,
  SupplierQuotationDoc
} from "@/modules/buying/types/buying";
import type { FrappeApiError, FrappeDocResponse, FrappeListResponse } from "@/modules/buying/types/frappe";
import { submitDoc } from "@/modules/buying/api/documentActions";
import {
  mapMaterialRequestPayload,
  mapPurchaseInvoicePayload,
  mapPurchaseOrderPayload,
  mapPurchaseReceiptPayload,
  mapRfqPayload,
  mapSupplierQuotationPayload
} from "@/modules/buying/utils/payloadMapper";
import { toLimitStart, toOrderBy } from "@/modules/buying/utils/filters";

type QueryArg = string | {
  url: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  data?: unknown;
  params?: Record<string, unknown>;
};

type QueryResult = { data: unknown } | { error: FrappeApiError };
type QueryRunner = (arg: QueryArg) => Promise<QueryResult>;

type MaterialRequestListRow = BuyingDocumentSummary & {
  material_request_type?: string;
  set_warehouse?: string;
};

type RfqListRow = BuyingDocumentSummary;
type SupplierQuotationListRow = BuyingDocumentSummary;
type PurchaseOrderListRow = BuyingDocumentSummary;
type PurchaseReceiptListRow = BuyingDocumentSummary;
type PurchaseInvoiceListRow = BuyingDocumentSummary;

type BuyingMasters = {
  items: LookupOption[];
  suppliers: LookupOption[];
  warehouses: LookupOption[];
  companies: LookupOption[];
  uoms: LookupOption[];
};

const encode = (value: unknown) => JSON.stringify(value);

const hasError = (result: QueryResult): result is { error: FrappeApiError } => "error" in result;

const toError = (error: unknown): FrappeApiError => {
  if (error && typeof error === "object" && "data" in error) {
    const statusRaw = (error as { status?: unknown }).status;
    return {
      status: typeof statusRaw === "number" ? statusRaw : undefined,
      data: (error as { data: unknown }).data
    };
  }

  return { data: error };
};

const toNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const mapLookupRows = (rows: Array<{ name: string }>) =>
  rows.map((row) => ({
    label: row.name,
    value: row.name
  }));

const normalizeDocItems = (items: unknown): Array<Record<string, unknown>> => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object");
};

const buildListFilters = (params: BuyingListParams, includeSupplier: boolean, dateField: string) => {
  const filters: unknown[][] = [];
  const orFilters: unknown[][] = [];

  if (params.company?.trim()) {
    filters.push(["company", "=", params.company.trim()]);
  }

  if (includeSupplier && params.supplier?.trim()) {
    filters.push(["supplier", "=", params.supplier.trim()]);
  }

  if (params.status?.trim() && params.status !== "all") {
    filters.push(["status", "=", params.status.trim()]);
  }

  if (params.dateFrom?.trim()) {
    filters.push([dateField, ">=", params.dateFrom.trim()]);
  }

  if (params.dateTo?.trim()) {
    filters.push([dateField, "<=", params.dateTo.trim()]);
  }

  if (params.search?.trim()) {
    const token = `%${params.search.trim()}%`;
    orFilters.push(["name", "like", token]);
    if (includeSupplier) {
      orFilters.push(["supplier", "like", token]);
    }
  }

  return { filters, orFilters };
};

const listWithCount = async <T>(
  run: QueryRunner,
  doctype: string,
  fields: string[],
  params: BuyingListParams,
  listFilters: ReturnType<typeof buildListFilters>
): Promise<BuyingListResult<T> | { error: FrappeApiError }> => {
  const limitStart = toLimitStart(params.page, params.pageSize);
  const orderBy = toOrderBy(params.sortBy);

  const commonParams: Record<string, unknown> = {
    order_by: orderBy
  };

  if (listFilters.filters.length) {
    commonParams.filters = encode(listFilters.filters);
  }

  if (listFilters.orFilters.length) {
    commonParams.or_filters = encode(listFilters.orFilters);
  }

  const [listResult, countResult] = await Promise.all([
    run({
      url: `/resource/${encodeURIComponent(doctype)}`,
      method: "GET",
      params: {
        ...commonParams,
        fields: encode(fields),
        limit_start: limitStart,
        limit_page_length: params.pageSize
      }
    }),
    run({
      url: `/resource/${encodeURIComponent(doctype)}`,
      method: "GET",
      params: {
        ...commonParams,
        fields: encode(["count(name) as total_count"]),
        limit_page_length: 1
      }
    })
  ]);

  if (hasError(listResult)) {
    return { error: listResult.error };
  }

  if (hasError(countResult)) {
    return { error: countResult.error };
  }

  return {
    data: (listResult.data as FrappeListResponse<T>).data,
    total_count: toNumber((countResult.data as FrappeListResponse<{ total_count?: number | string }>).data?.[0]?.total_count)
  };
};

const getCountByDocType = async (run: QueryRunner, doctype: string) => {
  const result = await run({
    url: `/resource/${encodeURIComponent(doctype)}`,
    method: "GET",
    params: {
      fields: encode(["count(name) as total_count"]),
      filters: encode([["docstatus", "=", 0]]),
      limit_page_length: 1
    }
  });

  if (hasError(result)) {
    return { error: result.error };
  }

  return toNumber((result.data as FrappeListResponse<{ total_count?: number | string }>).data?.[0]?.total_count);
};

const getRecentRows = async (run: QueryRunner, doctype: string, fields: string[]) => {
  const result = await run({
    url: `/resource/${encodeURIComponent(doctype)}`,
    method: "GET",
    params: {
      fields: encode(fields),
      order_by: "modified desc",
      limit_page_length: 5
    }
  });

  if (hasError(result)) {
    return { error: result.error };
  }

  return (result.data as FrappeListResponse<BuyingDocumentSummary>).data;
};

const toDocumentSummary = (doctype: BuyingDashboardSummary["recent_documents"][number]["doctype"], row: BuyingDocumentSummary) => ({
  ...row,
  doctype
});

const submitDocByName = async <T>(
  run: QueryRunner,
  doctype: string,
  name: string
): Promise<T | { error: FrappeApiError }> => {
  const result = await submitDoc<T>(run, doctype, name);
  if (typeof result === "object" && result !== null && "error" in result) {
    return {
      error: {
        status: result.error.status,
        data: result.error.data
      }
    };
  }

  return result;
};

export const buyingApi = frappeApi.injectEndpoints({
  endpoints: (builder) => ({
    listWarehouses: builder.query<LookupOption[], string | void>({
      async queryFn(company, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<QueryResult>;
        const filters: unknown[][] = [["is_group", "=", 0]];

        if (company && company.trim()) {
          filters.push(["company", "=", company.trim()]);
        }

        const result = await run({
          url: "/resource/Warehouse",
          method: "GET",
          params: {
            fields: encode(["name"]),
            filters: encode(filters),
            order_by: "name asc",
            limit_page_length: 500
          }
        });

        if (hasError(result)) {
          return { error: toError(result.error) };
        }

        return {
          data: mapLookupRows((result.data as FrappeListResponse<{ name: string }>).data)
        };
      },
      providesTags: ["Lookups"]
    }),

    getBuyingMasters: builder.query<BuyingMasters, void>({
      async queryFn(_arg, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<QueryResult>;

        const [items, suppliers, warehouses, companies, uoms] = await Promise.all([
          run({
            url: "/resource/Item",
            method: "GET",
            params: {
              fields: encode(["name"]),
              order_by: "name asc",
              limit_page_length: 500
            }
          }),
          run({
            url: "/resource/Supplier",
            method: "GET",
            params: {
              fields: encode(["name"]),
              order_by: "name asc",
              limit_page_length: 500
            }
          }),
          run({
            url: "/resource/Warehouse",
            method: "GET",
            params: {
              fields: encode(["name"]),
              filters: encode([["is_group", "=", 0]]),
              order_by: "name asc",
              limit_page_length: 500
            }
          }),
          run({
            url: "/resource/Company",
            method: "GET",
            params: {
              fields: encode(["name"]),
              order_by: "name asc",
              limit_page_length: 200
            }
          }),
          run({
            url: "/resource/UOM",
            method: "GET",
            params: {
              fields: encode(["name"]),
              order_by: "name asc",
              limit_page_length: 500
            }
          })
        ]);

        if (hasError(items)) {
          return { error: toError(items.error) };
        }

        if (hasError(suppliers)) {
          return { error: toError(suppliers.error) };
        }

        if (hasError(warehouses)) {
          return { error: toError(warehouses.error) };
        }

        if (hasError(companies)) {
          return { error: toError(companies.error) };
        }

        if (hasError(uoms)) {
          return { error: toError(uoms.error) };
        }

        return {
          data: {
            items: mapLookupRows((items.data as FrappeListResponse<{ name: string }>).data),
            suppliers: mapLookupRows((suppliers.data as FrappeListResponse<{ name: string }>).data),
            warehouses: mapLookupRows((warehouses.data as FrappeListResponse<{ name: string }>).data),
            companies: mapLookupRows((companies.data as FrappeListResponse<{ name: string }>).data),
            uoms: mapLookupRows((uoms.data as FrappeListResponse<{ name: string }>).data)
          }
        };
      },
      providesTags: ["Lookups"]
    }),

    getBuyingDashboard: builder.query<BuyingDashboardSummary, void>({
      async queryFn(_arg, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<QueryResult>;

        const [mrCount, rfqCount, sqCount, poCount, prCount, piCount, mrRecent, rfqRecent, poRecent] = await Promise.all([
          getCountByDocType(run, "Material Request"),
          getCountByDocType(run, "Request for Quotation"),
          getCountByDocType(run, "Supplier Quotation"),
          getCountByDocType(run, "Purchase Order"),
          getCountByDocType(run, "Purchase Receipt"),
          getCountByDocType(run, "Purchase Invoice"),
          getRecentRows(run, "Material Request", ["name", "company", "status", "docstatus", "transaction_date", "modified"]),
          getRecentRows(run, "Request for Quotation", ["name", "company", "status", "docstatus", "transaction_date", "modified"]),
          getRecentRows(run, "Purchase Order", ["name", "company", "supplier", "status", "docstatus", "transaction_date", "modified"])
        ]);

        const possibleErrors = [mrCount, rfqCount, sqCount, poCount, prCount, piCount, mrRecent, rfqRecent, poRecent];
        const firstError = possibleErrors.find((entry): entry is { error: FrappeApiError } =>
          typeof entry === "object" && entry !== null && "error" in entry
        );

        if (firstError) {
          return { error: toError(firstError.error) };
        }

        const recent_documents = [
          ...(mrRecent as BuyingDocumentSummary[]).map((row) => toDocumentSummary("Material Request", row)),
          ...(rfqRecent as BuyingDocumentSummary[]).map((row) => toDocumentSummary("Request for Quotation", row)),
          ...(poRecent as BuyingDocumentSummary[]).map((row) => toDocumentSummary("Purchase Order", row))
        ]
          .sort((a, b) => String(b.modified ?? "").localeCompare(String(a.modified ?? "")))
          .slice(0, 10);

        return {
          data: {
            pending_material_requests: mrCount as number,
            pending_rfqs: rfqCount as number,
            pending_supplier_quotations: sqCount as number,
            pending_purchase_orders: poCount as number,
            pending_purchase_receipts: prCount as number,
            pending_purchase_invoices: piCount as number,
            recent_documents
          }
        };
      },
      providesTags: ["ItemList"]
    }),

    listMaterialRequests: builder.query<BuyingListResult<MaterialRequestListRow>, BuyingListParams>({
      async queryFn(params, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<QueryResult>;
        const listFilters = buildListFilters(params, false, "transaction_date");
        const result = await listWithCount<MaterialRequestListRow>(run, "Material Request", [
          "name",
          "company",
          "material_request_type",
          "transaction_date",
          "schedule_date",
          "set_warehouse",
          "status",
          "docstatus",
          "modified"
        ], params, listFilters);

        if ("error" in result) {
          return { error: toError(result.error) };
        }

        return { data: result };
      },
      providesTags: ["ItemList"]
    }),
    getMaterialRequest: builder.query<MaterialRequestDoc, string>({
      query: (name) => `/resource/Material%20Request/${encodeURIComponent(name)}`,
      transformResponse: (response: FrappeDocResponse<MaterialRequestDoc>) => ({
        ...response.data,
        items: normalizeDocItems(response.data.items) as MaterialRequestDoc["items"]
      }),
      providesTags: (_result, _error, name) => [{ type: "Item", id: `MR-${name}` }]
    }),
    createMaterialRequest: builder.mutation<MaterialRequestDoc, MaterialRequestDoc>({
      query: (doc) => ({
        url: "/resource/Material%20Request",
        method: "POST",
        data: mapMaterialRequestPayload(doc)
      }),
      transformResponse: (response: FrappeDocResponse<MaterialRequestDoc>) => response.data,
      invalidatesTags: ["ItemList"]
    }),
    updateMaterialRequest: builder.mutation<MaterialRequestDoc, { name: string; values: MaterialRequestDoc }>({
      query: ({ name, values }) => ({
        url: `/resource/Material%20Request/${encodeURIComponent(name)}`,
        method: "PUT",
        data: mapMaterialRequestPayload(values)
      }),
      transformResponse: (response: FrappeDocResponse<MaterialRequestDoc>) => response.data,
      invalidatesTags: (_result, _error, arg) => ["ItemList", { type: "Item", id: `MR-${arg.name}` }]
    }),
    submitMaterialRequest: builder.mutation<MaterialRequestDoc, string>({
      async queryFn(name, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<QueryResult>;
        const result = await submitDocByName<MaterialRequestDoc>(run, "Material Request", name);
        if (typeof result === "object" && result !== null && "error" in result) {
          return { error: toError(result.error) };
        }
        return { data: result };
      },
      invalidatesTags: (_result, _error, name) => ["ItemList", { type: "Item", id: `MR-${name}` }]
    }),

    listRfqs: builder.query<BuyingListResult<RfqListRow>, BuyingListParams>({
      async queryFn(params, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<QueryResult>;
        const result = await listWithCount<RfqListRow>(
          run,
          "Request for Quotation",
          ["name", "company", "transaction_date", "status", "docstatus", "modified"],
          params,
          buildListFilters(params, false, "transaction_date")
        );

        if ("error" in result) {
          return { error: toError(result.error) };
        }

        return { data: result };
      },
      providesTags: ["ItemList"]
    }),
    getRfq: builder.query<RequestForQuotationDoc, string>({
      query: (name) => `/resource/Request%20for%20Quotation/${encodeURIComponent(name)}`,
      transformResponse: (response: FrappeDocResponse<RequestForQuotationDoc>) => ({
        ...response.data,
        items: normalizeDocItems(response.data.items) as RequestForQuotationDoc["items"],
        suppliers: Array.isArray(response.data.suppliers) ? response.data.suppliers : []
      }),
      providesTags: (_result, _error, name) => [{ type: "Item", id: `RFQ-${name}` }]
    }),
    createRfq: builder.mutation<RequestForQuotationDoc, RequestForQuotationDoc>({
      query: (doc) => ({
        url: "/resource/Request%20for%20Quotation",
        method: "POST",
        data: mapRfqPayload(doc)
      }),
      transformResponse: (response: FrappeDocResponse<RequestForQuotationDoc>) => response.data,
      invalidatesTags: ["ItemList"]
    }),
    updateRfq: builder.mutation<RequestForQuotationDoc, { name: string; values: RequestForQuotationDoc }>({
      query: ({ name, values }) => ({
        url: `/resource/Request%20for%20Quotation/${encodeURIComponent(name)}`,
        method: "PUT",
        data: mapRfqPayload(values)
      }),
      transformResponse: (response: FrappeDocResponse<RequestForQuotationDoc>) => response.data,
      invalidatesTags: (_result, _error, arg) => ["ItemList", { type: "Item", id: `RFQ-${arg.name}` }]
    }),
    submitRfq: builder.mutation<RequestForQuotationDoc, string>({
      async queryFn(name, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<QueryResult>;
        const result = await submitDocByName<RequestForQuotationDoc>(run, "Request for Quotation", name);
        if (typeof result === "object" && result !== null && "error" in result) {
          return { error: toError(result.error) };
        }
        return { data: result };
      },
      invalidatesTags: (_result, _error, name) => ["ItemList", { type: "Item", id: `RFQ-${name}` }]
    }),

    listSupplierQuotations: builder.query<BuyingListResult<SupplierQuotationListRow>, BuyingListParams>({
      async queryFn(params, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<QueryResult>;
        const result = await listWithCount<SupplierQuotationListRow>(
          run,
          "Supplier Quotation",
          ["name", "supplier", "company", "transaction_date", "status", "docstatus", "grand_total", "modified"],
          params,
          buildListFilters(params, true, "transaction_date")
        );

        if ("error" in result) {
          return { error: toError(result.error) };
        }

        return { data: result };
      },
      providesTags: ["ItemList"]
    }),
    getSupplierQuotation: builder.query<SupplierQuotationDoc, string>({
      query: (name) => `/resource/Supplier%20Quotation/${encodeURIComponent(name)}`,
      transformResponse: (response: FrappeDocResponse<SupplierQuotationDoc>) => ({
        ...response.data,
        items: normalizeDocItems(response.data.items) as SupplierQuotationDoc["items"]
      }),
      providesTags: (_result, _error, name) => [{ type: "Item", id: `SQ-${name}` }]
    }),
    createSupplierQuotation: builder.mutation<SupplierQuotationDoc, SupplierQuotationDoc>({
      query: (doc) => ({
        url: "/resource/Supplier%20Quotation",
        method: "POST",
        data: mapSupplierQuotationPayload(doc)
      }),
      transformResponse: (response: FrappeDocResponse<SupplierQuotationDoc>) => response.data,
      invalidatesTags: ["ItemList"]
    }),
    updateSupplierQuotation: builder.mutation<SupplierQuotationDoc, { name: string; values: SupplierQuotationDoc }>({
      query: ({ name, values }) => ({
        url: `/resource/Supplier%20Quotation/${encodeURIComponent(name)}`,
        method: "PUT",
        data: mapSupplierQuotationPayload(values)
      }),
      transformResponse: (response: FrappeDocResponse<SupplierQuotationDoc>) => response.data,
      invalidatesTags: (_result, _error, arg) => ["ItemList", { type: "Item", id: `SQ-${arg.name}` }]
    }),
    submitSupplierQuotation: builder.mutation<SupplierQuotationDoc, string>({
      async queryFn(name, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<QueryResult>;
        const result = await submitDocByName<SupplierQuotationDoc>(run, "Supplier Quotation", name);
        if (typeof result === "object" && result !== null && "error" in result) {
          return { error: toError(result.error) };
        }
        return { data: result };
      },
      invalidatesTags: (_result, _error, name) => ["ItemList", { type: "Item", id: `SQ-${name}` }]
    }),

    listPurchaseOrders: builder.query<BuyingListResult<PurchaseOrderListRow>, BuyingListParams>({
      async queryFn(params, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<QueryResult>;
        const result = await listWithCount<PurchaseOrderListRow>(
          run,
          "Purchase Order",
          ["name", "supplier", "company", "transaction_date", "schedule_date", "status", "docstatus", "grand_total", "modified"],
          params,
          buildListFilters(params, true, "transaction_date")
        );

        if ("error" in result) {
          return { error: toError(result.error) };
        }

        return { data: result };
      },
      providesTags: ["ItemList"]
    }),
    getPurchaseOrder: builder.query<PurchaseOrderDoc, string>({
      query: (name) => `/resource/Purchase%20Order/${encodeURIComponent(name)}`,
      transformResponse: (response: FrappeDocResponse<PurchaseOrderDoc>) => ({
        ...response.data,
        items: normalizeDocItems(response.data.items) as PurchaseOrderDoc["items"]
      }),
      providesTags: (_result, _error, name) => [{ type: "Item", id: `PO-${name}` }]
    }),
    createPurchaseOrder: builder.mutation<PurchaseOrderDoc, PurchaseOrderDoc>({
      query: (doc) => ({
        url: "/resource/Purchase%20Order",
        method: "POST",
        data: mapPurchaseOrderPayload(doc)
      }),
      transformResponse: (response: FrappeDocResponse<PurchaseOrderDoc>) => response.data,
      invalidatesTags: ["ItemList"]
    }),
    updatePurchaseOrder: builder.mutation<PurchaseOrderDoc, { name: string; values: PurchaseOrderDoc }>({
      query: ({ name, values }) => ({
        url: `/resource/Purchase%20Order/${encodeURIComponent(name)}`,
        method: "PUT",
        data: mapPurchaseOrderPayload(values)
      }),
      transformResponse: (response: FrappeDocResponse<PurchaseOrderDoc>) => response.data,
      invalidatesTags: (_result, _error, arg) => ["ItemList", { type: "Item", id: `PO-${arg.name}` }]
    }),
    submitPurchaseOrder: builder.mutation<PurchaseOrderDoc, string>({
      async queryFn(name, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<QueryResult>;
        const result = await submitDocByName<PurchaseOrderDoc>(run, "Purchase Order", name);
        if (typeof result === "object" && result !== null && "error" in result) {
          return { error: toError(result.error) };
        }
        return { data: result };
      },
      invalidatesTags: (_result, _error, name) => ["ItemList", { type: "Item", id: `PO-${name}` }]
    }),

    listPurchaseReceipts: builder.query<BuyingListResult<PurchaseReceiptListRow>, BuyingListParams>({
      async queryFn(params, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<QueryResult>;
        const result = await listWithCount<PurchaseReceiptListRow>(
          run,
          "Purchase Receipt",
          ["name", "supplier", "company", "posting_date", "status", "docstatus", "grand_total", "modified"],
          params,
          buildListFilters(params, true, "posting_date")
        );

        if ("error" in result) {
          return { error: toError(result.error) };
        }

        return { data: result };
      },
      providesTags: ["ItemList"]
    }),
    getPurchaseReceipt: builder.query<PurchaseReceiptDoc, string>({
      query: (name) => `/resource/Purchase%20Receipt/${encodeURIComponent(name)}`,
      transformResponse: (response: FrappeDocResponse<PurchaseReceiptDoc>) => ({
        ...response.data,
        items: normalizeDocItems(response.data.items) as PurchaseReceiptDoc["items"]
      }),
      providesTags: (_result, _error, name) => [{ type: "Item", id: `PR-${name}` }]
    }),
    createPurchaseReceipt: builder.mutation<PurchaseReceiptDoc, PurchaseReceiptDoc>({
      query: (doc) => ({
        url: "/resource/Purchase%20Receipt",
        method: "POST",
        data: mapPurchaseReceiptPayload(doc)
      }),
      transformResponse: (response: FrappeDocResponse<PurchaseReceiptDoc>) => response.data,
      invalidatesTags: ["ItemList"]
    }),
    updatePurchaseReceipt: builder.mutation<PurchaseReceiptDoc, { name: string; values: PurchaseReceiptDoc }>({
      query: ({ name, values }) => ({
        url: `/resource/Purchase%20Receipt/${encodeURIComponent(name)}`,
        method: "PUT",
        data: mapPurchaseReceiptPayload(values)
      }),
      transformResponse: (response: FrappeDocResponse<PurchaseReceiptDoc>) => response.data,
      invalidatesTags: (_result, _error, arg) => ["ItemList", { type: "Item", id: `PR-${arg.name}` }]
    }),
    submitPurchaseReceipt: builder.mutation<PurchaseReceiptDoc, string>({
      async queryFn(name, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<QueryResult>;
        const result = await submitDocByName<PurchaseReceiptDoc>(run, "Purchase Receipt", name);
        if (typeof result === "object" && result !== null && "error" in result) {
          return { error: toError(result.error) };
        }
        return { data: result };
      },
      invalidatesTags: (_result, _error, name) => ["ItemList", { type: "Item", id: `PR-${name}` }]
    }),

    listPurchaseInvoices: builder.query<BuyingListResult<PurchaseInvoiceListRow>, BuyingListParams>({
      async queryFn(params, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<QueryResult>;
        const result = await listWithCount<PurchaseInvoiceListRow>(
          run,
          "Purchase Invoice",
          ["name", "supplier", "company", "posting_date", "due_date", "status", "docstatus", "grand_total", "outstanding_amount", "modified"],
          params,
          buildListFilters(params, true, "posting_date")
        );

        if ("error" in result) {
          return { error: toError(result.error) };
        }

        return { data: result };
      },
      providesTags: ["ItemList"]
    }),
    getPurchaseInvoice: builder.query<PurchaseInvoiceDoc, string>({
      query: (name) => `/resource/Purchase%20Invoice/${encodeURIComponent(name)}`,
      transformResponse: (response: FrappeDocResponse<PurchaseInvoiceDoc>) => ({
        ...response.data,
        items: normalizeDocItems(response.data.items) as PurchaseInvoiceDoc["items"]
      }),
      providesTags: (_result, _error, name) => [{ type: "Item", id: `PI-${name}` }]
    }),
    createPurchaseInvoice: builder.mutation<PurchaseInvoiceDoc, PurchaseInvoiceDoc>({
      query: (doc) => ({
        url: "/resource/Purchase%20Invoice",
        method: "POST",
        data: mapPurchaseInvoicePayload(doc)
      }),
      transformResponse: (response: FrappeDocResponse<PurchaseInvoiceDoc>) => response.data,
      invalidatesTags: ["ItemList"]
    }),
    updatePurchaseInvoice: builder.mutation<PurchaseInvoiceDoc, { name: string; values: PurchaseInvoiceDoc }>({
      query: ({ name, values }) => ({
        url: `/resource/Purchase%20Invoice/${encodeURIComponent(name)}`,
        method: "PUT",
        data: mapPurchaseInvoicePayload(values)
      }),
      transformResponse: (response: FrappeDocResponse<PurchaseInvoiceDoc>) => response.data,
      invalidatesTags: (_result, _error, arg) => ["ItemList", { type: "Item", id: `PI-${arg.name}` }]
    }),
    submitPurchaseInvoice: builder.mutation<PurchaseInvoiceDoc, string>({
      async queryFn(name, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<QueryResult>;
        const result = await submitDocByName<PurchaseInvoiceDoc>(run, "Purchase Invoice", name);
        if (typeof result === "object" && result !== null && "error" in result) {
          return { error: toError(result.error) };
        }
        return { data: result };
      },
      invalidatesTags: (_result, _error, name) => ["ItemList", { type: "Item", id: `PI-${name}` }]
    })
  })
});

export const {
  useListWarehousesQuery,
  useGetBuyingDashboardQuery,
  useGetBuyingMastersQuery,
  useListMaterialRequestsQuery,
  useGetMaterialRequestQuery,
  useCreateMaterialRequestMutation,
  useUpdateMaterialRequestMutation,
  useSubmitMaterialRequestMutation,
  useListRfqsQuery,
  useGetRfqQuery,
  useCreateRfqMutation,
  useUpdateRfqMutation,
  useSubmitRfqMutation,
  useListSupplierQuotationsQuery,
  useGetSupplierQuotationQuery,
  useCreateSupplierQuotationMutation,
  useUpdateSupplierQuotationMutation,
  useSubmitSupplierQuotationMutation,
  useListPurchaseOrdersQuery,
  useGetPurchaseOrderQuery,
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
  useSubmitPurchaseOrderMutation,
  useListPurchaseReceiptsQuery,
  useGetPurchaseReceiptQuery,
  useCreatePurchaseReceiptMutation,
  useUpdatePurchaseReceiptMutation,
  useSubmitPurchaseReceiptMutation,
  useListPurchaseInvoicesQuery,
  useGetPurchaseInvoiceQuery,
  useCreatePurchaseInvoiceMutation,
  useUpdatePurchaseInvoiceMutation,
  useSubmitPurchaseInvoiceMutation
} = buyingApi;
