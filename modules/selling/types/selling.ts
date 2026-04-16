export type SellingDocType = "Quotation" | "Sales Order" | "Delivery Note";

export type SellingRouteKey = "quotations" | "sales-orders" | "delivery-notes";

export type LookupOption = {
  label: string;
  value: string;
};

export type SellingDocStatus = 0 | 1 | 2;

export type SellingDocumentSummary = {
  name: string;
  customer?: string;
  company?: string;
  status?: string;
  docstatus?: SellingDocStatus;
  transaction_date?: string;
  posting_date?: string;
  delivery_date?: string;
  valid_till?: string;
  modified?: string;
  grand_total?: number;
};

export type SellingListResult<T> = {
  data: T[];
  total_count: number;
};

export type SellingListParams = {
  page: number;
  pageSize: number;
  search?: string;
  company?: string;
  customer?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "modified_desc" | "modified_asc";
};

export type SellingItemRow = {
  name?: string;
  item_code: string;
  item_name?: string;
  description?: string;
  qty: number;
  uom: string;
  conversion_factor?: number;
  warehouse?: string;
  delivery_date?: string;
  rate?: number;
  amount?: number;
  delivered_qty?: number;
  quotation?: string;
  sales_order?: string;
  so_detail?: string;
};

export type QuotationDoc = {
  name?: string;
  quotation_to: "Customer";
  party_name: string;
  customer?: string;
  company: string;
  transaction_date: string;
  valid_till?: string;
  order_type?: string;
  selling_price_list?: string;
  taxes_and_charges?: string;
  remarks?: string;
  status?: string;
  docstatus?: SellingDocStatus;
  modified?: string;
  grand_total?: number;
  items: SellingItemRow[];
};

export type SalesOrderDoc = {
  name?: string;
  customer: string;
  company: string;
  transaction_date: string;
  delivery_date?: string;
  set_warehouse?: string;
  selling_price_list?: string;
  taxes_and_charges?: string;
  quotation?: string;
  remarks?: string;
  status?: string;
  docstatus?: SellingDocStatus;
  modified?: string;
  grand_total?: number;
  items: SellingItemRow[];
};

export type DeliveryNoteDoc = {
  name?: string;
  customer: string;
  company: string;
  posting_date: string;
  posting_time?: string;
  set_warehouse?: string;
  sales_order?: string;
  remarks?: string;
  status?: string;
  docstatus?: SellingDocStatus;
  modified?: string;
  grand_total?: number;
  items: SellingItemRow[];
};

export type SellingMasters = {
  items: LookupOption[];
  customers: LookupOption[];
  warehouses: LookupOption[];
  companies: LookupOption[];
  uoms: LookupOption[];
};

export type SellingDashboardSummary = {
  draft_quotations: number;
  submitted_quotations: number;
  draft_sales_orders: number;
  submitted_sales_orders: number;
  draft_delivery_notes: number;
  submitted_delivery_notes: number;
  recent_documents: Array<SellingDocumentSummary & { doctype: SellingDocType }>;
};
