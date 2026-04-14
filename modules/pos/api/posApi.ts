import { frappeApi } from "@/store/api/frappeApi";
import type { FrappeApiError, FrappeDocResponse, FrappeListResponse } from "@/modules/buying/types/frappe";
import { submitDoc } from "@/modules/buying/api/documentActions";
import type {
  PosClosingEntryPayload,
  PosCustomerLookup,
  PosHsCodeLookup,
  PosInvoiceDoc,
  PosItemLookup,
  PosOpeningAmountRow,
  PosOpeningEntryPayload,
  PosPaymentMode,
  PosProfileLookup,
  PosSession,
  PosSessionSummary
} from "@/modules/pos/types/pos";

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

const hsCodeDoctypesByPriority = ["HS Code", "GST HSN Code", "HSN Code"] as const;
const unavailableHsCodeDoctypes = new Set<string>();

const submitDocByName = async <T>(run: QueryRunner, doctype: string, name: string): Promise<T | { error: FrappeApiError }> => {
  const result = await submitDoc<T>(run, doctype, name);
  if (typeof result === "object" && result !== null && "error" in result) {
    return { error: result.error };
  }
  return result;
};

const toIsoDateTime = (value?: string) => {
  if (!value) {
    return new Date().toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? new Date().toISOString() : parsed.toISOString();
};

const toDateOnly = (value?: string) => toIsoDateTime(value).slice(0, 10);

const toOpeningAmounts = (row: Record<string, unknown>): PosOpeningAmountRow[] => {
  const candidates = [row.balance_details, row.opening_amounts, row.payments];
  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) {
      continue;
    }

    const rows = candidate
      .map((entry) => {
        if (!entry || typeof entry !== "object") {
          return null;
        }

        const payload = entry as Record<string, unknown>;
        const mode =
          toString(payload.mode_of_payment) ??
          toString(payload.payment_mode) ??
          toString(payload.type);
        const amount =
          toNumber(payload.opening_amount) ||
          toNumber(payload.amount) ||
          toNumber(payload.value);

        if (!mode) {
          return null;
        }

        return {
          mode_of_payment: mode,
          opening_amount: amount
        };
      })
      .filter((entry): entry is PosOpeningAmountRow => Boolean(entry));

    if (rows.length) {
      return rows;
    }
  }

  const openingCash = toNumber(row.opening_amount) || toNumber(row.cash_opening_amount);
  if (openingCash > 0) {
    return [{ mode_of_payment: "Cash", opening_amount: openingCash }];
  }

  return [{ mode_of_payment: "Cash", opening_amount: 0 }];
};

const toPosSession = (row: Record<string, unknown>, profile?: PosProfileLookup): PosSession => ({
  name: String(row.name ?? ""),
  pos_profile: toString(row.pos_profile) ?? profile?.value ?? "",
  company: toString(row.company) ?? profile?.company,
  user: toString(row.user) ?? toString(row.owner),
  status: toString(row.status),
  opening_time:
    toString(row.period_start_date) ??
    toString(row.opening_time) ??
    toString(row.creation),
  posting_date: toString(row.posting_date),
  remarks: toString(row.remarks),
  warehouse: toString(row.set_warehouse) ?? profile?.warehouse,
  default_customer: profile?.customer,
  opening_amounts: toOpeningAmounts(row)
});

const isActiveOpening = (row: Record<string, unknown>) => {
  const status = (toString(row.status) ?? "").toLowerCase();
  if (status.includes("close")) {
    return false;
  }

  const docstatus = toNumber(row.docstatus);
  return docstatus !== 2;
};

const toModeSummary = (rows: Array<{ mode_of_payment: string; amount: number }>) => {
  const map = new Map<string, number>();
  rows.forEach((row) => {
    const key = row.mode_of_payment || "Cash";
    map.set(key, (map.get(key) ?? 0) + row.amount);
  });
  return Array.from(map.entries()).map(([mode_of_payment, amount]) => ({
    mode_of_payment,
    amount: Number(amount.toFixed(2))
  }));
};

export const posApi = frappeApi.injectEndpoints({
  endpoints: (builder) => ({
    listPosProfiles: builder.query<PosProfileLookup[], void>({
      async queryFn(_arg, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<QueryResult>;
        const fieldSets = [
          ["name", "company", "warehouse", "customer", "currency", "disabled"],
          ["name", "company", "warehouse", "disabled"],
          ["name", "disabled"],
          ["name"]
        ];

        let finalResult: QueryResult | null = null;
        for (const fields of fieldSets) {
          const result = await run({
            url: "/resource/POS Profile",
            method: "GET",
            params: {
              fields: encode(fields),
              order_by: "modified desc",
              limit_page_length: 100
            }
          });

          if (!hasError(result)) {
            finalResult = result;
            break;
          }
          finalResult = result;
        }

        if (!finalResult || hasError(finalResult)) {
          return { error: toError(finalResult?.error) };
        }

        const rows = (finalResult.data as FrappeListResponse<Record<string, unknown>>).data;
        const mapped = rows
          .filter((row) => toNumber(row.disabled) !== 1)
          .map((row) => ({
            label: String(row.name ?? ""),
            value: String(row.name ?? ""),
            company: toString(row.company),
            warehouse: toString(row.warehouse),
            customer: toString(row.customer),
            currency: toString(row.currency)
          }));

        return { data: mapped };
      },
      providesTags: ["Lookups"]
    }),

    getActivePosSession: builder.query<PosSession | null, string | undefined>({
      async queryFn(userId, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<QueryResult>;
        const user = userId?.trim();
        const fields = [
          "name",
          "pos_profile",
          "company",
          "user",
          "owner",
          "status",
          "docstatus",
          "posting_date",
          "period_start_date",
          "opening_time",
          "remarks",
          "set_warehouse",
          "balance_details"
        ];
        const fallbackFields = ["name", "pos_profile", "company", "user", "owner", "docstatus", "posting_date", "creation"];
        const userFilters: unknown[][] = user
          ? [["user", "=", user], ["owner", "=", user]]
          : [];

        const attempts = [
          {
            fields,
            filters: [["docstatus", "!=", 2]],
            ...(userFilters.length ? { or_filters: userFilters } : {})
          },
          {
            fields: fallbackFields,
            filters: [["docstatus", "!=", 2]],
            ...(userFilters.length ? { or_filters: userFilters } : {})
          },
          {
            fields: fallbackFields,
            filters: [] as unknown[][]
          }
        ];

        for (const attempt of attempts) {
          const result = await run({
            url: "/resource/POS Opening Entry",
            method: "GET",
            params: {
              fields: encode(attempt.fields),
              ...(attempt.filters.length ? { filters: encode(attempt.filters) } : {}),
              ...(("or_filters" in attempt && attempt.or_filters?.length) ? { or_filters: encode(attempt.or_filters) } : {}),
              order_by: "modified desc",
              limit_page_length: 30
            }
          });

          if (hasError(result)) {
            continue;
          }

          const rows = (result.data as FrappeListResponse<Record<string, unknown>>).data;
          const active = rows.find((row) => isActiveOpening(row));
          if (!active) {
            continue;
          }

          const profileName = toString(active.pos_profile);
          let profile: PosProfileLookup | undefined;
          if (profileName) {
            const profileResult = await run({
              url: `/resource/POS Profile/${encodeURIComponent(profileName)}`,
              method: "GET"
            });
            if (!hasError(profileResult)) {
              const profileRow = (profileResult.data as FrappeDocResponse<Record<string, unknown>>).data;
              profile = {
                label: profileName,
                value: profileName,
                company: toString(profileRow.company),
                warehouse: toString(profileRow.warehouse),
                customer: toString(profileRow.customer),
                currency: toString(profileRow.currency)
              };
            }
          }

          return { data: toPosSession(active, profile) };
        }

        return { data: null };
      },
      providesTags: ["Lookups"]
    }),

    createPosOpeningEntry: builder.mutation<PosSession, PosOpeningEntryPayload>({
      async queryFn(payload, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<QueryResult>;
        const startDate = new Date().toISOString();
        const docPayload = {
          doctype: "POS Opening Entry",
          pos_profile: payload.pos_profile,
          company: payload.company,
          posting_date: toDateOnly(startDate),
          period_start_date: toIsoDateTime(startDate),
          remarks: toString(payload.remarks),
          balance_details: [
            {
              mode_of_payment: "Cash",
              opening_amount: Math.max(toNumber(payload.opening_cash), 0)
            }
          ]
        };

        const createResult = await run({
          url: "/resource/POS Opening Entry",
          method: "POST",
          data: docPayload
        });
        if (hasError(createResult)) {
          return { error: toError(createResult.error) };
        }

        const created = (createResult.data as FrappeDocResponse<Record<string, unknown>>).data;
        const name = toString(created.name);
        if (name) {
          const submitResult = await submitDocByName<Record<string, unknown>>(run, "POS Opening Entry", name);
          if (typeof submitResult === "object" && submitResult !== null && "error" in submitResult) {
            // Keep going; in some setups the document is already submitted on create.
          }
        }

        const sessionResult = await run({
          url: `/resource/POS Opening Entry/${encodeURIComponent(name ?? "")}`,
          method: "GET"
        });
        if (hasError(sessionResult)) {
          return {
            data: toPosSession(created, {
              label: payload.pos_profile,
              value: payload.pos_profile,
              company: payload.company
            })
          };
        }

        const row = (sessionResult.data as FrappeDocResponse<Record<string, unknown>>).data;
        return {
          data: toPosSession(row, {
            label: payload.pos_profile,
            value: payload.pos_profile,
            company: payload.company
          })
        };
      },
      invalidatesTags: ["Lookups"]
    }),

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

        // Some ERPNext sites do not expose optional fields like barcode/gst_hsn_code/standard_rate.
        // Try richest field sets first, then fall back to a safe minimal set.
        const fieldSets = [
          ["name", "item_code", "item_name", "stock_uom", "standard_rate", "barcode", "variant_of", "gst_hsn_code"],
          ["name", "item_code", "item_name", "stock_uom", "standard_rate", "variant_of", "gst_hsn_code"],
          ["name", "item_code", "item_name", "stock_uom", "variant_of", "barcode"],
          ["name", "item_code", "item_name", "stock_uom", "variant_of"]
        ];

        let finalResult: QueryResult | null = null;
        for (const fields of fieldSets) {
          const result = await run({
            url: "/resource/Item",
            method: "GET",
            params: {
              fields: encode(fields),
              filters: encode([["disabled", "=", 0]]),
              ...(fields.includes("barcode")
                ? (primaryOrFilters.length ? { or_filters: encode(primaryOrFilters) } : {})
                : (fallbackOrFilters.length ? { or_filters: encode(fallbackOrFilters) } : {})),
              order_by: "modified desc",
              limit_page_length: 40
            }
          });

          if (!hasError(result)) {
            finalResult = result;
            break;
          }
          finalResult = result;
        }

        if (!finalResult || hasError(finalResult)) {
          return { error: toError(finalResult?.error) };
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

    getPosItemSellingRate: builder.query<number | null, string>({
      async queryFn(itemCode, _api, _extra, baseQuery) {
        const safeItemCode = itemCode?.trim();
        if (!safeItemCode) {
          return { data: null };
        }

        const run = (arg: QueryArg) => baseQuery(arg) as Promise<QueryResult | Record<string, unknown> | undefined>;

        try {
          const result = await run({
            url: "/resource/Item Price",
            method: "GET",
            params: {
              fields: encode(["price_list_rate", "price_list", "modified"]),
              filters: encode([["item_code", "=", safeItemCode], ["selling", "=", 1]]),
              order_by: "modified desc",
              limit_page_length: 25
            }
          });

          if (!result || typeof result !== "object") {
            return { data: null };
          }
          if ("error" in result) {
            return { data: null };
          }
          if (!("data" in result)) {
            return { data: null };
          }

          const payload = result.data as FrappeListResponse<Record<string, unknown>> | undefined;
          const rows = Array.isArray(payload?.data) ? payload.data : [];
          if (!rows.length) {
            return { data: null };
          }

          const ranked = rows
            .map((row) => ({
              rate: toNumber(row.price_list_rate),
              priceList: toString(row.price_list)
            }))
            .filter((row) => row.rate > 0);

          if (!ranked.length) {
            return { data: null };
          }

          const standardSelling = ranked.find((row) => row.priceList?.toLowerCase() === "standard selling");
          return { data: standardSelling?.rate ?? ranked[0]?.rate ?? null };
        } catch {
          return { data: null };
        }
      }
    }),

    searchPosHsCodes: builder.query<PosHsCodeLookup[], string | undefined>({
      async queryFn(search, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<QueryResult>;
        const token = search?.trim();
        const doctypes = hsCodeDoctypesByPriority.filter((doctype) => !unavailableHsCodeDoctypes.has(doctype));

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
            if (result.error.status === 404) {
              unavailableHsCodeDoctypes.add(doctype);
            }
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

    getPosSessionSummary: builder.query<PosSessionSummary, string>({
      async queryFn(openingEntryName, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<QueryResult>;
        const openingResult = await run({
          url: `/resource/POS Opening Entry/${encodeURIComponent(openingEntryName)}`,
          method: "GET"
        });

        if (hasError(openingResult)) {
          return { error: toError(openingResult.error) };
        }

        const opening = (openingResult.data as FrappeDocResponse<Record<string, unknown>>).data;
        const openingAmounts = toOpeningAmounts(opening);
        const openingTotal = openingAmounts.reduce((sum, row) => sum + row.opening_amount, 0);

        const invoiceResult = await run({
          url: "/resource/Sales Invoice",
          method: "GET",
          params: {
            fields: encode(["name", "grand_total", "base_grand_total", "rounded_total"]),
            filters: encode([["docstatus", "=", 1], ["is_pos", "=", 1], ["pos_opening_entry", "=", openingEntryName]]),
            order_by: "modified desc",
            limit_page_length: 500
          }
        });

        const invoices = hasError(invoiceResult)
          ? []
          : (invoiceResult.data as FrappeListResponse<Record<string, unknown>>).data;

        const paymentRows = await Promise.all(
          invoices.map(async (invoice) => {
            const invoiceName = toString(invoice.name);
            if (!invoiceName) {
              return [] as Array<{ mode_of_payment: string; amount: number }>;
            }

            const paymentResult = await run({
              url: "/resource/Sales Invoice Payment",
              method: "GET",
              params: {
                fields: encode(["mode_of_payment", "amount"]),
                filters: encode([["parent", "=", invoiceName]]),
                limit_page_length: 25
              }
            });

            if (hasError(paymentResult)) {
              return [] as Array<{ mode_of_payment: string; amount: number }>;
            }

            return ((paymentResult.data as FrappeListResponse<Record<string, unknown>>).data ?? []).map((row) => ({
              mode_of_payment: toString(row.mode_of_payment) ?? "Cash",
              amount: toNumber(row.amount)
            }));
          })
        );

        const totalSales = invoices.reduce(
          (sum, row) => sum + (toNumber(row.grand_total) || toNumber(row.base_grand_total) || toNumber(row.rounded_total)),
          0
        );
        const totalsByMode = toModeSummary(paymentRows.flat());
        const totalCashSales = totalsByMode
          .filter((row) => row.mode_of_payment.toLowerCase().includes("cash"))
          .reduce((sum, row) => sum + row.amount, 0);
        const openingCash = openingAmounts
          .filter((row) => row.mode_of_payment.toLowerCase().includes("cash"))
          .reduce((sum, row) => sum + row.opening_amount, 0);

        return {
          data: {
            opening_entry: openingEntryName,
            pos_profile: toString(opening.pos_profile) ?? "",
            company: toString(opening.company),
            opening_time: toString(opening.period_start_date) ?? toString(opening.creation),
            opening_amount_total: Number(openingTotal.toFixed(2)),
            opening_amount_by_mode: openingAmounts,
            invoice_count: invoices.length,
            total_sales: Number(totalSales.toFixed(2)),
            totals_by_mode: totalsByMode,
            expected_closing_cash: Number((openingCash + totalCashSales).toFixed(2))
          }
        };
      },
      providesTags: ["Lookups"]
    }),

    createPosClosingEntry: builder.mutation<{ name?: string; status?: string }, PosClosingEntryPayload>({
      async queryFn(payload, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<QueryResult>;
        const openingResult = await run({
          url: `/resource/POS Opening Entry/${encodeURIComponent(payload.pos_opening_entry)}`,
          method: "GET"
        });

        if (hasError(openingResult)) {
          return { error: toError(openingResult.error) };
        }

        const opening = (openingResult.data as FrappeDocResponse<Record<string, unknown>>).data;
        const reconciliationRows = payload.actual_amounts.map((row) => ({
          mode_of_payment: row.mode_of_payment,
          amount: Math.max(toNumber(row.amount), 0),
          closing_amount: Math.max(toNumber(row.amount), 0)
        }));

        const closePayload = {
          doctype: "POS Closing Entry",
          pos_opening_entry: payload.pos_opening_entry,
          pos_profile: toString(opening.pos_profile),
          company: toString(opening.company),
          posting_date: toDateOnly(),
          period_end_date: toIsoDateTime(),
          remarks: toString(payload.remarks),
          payment_reconciliation: reconciliationRows
        };

        const createResult = await run({
          url: "/resource/POS Closing Entry",
          method: "POST",
          data: closePayload
        });
        if (hasError(createResult)) {
          return { error: toError(createResult.error) };
        }

        const created = (createResult.data as FrappeDocResponse<Record<string, unknown>>).data;
        const name = toString(created.name);
        if (name) {
          const submitResult = await submitDocByName<Record<string, unknown>>(run, "POS Closing Entry", name);
          if (typeof submitResult === "object" && submitResult !== null && "error" in submitResult) {
            return { error: toError(submitResult.error) };
          }
        }

        return {
          data: {
            name,
            status: toString(created.status)
          }
        };
      },
      invalidatesTags: ["Lookups"]
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
  useListPosProfilesQuery,
  useGetActivePosSessionQuery,
  useCreatePosOpeningEntryMutation,
  useSearchPosItemsQuery,
  useLazySearchPosItemsQuery,
  useLazyGetPosItemMetaQuery,
  useLazyGetPosItemSellingRateQuery,
  useSearchPosHsCodesQuery,
  useListPosCustomersQuery,
  useListPosPaymentModesQuery,
  useLazyGetItemStockQtyQuery,
  useGetPosSessionSummaryQuery,
  useCreatePosClosingEntryMutation,
  useCreatePosInvoiceMutation,
  useUpdatePosInvoiceMutation,
  useSubmitPosInvoiceMutation
} = posApi;
