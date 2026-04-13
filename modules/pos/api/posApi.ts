import { frappeApi } from "@/store/api/frappeApi";
import type { FrappeApiError, FrappeDocResponse, FrappeListResponse } from "@/modules/buying/types/frappe";
import { submitDoc } from "@/modules/buying/api/documentActions";
import type { PosCustomerLookup, PosHsCodeLookup, PosInvoiceDoc, PosItemLookup, PosPaymentMode } from "@/modules/pos/types/pos";

type QueryArg = string | {
  url: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  data?: unknown;
  params?: Record<string, unknown>;
};

type QueryResult = { data: unknown } | { error: FrappeApiError };
type QueryRunner = (arg: QueryArg) => Promise<QueryResult>;

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

const toNumber = (value: unknown) => {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const toString = (value: unknown) => (typeof value === "string" && value.trim() ? value : undefined);
const itemHsCode = (row: Record<string, unknown>) =>
  toString(row.gst_hsn_code) ??
  toString(row.hsn_code) ??
  toString(row.hs_code) ??
  toString(row.custom_hs_code);

const submitDocByName = async <T>(run: QueryRunner, doctype: string, name: string): Promise<T | { error: FrappeApiError }> => {
  const result = await submitDoc<T>(run, doctype, name);
  if (typeof result === "object" && result !== null && "error" in result) {
    return { error: result.error };
  }
  return result;
};

export const posApi = frappeApi.injectEndpoints({
  endpoints: (builder) => ({
    searchPosItems: builder.query<PosItemLookup[], string | undefined>({
      async queryFn(search, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<QueryResult>;
        const token = search?.trim();
        const primaryOrFilters: unknown[][] = token
          ? [["item_code", "like", `%${token}%`], ["item_name", "like", `%${token}%`], ["barcode", "like", `%${token}%`]]
          : [];
        const fallbackOrFilters: unknown[][] = token
          ? [["item_code", "like", `%${token}%`], ["item_name", "like", `%${token}%`]]
          : [];

        const firstAttempt = await run({
          url: "/resource/Item",
          method: "GET",
          params: {
            fields: encode(["name", "item_code", "item_name", "stock_uom", "standard_rate", "barcode", "variant_of"]),
            filters: encode([["disabled", "=", 0]]),
            ...(primaryOrFilters.length ? { or_filters: encode(primaryOrFilters) } : {}),
            order_by: "modified desc",
            limit_page_length: 40
          }
        });

        const finalResult = hasError(firstAttempt)
          ? await run({
              url: "/resource/Item",
              method: "GET",
              params: {
                fields: encode(["name", "item_code", "item_name", "stock_uom", "standard_rate", "variant_of", "gst_hsn_code"]),
                filters: encode([["disabled", "=", 0]]),
                ...(fallbackOrFilters.length ? { or_filters: encode(fallbackOrFilters) } : {}),
                order_by: "modified desc",
                limit_page_length: 40
              }
            })
          : firstAttempt;

        if (hasError(finalResult)) {
          return { error: toError(finalResult.error) };
        }

        const rows = (finalResult.data as FrappeListResponse<Record<string, unknown>>).data;
        return {
          data: rows.map((row) => ({
            label: String(row.item_name ?? row.item_code ?? row.name),
            value: String(row.item_code ?? row.name),
            item_name: typeof row.item_name === "string" ? row.item_name : undefined,
            stock_uom: typeof row.stock_uom === "string" ? row.stock_uom : undefined,
            standard_rate: toNumber(row.standard_rate),
            barcode: typeof row.barcode === "string" ? row.barcode : undefined,
            variant_of: typeof row.variant_of === "string" ? row.variant_of : undefined,
            hs_code: itemHsCode(row)
          }))
        };
      },
      providesTags: ["ItemList"]
    }),

    getPosItemMeta: builder.query<Partial<PosItemLookup>, string>({
      async queryFn(itemCode, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<QueryResult>;
        const result = await run({
          url: `/resource/Item/${encodeURIComponent(itemCode)}`,
          method: "GET"
        });

        if (hasError(result)) {
          return { data: {} };
        }

        const row = (result.data as FrappeDocResponse<Record<string, unknown>>).data;
        return {
          data: {
            value: toString(row.item_code ?? row.name),
            label: toString(row.item_name ?? row.item_code ?? row.name),
            item_name: toString(row.item_name),
            stock_uom: toString(row.stock_uom),
            standard_rate: toNumber(row.standard_rate),
            barcode: toString(row.barcode),
            variant_of: toString(row.variant_of),
            hs_code: itemHsCode(row)
          }
        };
      }
    }),

    searchPosHsCodes: builder.query<PosHsCodeLookup[], string | undefined>({
      async queryFn(search, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<QueryResult>;
        const token = search?.trim();
        const doctypes = ["HS Code", "GST HSN Code", "HSN Code"];

        for (const doctype of doctypes) {
          const result = await run({
            url: "/method/frappe.client.get_list",
            method: "GET",
            params: {
              doctype,
              fields: encode(["name"]),
              ...(token ? { filters: encode([["name", "like", `%${token}%`]]) } : {}),
              order_by: "name asc",
              limit_page_length: 50
            }
          });

          if (hasError(result)) {
            continue;
          }

          const message = (result.data as { message?: Array<{ name?: unknown }> }).message ?? [];
          const rows = message
            .map((row) => toString(row?.name))
            .filter((entry): entry is string => Boolean(entry))
            .map((name) => ({ label: name, value: name }));

          if (rows.length) {
            return { data: rows };
          }
        }

        return { data: [] };
      },
      providesTags: ["Lookups"]
    }),

    listPosCustomers: builder.query<PosCustomerLookup[], void>({
      async queryFn(_arg, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<QueryResult>;
        const result = await run({
          url: "/resource/Customer",
          method: "GET",
          params: {
            fields: encode(["name", "customer_name"]),
            order_by: "modified desc",
            limit_page_length: 200
          }
        });

        if (hasError(result)) {
          return { error: toError(result.error) };
        }

        const rows = (result.data as FrappeListResponse<Record<string, unknown>>).data;
        return {
          data: rows.map((row) => ({
            label: String(row.customer_name ?? row.name),
            value: String(row.name),
            customer_name: typeof row.customer_name === "string" ? row.customer_name : undefined
          }))
        };
      },
      providesTags: ["Lookups"]
    }),

    listPosPaymentModes: builder.query<PosPaymentMode[], void>({
      async queryFn(_arg, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<QueryResult>;
        const result = await run({
          url: "/resource/Mode of Payment",
          method: "GET",
          params: {
            fields: encode(["name", "type", "enabled"]),
            filters: encode([["enabled", "=", 1]]),
            order_by: "name asc",
            limit_page_length: 100
          }
        });

        if (hasError(result)) {
          return { error: toError(result.error) };
        }

        const rows = (result.data as FrappeListResponse<Record<string, unknown>>).data;
        return {
          data: rows.map((row) => ({
            label: String(row.name),
            value: String(row.name)
          }))
        };
      },
      providesTags: ["Lookups"]
    }),

    getItemStockQty: builder.query<number, { itemCode: string; warehouse?: string }>({
      async queryFn(arg, _api, _extra, baseQuery) {
        if (!arg.warehouse) {
          return { data: 0 };
        }

        const run = (input: QueryArg) => baseQuery(input) as Promise<QueryResult>;
        const result = await run({
          url: "/resource/Bin",
          method: "GET",
          params: {
            fields: encode(["actual_qty"]),
            filters: encode([["item_code", "=", arg.itemCode], ["warehouse", "=", arg.warehouse]]),
            limit_page_length: 1
          }
        });

        if (hasError(result)) {
          return { error: toError(result.error) };
        }

        const row = (result.data as FrappeListResponse<{ actual_qty?: number | string }>).data[0];
        return { data: toNumber(row?.actual_qty) };
      }
    }),

    createPosInvoice: builder.mutation<PosInvoiceDoc, PosInvoiceDoc>({
      query: (payload) => ({
        url: "/resource/Sales%20Invoice",
        method: "POST",
        data: payload
      }),
      transformResponse: (response: FrappeDocResponse<PosInvoiceDoc>) => response.data,
      invalidatesTags: ["ItemList"]
    }),

    updatePosInvoice: builder.mutation<PosInvoiceDoc, { name: string; values: PosInvoiceDoc }>({
      query: ({ name, values }) => ({
        url: `/resource/Sales%20Invoice/${encodeURIComponent(name)}`,
        method: "PUT",
        data: values
      }),
      transformResponse: (response: FrappeDocResponse<PosInvoiceDoc>) => response.data,
      invalidatesTags: (_result, _error, arg) => ["ItemList", { type: "Item", id: `POS-${arg.name}` }]
    }),

    submitPosInvoice: builder.mutation<PosInvoiceDoc, string>({
      async queryFn(name, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<QueryResult>;
        const result = await submitDocByName<PosInvoiceDoc>(run, "Sales Invoice", name);
        if (typeof result === "object" && result !== null && "error" in result) {
          return { error: toError(result.error) };
        }
        return { data: result };
      },
      invalidatesTags: (_result, _error, name) => ["ItemList", { type: "Item", id: `POS-${name}` }]
    })
  })
});

export const {
  useSearchPosItemsQuery,
  useLazySearchPosItemsQuery,
  useLazyGetPosItemMetaQuery,
  useSearchPosHsCodesQuery,
  useListPosCustomersQuery,
  useListPosPaymentModesQuery,
  useLazyGetItemStockQtyQuery,
  useCreatePosInvoiceMutation,
  useUpdatePosInvoiceMutation,
  useSubmitPosInvoiceMutation
} = posApi;
