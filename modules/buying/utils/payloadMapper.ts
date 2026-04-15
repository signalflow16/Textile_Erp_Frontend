import type {
  BuyingItemRow,
  MaterialRequestDoc,
  PurchaseInvoiceDoc,
  PurchaseOrderDoc,
  PurchaseReceiptDoc,
  RequestForQuotationDoc,
  SupplierQuotationDoc
} from "@/modules/buying/types/buying";

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

const mapItems = (items: BuyingItemRow[]) =>
  items
    .filter((item) => clean(item.item_code) && Number(item.qty) > 0)
    .map((item) => ({
      item_code: clean(item.item_code),
      qty: Number(item.qty),
      uom: clean(item.uom),
      conversion_factor: toNumberOrFallback(item.conversion_factor, 1),
      warehouse: clean(item.warehouse),
      schedule_date: clean(item.schedule_date),
      description: clean(item.description),
      rate: item.rate === undefined || item.rate === null ? undefined : Number(item.rate),
      amount: item.amount === undefined || item.amount === null ? undefined : Number(item.amount),
      received_qty: item.received_qty === undefined || item.received_qty === null ? undefined : Number(item.received_qty),
      rejected_qty: item.rejected_qty === undefined || item.rejected_qty === null ? undefined : Number(item.rejected_qty),
      batch_no: clean(item.batch_no)
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

export const mapMaterialRequestPayload = (doc: MaterialRequestDoc) =>
  cleanPayload({
    company: clean(doc.company),
    material_request_type: doc.material_request_type,
    transaction_date: clean(doc.transaction_date),
    schedule_date: clean(doc.schedule_date),
    set_warehouse: clean(doc.set_warehouse),
    items: mapItems(doc.items)
  });

export const mapRfqPayload = (doc: RequestForQuotationDoc) =>
  cleanPayload({
    company: clean(doc.company),
    transaction_date: clean(doc.transaction_date),
    message_for_supplier: clean(doc.message_for_supplier),
    items: mapItems(doc.items),
    suppliers: (doc.suppliers ?? []).filter((entry) => clean(entry.supplier)).map((entry) => ({ supplier: clean(entry.supplier) }))
  });

export const mapSupplierQuotationPayload = (doc: SupplierQuotationDoc) =>
  cleanPayload({
    supplier: clean(doc.supplier),
    company: clean(doc.company),
    transaction_date: clean(doc.transaction_date),
    terms: clean(doc.terms),
    items: mapItems(doc.items)
  });

export const mapPurchaseOrderPayload = (doc: PurchaseOrderDoc) =>
  cleanPayload({
    supplier: clean(doc.supplier),
    company: clean(doc.company),
    schedule_date: clean(doc.schedule_date),
    set_warehouse: clean(doc.set_warehouse),
    buying_price_list: clean(doc.buying_price_list),
    taxes_and_charges: clean(doc.taxes_and_charges),
    items: mapItems(doc.items)
  });

export const mapPurchaseReceiptPayload = (doc: PurchaseReceiptDoc) =>
  cleanPayload({
    supplier: clean(doc.supplier),
    company: clean(doc.company),
    posting_date: clean(doc.posting_date),
    posting_time: clean(doc.posting_time),
    set_warehouse: clean(doc.set_warehouse),
    items: mapItems(doc.items)
  });

export const mapPurchaseInvoicePayload = (doc: PurchaseInvoiceDoc) =>
  cleanPayload({
    supplier: clean(doc.supplier),
    company: clean(doc.company),
    posting_date: clean(doc.posting_date),
    due_date: clean(doc.due_date),
    bill_no: clean(doc.bill_no),
    credit_to: clean(doc.credit_to),
    taxes_and_charges: clean(doc.taxes_and_charges),
    items: mapItems(doc.items)
  });
