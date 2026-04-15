export type BuyingDocType =
  | "Material Request"
  | "Request for Quotation"
  | "Supplier Quotation"
  | "Purchase Order"
  | "Purchase Receipt"
  | "Purchase Invoice";

export type BuyingRouteKey =
  | "material-requests"
  | "rfqs"
  | "supplier-quotations"
  | "purchase-orders"
  | "purchase-receipts"
  | "purchase-invoices";

export type LookupOption = {
  label: string;
  value: string;
};

export type BuyingDocStatus = 0 | 1 | 2;

export type BuyingDocumentSummary = {
  name: string;
  supplier?: string;
  company?: string;
  status?: string;
  docstatus?: BuyingDocStatus;
  transaction_date?: string;
  posting_date?: string;
  schedule_date?: string;
  modified?: string;
  grand_total?: number;
  outstanding_amount?: number;
};

export type BuyingListResult<T> = {
  data: T[];
  total_count: number;
};

export type BuyingListParams = {
  page: number;
  pageSize: number;
  search?: string;
  company?: string;
  supplier?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "modified_desc" | "modified_asc";
};

export type BuyingItemRow = {
  name?: string;
  item_code: string;
  item_name?: string;
  description?: string;
  qty: number;
  uom: string;
  conversion_factor?: number;
  warehouse?: string;
  schedule_date?: string;
  rate?: number;
  amount?: number;
  received_qty?: number;
  rejected_qty?: number;
  batch_no?: string;
};

export type MaterialRequestDoc = {
  name?: string;
  company: string;
  material_request_type: "Purchase" | "Material Transfer" | "Material Issue" | "Customer Provided";
  transaction_date: string;
  schedule_date?: string;
  set_warehouse?: string;
  status?: string;
  docstatus?: BuyingDocStatus;
  modified?: string;
  items: BuyingItemRow[];
};

export type RequestForQuotationDoc = {
  name?: string;
  company: string;
  transaction_date: string;
  message_for_supplier?: string;
  status?: string;
  docstatus?: BuyingDocStatus;
  modified?: string;
  items: BuyingItemRow[];
  suppliers?: Array<{ supplier: string }>;
};

export type SupplierQuotationDoc = {
  name?: string;
  supplier: string;
  company: string;
  transaction_date: string;
  terms?: string;
  status?: string;
  docstatus?: BuyingDocStatus;
  modified?: string;
  items: BuyingItemRow[];
};

export type PurchaseOrderDoc = {
  name?: string;
  supplier: string;
  company: string;
  schedule_date?: string;
  set_warehouse?: string;
  buying_price_list?: string;
  taxes_and_charges?: string;
  status?: string;
  docstatus?: BuyingDocStatus;
  modified?: string;
  grand_total?: number;
  items: BuyingItemRow[];
};

export type PurchaseReceiptDoc = {
  name?: string;
  supplier: string;
  company: string;
  posting_date: string;
  posting_time?: string;
  set_warehouse?: string;
  status?: string;
  docstatus?: BuyingDocStatus;
  modified?: string;
  grand_total?: number;
  items: BuyingItemRow[];
};

export type PurchaseInvoiceDoc = {
  name?: string;
  supplier: string;
  company: string;
  posting_date: string;
  due_date?: string;
  bill_no?: string;
  credit_to?: string;
  taxes_and_charges?: string;
  status?: string;
  docstatus?: BuyingDocStatus;
  modified?: string;
  grand_total?: number;
  outstanding_amount?: number;
  items: BuyingItemRow[];
};

export type BuyingMasters = {
  items: LookupOption[];
  suppliers: LookupOption[];
  warehouses: LookupOption[];
  companies: LookupOption[];
  uoms: LookupOption[];
};

export type BuyingDashboardSummary = {
  pending_material_requests: number;
  pending_rfqs: number;
  pending_supplier_quotations: number;
  pending_purchase_orders: number;
  pending_purchase_receipts: number;
  pending_purchase_invoices: number;
  recent_documents: Array<BuyingDocumentSummary & { doctype: BuyingDocType }>;
};
