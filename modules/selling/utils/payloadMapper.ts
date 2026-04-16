import type { DeliveryNoteDoc, QuotationDoc, SalesOrderDoc, SellingItemRow } from "@/modules/selling/types/selling";

const clean = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const toNumberOrFallback = (value: unknown, fallback: number) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
};

const mapItems = (items: SellingItemRow[]) =>
  items
    .filter((item) => clean(item.item_code) && Number(item.qty) > 0)
    .map((item) => ({
      item_code: clean(item.item_code),
      qty: Number(item.qty),
      uom: clean(item.uom),
      conversion_factor: toNumberOrFallback(item.conversion_factor, 1),
      warehouse: clean(item.warehouse),
      delivery_date: clean(item.delivery_date),
      description: clean(item.description),
      rate: item.rate === undefined || item.rate === null ? undefined : Number(item.rate),
      amount: item.amount === undefined || item.amount === null ? undefined : Number(item.amount),
      delivered_qty: item.delivered_qty === undefined || item.delivered_qty === null ? undefined : Number(item.delivered_qty),
      quotation: clean(item.quotation),
      sales_order: clean(item.sales_order),
      so_detail: clean(item.so_detail)
    }));

const cleanPayload = <T extends Record<string, unknown>>(payload: T) =>
  Object.fromEntries(
    Object.entries(payload).filter(([, value]) => {
      if (value === undefined || value === null || value === "") {
        return false;
      }

      if (Array.isArray(value)) {
        return value.length > 0;
      }

      return true;
    })
  );

export const mapQuotationPayload = (doc: QuotationDoc) =>
  cleanPayload({
    quotation_to: "Customer",
    party_name: clean(doc.party_name || doc.customer),
    customer: clean(doc.customer || doc.party_name),
    company: clean(doc.company),
    transaction_date: clean(doc.transaction_date),
    valid_till: clean(doc.valid_till),
    order_type: clean(doc.order_type),
    selling_price_list: clean(doc.selling_price_list),
    taxes_and_charges: clean(doc.taxes_and_charges),
    remarks: clean(doc.remarks),
    items: mapItems(doc.items)
  });

export const mapSalesOrderPayload = (doc: SalesOrderDoc) =>
  cleanPayload({
    customer: clean(doc.customer),
    company: clean(doc.company),
    transaction_date: clean(doc.transaction_date),
    delivery_date: clean(doc.delivery_date),
    set_warehouse: clean(doc.set_warehouse),
    selling_price_list: clean(doc.selling_price_list),
    taxes_and_charges: clean(doc.taxes_and_charges),
    quotation: clean(doc.quotation),
    remarks: clean(doc.remarks),
    items: mapItems(doc.items)
  });

export const mapDeliveryNotePayload = (doc: DeliveryNoteDoc) =>
  cleanPayload({
    customer: clean(doc.customer),
    company: clean(doc.company),
    posting_date: clean(doc.posting_date),
    posting_time: clean(doc.posting_time),
    set_warehouse: clean(doc.set_warehouse),
    sales_order: clean(doc.sales_order),
    remarks: clean(doc.remarks),
    items: mapItems(doc.items)
  });
