import { frappeApi } from "@/core/api/frappeApi";
import type {
  DeliveryNoteDoc,
  LookupOption,
  QuotationDoc,
  SalesOrderDoc,
  SellingDashboardSummary,
  SellingDocumentSummary,
  SellingListParams,
  SellingListResult
} from "@/modules/selling/types/selling";
import type { FrappeApiError, FrappeDocResponse, FrappeListResponse } from "@/modules/selling/types/frappe";
import { submitDoc } from "@/modules/buying/api/documentActions";
import {
  mapDeliveryNotePayload,
  mapQuotationPayload,
  mapSalesOrderPayload
} from "@/modules/selling/utils/payloadMapper";

type QueryArg = string | {
  url: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  data?: unknown;
  params?: Record<string, unknown>;
};

type QueryResult = { data: unknown } | { error: FrappeApiError };
type QueryRunner = (arg: QueryArg) => Promise<QueryResult>;

type QuotationListRow = SellingDocumentSummary;
type SalesOrderListRow = SellingDocumentSummary;
type DeliveryNoteListRow = SellingDocumentSummary;

type SellingMasters = {
  items: LookupOption[];
  customers: LookupOption[];
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

const toLimitStart = (page: number, pageSize: number) => Math.max(page - 1, 0) * pageSize;
const toOrderBy = (sortBy?: SellingListParams["sortBy"]) => (sortBy === "modified_asc" ? "modified asc" : "modified desc");

const buildListFilters = (params: SellingListParams, dateField: string, partyField = "customer") => {
  const filters: unknown[][] = [];
  const orFilters: unknown[][] = [];

  if (params.company?.trim()) {
    filters.push(["company", "=", params.company.trim()]);
  }

  if (params.customer?.trim()) {
    filters.push([partyField, "=", params.customer.trim()]);
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
    orFilters.push([partyField, "like", token]);
  }

  return { filters, orFilters };
};

const listWithCount = async <T>(
  run: QueryRunner,
  doctype: string,
  fields: string[],
  params: SellingListParams,
  listFilters: ReturnType<typeof buildListFilters>
): Promise<SellingListResult<T> | { error: FrappeApiError }> => {
  const limitStart = toLimitStart(params.page, params.pageSize);
  const orderBy = toOrderBy(params.sortBy);

  const commonParams: Record<string, unknown> = { order_by: orderBy };

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

const getCountByDocType = async (run: QueryRunner, doctype: string, docstatus: 0 | 1) => {
  const result = await run({
    url: `/resource/${encodeURIComponent(doctype)}`,
    method: "GET",
    params: {
      fields: encode(["count(name) as total_count"]),
      filters: encode([["docstatus", "=", docstatus]]),
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

  return (result.data as FrappeListResponse<SellingDocumentSummary>).data;
};

const toDocumentSummary = (doctype: SellingDashboardSummary["recent_documents"][number]["doctype"], row: SellingDocumentSummary) => ({
  ...row,
  doctype
});

const mapQuotationListRow = (row: Record<string, unknown>): SellingDocumentSummary => ({
  name: typeof row.name === "string" ? row.name : "",
  customer: typeof row.party_name === "string" ? row.party_name : undefined,
  company: typeof row.company === "string" ? row.company : undefined,
  status: typeof row.status === "string" ? row.status : undefined,
  docstatus: typeof row.docstatus === "number" ? (row.docstatus as 0 | 1 | 2) : undefined,
  transaction_date: typeof row.transaction_date === "string" ? row.transaction_date : undefined,
  valid_till: typeof row.valid_till === "string" ? row.valid_till : undefined,
  modified: typeof row.modified === "string" ? row.modified : undefined,
  grand_total: typeof row.grand_total === "number" ? row.grand_total : undefined
});

const submitDocByName = async <T>(run: QueryRunner, doctype: string, name: string): Promise<T | { error: FrappeApiError }> => {
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

const cancelDocByName = async <T>(run: QueryRunner, doctype: string, name: string): Promise<T | { error: FrappeApiError }> => {
  const result = await run({
    url: "/method/frappe.client.cancel",
    method: "POST",
    data: { doctype, name }
  });

  if (hasError(result)) {
    return { error: result.error };
  }

  const payload = result.data as FrappeDocResponse<T> | { message?: T };
  if (payload && typeof payload === "object" && "data" in payload && payload.data) {
    return payload.data;
  }

  if (payload && typeof payload === "object" && "message" in payload && payload.message) {
    return payload.message;
  }

  return { error: { data: "Unexpected cancel response." } };
};

export const sellingApi = frappeApi.injectEndpoints({
  endpoints: (builder) => ({
    getSellingMasters: builder.query<SellingMasters, void>({
      async queryFn(_arg, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<QueryResult>;
        const [items, customers, warehouses, companies, uoms] = await Promise.all([
          run({ url: "/resource/Item", method: "GET", params: { fields: encode(["name"]), order_by: "name asc", limit_page_length: 500 } }),
          run({ url: "/resource/Customer", method: "GET", params: { fields: encode(["name"]), order_by: "name asc", limit_page_length: 500 } }),
          run({
            url: "/resource/Warehouse",
            method: "GET",
            params: { fields: encode(["name"]), filters: encode([["is_group", "=", 0]]), order_by: "name asc", limit_page_length: 500 }
          }),
          run({ url: "/resource/Company", method: "GET", params: { fields: encode(["name"]), order_by: "name asc", limit_page_length: 200 } }),
          run({ url: "/resource/UOM", method: "GET", params: { fields: encode(["name"]), order_by: "name asc", limit_page_length: 500 } })
        ]);

        if (hasError(items)) return { error: toError(items.error) };
        if (hasError(customers)) return { error: toError(customers.error) };
        if (hasError(warehouses)) return { error: toError(warehouses.error) };
        if (hasError(companies)) return { error: toError(companies.error) };
        if (hasError(uoms)) return { error: toError(uoms.error) };

        return {
          data: {
            items: mapLookupRows((items.data as FrappeListResponse<{ name: string }>).data),
            customers: mapLookupRows((customers.data as FrappeListResponse<{ name: string }>).data),
            warehouses: mapLookupRows((warehouses.data as FrappeListResponse<{ name: string }>).data),
            companies: mapLookupRows((companies.data as FrappeListResponse<{ name: string }>).data),
            uoms: mapLookupRows((uoms.data as FrappeListResponse<{ name: string }>).data)
          }
        };
      },
      providesTags: ["Lookups"]
    }),

    getSellingDashboard: builder.query<SellingDashboardSummary, void>({
      async queryFn(_arg, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<QueryResult>;
        const [quotationDrafts, quotationSubmitted, salesOrderDrafts, salesOrderSubmitted, deliveryNoteDrafts, deliveryNoteSubmitted, quotationRecent, salesOrderRecent, deliveryNoteRecent] = await Promise.all([
          getCountByDocType(run, "Quotation", 0),
          getCountByDocType(run, "Quotation", 1),
          getCountByDocType(run, "Sales Order", 0),
          getCountByDocType(run, "Sales Order", 1),
          getCountByDocType(run, "Delivery Note", 0),
          getCountByDocType(run, "Delivery Note", 1),
          getRecentRows(run, "Quotation", ["name", "party_name", "company", "status", "docstatus", "transaction_date", "valid_till", "modified"]),
          getRecentRows(run, "Sales Order", ["name", "customer", "company", "status", "docstatus", "transaction_date", "delivery_date", "modified"]),
          getRecentRows(run, "Delivery Note", ["name", "customer", "company", "status", "docstatus", "posting_date", "modified"])
        ]);

        const possibleErrors = [quotationDrafts, quotationSubmitted, salesOrderDrafts, salesOrderSubmitted, deliveryNoteDrafts, deliveryNoteSubmitted, quotationRecent, salesOrderRecent, deliveryNoteRecent];
        const firstError = possibleErrors.find((entry): entry is { error: FrappeApiError } => typeof entry === "object" && entry !== null && "error" in entry);

        if (firstError) {
          return { error: toError(firstError.error) };
        }

        const recent_documents = [
          ...(quotationRecent as Record<string, unknown>[]).map((row) => toDocumentSummary("Quotation", mapQuotationListRow(row))),
          ...(salesOrderRecent as SellingDocumentSummary[]).map((row) => toDocumentSummary("Sales Order", row)),
          ...(deliveryNoteRecent as SellingDocumentSummary[]).map((row) => toDocumentSummary("Delivery Note", row))
        ].sort((a, b) => String(b.modified ?? "").localeCompare(String(a.modified ?? ""))).slice(0, 10);

        return {
          data: {
            draft_quotations: quotationDrafts as number,
            submitted_quotations: quotationSubmitted as number,
            draft_sales_orders: salesOrderDrafts as number,
            submitted_sales_orders: salesOrderSubmitted as number,
            draft_delivery_notes: deliveryNoteDrafts as number,
            submitted_delivery_notes: deliveryNoteSubmitted as number,
            recent_documents
          }
        };
      },
      providesTags: ["ItemList"]
    }),

    listQuotations: builder.query<SellingListResult<QuotationListRow>, SellingListParams>({
      async queryFn(params, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<QueryResult>;
        const result = await listWithCount<Record<string, unknown>>(run, "Quotation", ["name", "party_name", "company", "transaction_date", "valid_till", "status", "docstatus", "grand_total", "modified"], params, buildListFilters(params, "transaction_date", "party_name"));
        if ("error" in result) return { error: toError(result.error) };
        return {
          data: {
            ...result,
            data: result.data.map((row) => mapQuotationListRow(row))
          }
        };
      },
      providesTags: ["ItemList"]
    }),
    getQuotation: builder.query<QuotationDoc, string>({
      query: (name) => `/resource/Quotation/${encodeURIComponent(name)}`,
      transformResponse: (response: FrappeDocResponse<QuotationDoc>) => ({
        ...response.data,
        party_name: response.data.party_name ?? response.data.customer ?? "",
        customer: response.data.customer ?? response.data.party_name,
        quotation_to: "Customer",
        items: normalizeDocItems(response.data.items) as QuotationDoc["items"]
      }),
      providesTags: (_result, _error, name) => [{ type: "Item", id: `QT-${name}` }]
    }),
    createQuotation: builder.mutation<QuotationDoc, QuotationDoc>({
      query: (doc) => ({ url: "/resource/Quotation", method: "POST", data: mapQuotationPayload(doc) }),
      transformResponse: (response: FrappeDocResponse<QuotationDoc>) => response.data,
      invalidatesTags: ["ItemList"]
    }),
    updateQuotation: builder.mutation<QuotationDoc, { name: string; values: QuotationDoc }>({
      query: ({ name, values }) => ({ url: `/resource/Quotation/${encodeURIComponent(name)}`, method: "PUT", data: mapQuotationPayload(values) }),
      transformResponse: (response: FrappeDocResponse<QuotationDoc>) => response.data,
      invalidatesTags: (_result, _error, arg) => ["ItemList", { type: "Item", id: `QT-${arg.name}` }]
    }),
    submitQuotation: builder.mutation<QuotationDoc, string>({
      async queryFn(name, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<QueryResult>;
        const result = await submitDocByName<QuotationDoc>(run, "Quotation", name);
        if (typeof result === "object" && result !== null && "error" in result) return { error: toError(result.error) };
        return { data: result };
      },
      invalidatesTags: (_result, _error, name) => ["ItemList", { type: "Item", id: `QT-${name}` }]
    }),
    cancelQuotation: builder.mutation<QuotationDoc, string>({
      async queryFn(name, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<QueryResult>;
        const result = await cancelDocByName<QuotationDoc>(run, "Quotation", name);
        if (typeof result === "object" && result !== null && "error" in result) return { error: toError(result.error) };
        return { data: result };
      },
      invalidatesTags: (_result, _error, name) => ["ItemList", { type: "Item", id: `QT-${name}` }]
    }),

    listSalesOrders: builder.query<SellingListResult<SalesOrderListRow>, SellingListParams>({
      async queryFn(params, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<QueryResult>;
        const result = await listWithCount<SalesOrderListRow>(run, "Sales Order", ["name", "customer", "company", "transaction_date", "delivery_date", "status", "docstatus", "grand_total", "modified"], params, buildListFilters(params, "transaction_date"));
        if ("error" in result) return { error: toError(result.error) };
        return { data: result };
      },
      providesTags: ["ItemList"]
    }),
    getSalesOrder: builder.query<SalesOrderDoc, string>({
      query: (name) => `/resource/Sales%20Order/${encodeURIComponent(name)}`,
      transformResponse: (response: FrappeDocResponse<SalesOrderDoc>) => ({
        ...response.data,
        items: normalizeDocItems(response.data.items) as SalesOrderDoc["items"]
      }),
      providesTags: (_result, _error, name) => [{ type: "Item", id: `SO-${name}` }]
    }),
    createSalesOrder: builder.mutation<SalesOrderDoc, SalesOrderDoc>({
      query: (doc) => ({ url: "/resource/Sales%20Order", method: "POST", data: mapSalesOrderPayload(doc) }),
      transformResponse: (response: FrappeDocResponse<SalesOrderDoc>) => response.data,
      invalidatesTags: ["ItemList"]
    }),
    updateSalesOrder: builder.mutation<SalesOrderDoc, { name: string; values: SalesOrderDoc }>({
      query: ({ name, values }) => ({ url: `/resource/Sales%20Order/${encodeURIComponent(name)}`, method: "PUT", data: mapSalesOrderPayload(values) }),
      transformResponse: (response: FrappeDocResponse<SalesOrderDoc>) => response.data,
      invalidatesTags: (_result, _error, arg) => ["ItemList", { type: "Item", id: `SO-${arg.name}` }]
    }),
    submitSalesOrder: builder.mutation<SalesOrderDoc, string>({
      async queryFn(name, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<QueryResult>;
        const result = await submitDocByName<SalesOrderDoc>(run, "Sales Order", name);
        if (typeof result === "object" && result !== null && "error" in result) return { error: toError(result.error) };
        return { data: result };
      },
      invalidatesTags: (_result, _error, name) => ["ItemList", { type: "Item", id: `SO-${name}` }]
    }),
    cancelSalesOrder: builder.mutation<SalesOrderDoc, string>({
      async queryFn(name, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<QueryResult>;
        const result = await cancelDocByName<SalesOrderDoc>(run, "Sales Order", name);
        if (typeof result === "object" && result !== null && "error" in result) return { error: toError(result.error) };
        return { data: result };
      },
      invalidatesTags: (_result, _error, name) => ["ItemList", { type: "Item", id: `SO-${name}` }]
    }),

    listDeliveryNotes: builder.query<SellingListResult<DeliveryNoteListRow>, SellingListParams>({
      async queryFn(params, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<QueryResult>;
        const result = await listWithCount<DeliveryNoteListRow>(run, "Delivery Note", ["name", "customer", "company", "posting_date", "status", "docstatus", "grand_total", "modified"], params, buildListFilters(params, "posting_date"));
        if ("error" in result) return { error: toError(result.error) };
        return { data: result };
      },
      providesTags: ["ItemList"]
    }),
    getDeliveryNote: builder.query<DeliveryNoteDoc, string>({
      query: (name) => `/resource/Delivery%20Note/${encodeURIComponent(name)}`,
      transformResponse: (response: FrappeDocResponse<DeliveryNoteDoc>) => ({
        ...response.data,
        items: normalizeDocItems(response.data.items) as DeliveryNoteDoc["items"]
      }),
      providesTags: (_result, _error, name) => [{ type: "Item", id: `DN-${name}` }]
    }),
    createDeliveryNote: builder.mutation<DeliveryNoteDoc, DeliveryNoteDoc>({
      query: (doc) => ({ url: "/resource/Delivery%20Note", method: "POST", data: mapDeliveryNotePayload(doc) }),
      transformResponse: (response: FrappeDocResponse<DeliveryNoteDoc>) => response.data,
      invalidatesTags: ["ItemList"]
    }),
    updateDeliveryNote: builder.mutation<DeliveryNoteDoc, { name: string; values: DeliveryNoteDoc }>({
      query: ({ name, values }) => ({ url: `/resource/Delivery%20Note/${encodeURIComponent(name)}`, method: "PUT", data: mapDeliveryNotePayload(values) }),
      transformResponse: (response: FrappeDocResponse<DeliveryNoteDoc>) => response.data,
      invalidatesTags: (_result, _error, arg) => ["ItemList", { type: "Item", id: `DN-${arg.name}` }]
    }),
    submitDeliveryNote: builder.mutation<DeliveryNoteDoc, string>({
      async queryFn(name, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<QueryResult>;
        const result = await submitDocByName<DeliveryNoteDoc>(run, "Delivery Note", name);
        if (typeof result === "object" && result !== null && "error" in result) return { error: toError(result.error) };
        return { data: result };
      },
      invalidatesTags: (_result, _error, name) => ["ItemList", { type: "Item", id: `DN-${name}` }]
    }),
    cancelDeliveryNote: builder.mutation<DeliveryNoteDoc, string>({
      async queryFn(name, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<QueryResult>;
        const result = await cancelDocByName<DeliveryNoteDoc>(run, "Delivery Note", name);
        if (typeof result === "object" && result !== null && "error" in result) return { error: toError(result.error) };
        return { data: result };
      },
      invalidatesTags: (_result, _error, name) => ["ItemList", { type: "Item", id: `DN-${name}` }]
    })
  })
});

export const {
  useGetSellingMastersQuery,
  useGetSellingDashboardQuery,
  useListQuotationsQuery,
  useGetQuotationQuery,
  useCreateQuotationMutation,
  useUpdateQuotationMutation,
  useSubmitQuotationMutation,
  useCancelQuotationMutation,
  useListSalesOrdersQuery,
  useGetSalesOrderQuery,
  useCreateSalesOrderMutation,
  useUpdateSalesOrderMutation,
  useSubmitSalesOrderMutation,
  useCancelSalesOrderMutation,
  useListDeliveryNotesQuery,
  useGetDeliveryNoteQuery,
  useCreateDeliveryNoteMutation,
  useUpdateDeliveryNoteMutation,
  useSubmitDeliveryNoteMutation,
  useCancelDeliveryNoteMutation
} = sellingApi;
