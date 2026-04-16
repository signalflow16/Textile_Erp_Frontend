import type { DeliveryNoteDoc, QuotationDoc, SalesOrderDoc, SellingItemRow } from "@/modules/selling/types/selling";

const today = () => new Date().toISOString().slice(0, 10);
const nowTime = () => new Date().toTimeString().slice(0, 8);
const nextMonth = () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

const toItemRows = (items: unknown, options?: { withRate?: boolean; withSourceRefs?: boolean }) =>
  Array.isArray(items)
    ? items.map((item) => {
        const row = item as Partial<SellingItemRow>;
        return {
          item_code: typeof row.item_code === "string" ? row.item_code : undefined,
          qty: Number(row.qty ?? 1),
          uom: typeof row.uom === "string" ? row.uom : undefined,
          conversion_factor:
            typeof row.conversion_factor === "number" && Number.isFinite(row.conversion_factor) ? row.conversion_factor : 1,
          warehouse: typeof row.warehouse === "string" ? row.warehouse : undefined,
          delivery_date: typeof row.delivery_date === "string" ? row.delivery_date : undefined,
          description: typeof row.description === "string" ? row.description : undefined,
          ...(options?.withRate && typeof row.rate === "number"
            ? {
                rate: row.rate,
                amount: typeof row.amount === "number" ? row.amount : Number(row.qty ?? 0) * row.rate
              }
            : {}),
          ...(options?.withSourceRefs
            ? {
                quotation: typeof row.quotation === "string" ? row.quotation : undefined,
                sales_order: typeof row.sales_order === "string" ? row.sales_order : undefined,
                so_detail: typeof row.so_detail === "string" ? row.so_detail : typeof row.name === "string" ? row.name : undefined
              }
            : {})
        };
      })
    : [];

export const quotationToSalesOrder = (source: QuotationDoc): Partial<SalesOrderDoc> => ({
  customer: source.party_name || source.customer || "",
  company: source.company,
  transaction_date: today(),
  delivery_date: source.valid_till ?? nextMonth(),
  selling_price_list: source.selling_price_list,
  taxes_and_charges: source.taxes_and_charges,
  quotation: source.name,
  remarks: source.remarks,
  items: toItemRows(source.items, { withRate: true, withSourceRefs: true }) as unknown as SalesOrderDoc["items"]
});

export const salesOrderToDeliveryNote = (source: SalesOrderDoc): Partial<DeliveryNoteDoc> => ({
  customer: source.customer,
  company: source.company,
  posting_date: today(),
  posting_time: nowTime(),
  set_warehouse: source.set_warehouse,
  sales_order: source.name,
  remarks: source.remarks,
  items: toItemRows(
    (source.items ?? []).map((item) => ({
      ...item,
      sales_order: source.name,
      so_detail: item.name
    })),
    { withRate: true, withSourceRefs: true }
  ) as unknown as DeliveryNoteDoc["items"]
});
