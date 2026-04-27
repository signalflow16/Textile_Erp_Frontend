export type PosLookupOption = {
  label: string;
  value: string;
};

export type PosItemLookup = PosLookupOption & {
  item_name?: string;
  stock_uom?: string;
  standard_rate?: number;
  barcode?: string;
  variant_of?: string;
  hs_code?: string;
  color?: string;
  size?: string;
  design?: string;
};

export type PosCustomerLookup = PosLookupOption & {
  customer_name?: string;
};

export type PosPaymentMode = PosLookupOption;
export type PosHsCodeLookup = PosLookupOption;
export type PosProfileLookup = PosLookupOption & {
  company?: string;
  warehouse?: string;
  customer?: string;
  currency?: string;
};

export type PosOpeningAmountRow = {
  mode_of_payment: string;
  opening_amount: number;
};

export type PosSession = {
  name: string;
  pos_profile: string;
  company?: string;
  user?: string;
  status?: string;
  opening_time?: string;
  closing_time?: string;
  posting_date?: string;
  remarks?: string;
  warehouse?: string;
  default_customer?: string;
  opening_amounts: PosOpeningAmountRow[];
};

export type PosDiscountMode = "item" | "overall" | "both";

export type PosOpeningEntryPayload = {
  pos_profile: string;
  company?: string;
  user?: string;
  opening_cash: number;
  remarks?: string;
};

export type PosClosingAmountRow = {
  mode_of_payment: string;
  expected_amount: number;
  actual_amount: number;
  difference: number;
};

export type PosSessionSummary = {
  opening_entry: string;
  pos_profile: string;
  company?: string;
  opening_time?: string;
  opening_amount_total: number;
  opening_amount_by_mode: PosOpeningAmountRow[];
  invoice_count: number;
  total_sales: number;
  totals_by_mode: Array<{ mode_of_payment: string; amount: number }>;
  expected_closing_cash: number;
};

export type PosClosingEntryPayload = {
  pos_opening_entry: string;
  actual_amounts: Array<{ mode_of_payment: string; amount: number }>;
  remarks?: string;
};

export type PosCartItem = {
  rowId: string;
  item_code: string;
  item_name?: string;
  hs_code?: string;
  uom: string;
  qty: number;
  rate: number;
  discount_percentage: number;
  discount_amount: number;
  warehouse?: string;
  barcode?: string;
  variant_of?: string;
  color?: string;
  size?: string;
  design?: string;
  available_qty?: number;
};

export type PosTotals = {
  totalItems: number;
  subtotal: number;
  itemDiscountTotal: number;
  netSubtotal: number;
  overallDiscountTotal: number;
  discountTotal: number;
  grandTotal: number;
};

export type PosInvoiceDoc = {
  name?: string;
  customer: string;
  posting_date: string;
  due_date?: string;
  is_pos: 1;
  update_stock?: 1;
  pos_profile?: string;
  pos_opening_entry?: string;
  set_warehouse?: string;
  remarks?: string;
  mode_of_payment?: string;
  paid_amount?: number;
  additional_discount_percentage?: number;
  apply_discount_on?: string;
  items: Array<{
    item_code: string;
    item_name?: string;
    qty: number;
    uom?: string;
    rate: number;
    gst_hsn_code?: string;
    discount_percentage?: number;
    discount_amount?: number;
    barcode?: string;
    warehouse?: string;
  }>;
  payments?: Array<{
    mode_of_payment: string;
    amount: number;
  }>;
  docstatus?: 0 | 1 | 2;
  status?: string;
};

export type PosFormState = {
  customer: string;
  pos_profile?: string;
  pos_opening_entry?: string;
  set_warehouse?: string;
  mode_of_payment?: string;
  paid_amount?: number;
  remarks?: string;
  posting_date: string;
  discount_enabled: boolean;
  discount_mode: PosDiscountMode;
  overall_discount_percentage: number;
};

export type PosDraftInvoiceLookup = {
  label: string;
  value: string;
  customer?: string;
  posting_date?: string;
  grand_total?: number;
  modified?: string;
  status?: string;
};
