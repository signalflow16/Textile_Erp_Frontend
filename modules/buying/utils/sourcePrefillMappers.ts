import type {
  BuyingItemRow,
  MaterialRequestDoc,
  PurchaseInvoiceDoc,
  PurchaseOrderDoc,
  PurchaseReceiptDoc,
  RequestForQuotationDoc,
  SupplierQuotationDoc
} from "@/modules/buying/types/buying";

const today = () => new Date().toISOString().slice(0, 10);
const nextMonth = () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

const toItemRows = (items: unknown, options?: { withRate?: boolean; withAmount?: boolean }) =>
  Array.isArray(items)
    ? items.map((item) => {
        const row = item as Partial<BuyingItemRow>;
        return {
          item_code: typeof row.item_code === "string" ? row.item_code : undefined,
          qty: Number(row.qty ?? 1),
          uom: typeof row.uom === "string" ? row.uom : undefined,
          warehouse: typeof row.warehouse === "string" ? row.warehouse : undefined,
          schedule_date: typeof row.schedule_date === "string" ? row.schedule_date : undefined,
          description: typeof row.description === "string" ? row.description : undefined,
          ...(options?.withRate && typeof row.rate === "number" ? { rate: row.rate } : {}),
          ...(options?.withAmount && typeof row.amount === "number" ? { amount: row.amount } : {})
        };
      })
    : [];

export const materialRequestToRfq = (source: MaterialRequestDoc): Partial<RequestForQuotationDoc> => ({
  company: source.company,
  transaction_date: today(),
  items: toItemRows(source.items) as unknown as RequestForQuotationDoc["items"]
});

export const materialRequestToPurchaseOrder = (source: MaterialRequestDoc): Partial<PurchaseOrderDoc> => ({
  company: source.company,
  schedule_date: source.schedule_date ?? today(),
  set_warehouse: source.set_warehouse,
  items: toItemRows(source.items) as unknown as PurchaseOrderDoc["items"]
});

export const rfqToSupplierQuotation = (source: RequestForQuotationDoc): Partial<SupplierQuotationDoc> => ({
  company: source.company,
  supplier: Array.isArray(source.suppliers) && source.suppliers[0] ? source.suppliers[0].supplier : undefined,
  transaction_date: today(),
  items: toItemRows(source.items) as unknown as SupplierQuotationDoc["items"]
});

export const supplierQuotationToPurchaseOrder = (source: SupplierQuotationDoc): Partial<PurchaseOrderDoc> => ({
  company: source.company,
  supplier: source.supplier,
  schedule_date: today(),
  items: toItemRows(source.items, { withRate: true }) as unknown as PurchaseOrderDoc["items"]
});

export const purchaseOrderToPurchaseReceipt = (source: PurchaseOrderDoc): Partial<PurchaseReceiptDoc> => ({
  company: source.company,
  supplier: source.supplier,
  posting_date: today(),
  set_warehouse: source.set_warehouse,
  items: toItemRows(source.items, { withRate: true }) as unknown as PurchaseReceiptDoc["items"]
});

export const purchaseOrderToPurchaseInvoice = (source: PurchaseOrderDoc): Partial<PurchaseInvoiceDoc> => ({
  company: source.company,
  supplier: source.supplier,
  posting_date: today(),
  due_date: nextMonth(),
  items: toItemRows(source.items, { withRate: true, withAmount: true }) as unknown as PurchaseInvoiceDoc["items"]
});

export const purchaseReceiptToPurchaseInvoice = (source: PurchaseReceiptDoc): Partial<PurchaseInvoiceDoc> => ({
  company: source.company,
  supplier: source.supplier,
  posting_date: today(),
  due_date: nextMonth(),
  items: toItemRows(source.items, { withRate: true, withAmount: true }) as unknown as PurchaseInvoiceDoc["items"]
});
