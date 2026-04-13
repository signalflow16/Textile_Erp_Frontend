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
  set_warehouse?: string;
  remarks?: string;
  mode_of_payment?: string;
  paid_amount?: number;
  items: Array<{
    item_code: string;
    qty: number;
    uom?: string;
    rate: number;
    gst_hsn_code?: string;
    discount_percentage?: number;
    discount_amount?: number;
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
  set_warehouse?: string;
  mode_of_payment?: string;
  paid_amount?: number;
  remarks?: string;
  posting_date: string;
};
