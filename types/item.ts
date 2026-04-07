export type ItemRow = {
  item_code: string;
  item_name: string;
  item_group: string;
  brand?: string | null;
  variant_of?: string | null;
  stock_uom: string;
  disabled: 0 | 1;
  is_stock_item: 0 | 1;
  has_variants: 0 | 1;
  modified: string;
};

export type ItemListResponse = {
  data: ItemRow[];
  total_count: number;
};

export type ItemDocument = {
  name?: string;
  item_code: string;
  item_name?: string;
  item_group: string;
  stock_uom: string;
  disabled: 0 | 1;
  is_stock_item: 0 | 1;
  has_variants: 0 | 1;
  variant_of?: string;
  standard_rate?: number;
  description?: string;
  brand?: string;
  style_code?: string;
  collection?: string;
  season?: string;
  fabric_type?: string;
  display_category?: string;
  shelf_rack_code?: string;
  primary_store?: string;
  allow_alternative_item?: 0 | 1;
  is_fixed_asset?: 0 | 1;
  valuation_rate?: number;
  over_delivery_receipt_allowance?: number;
  over_billing_allowance?: number;
  shelf_life_in_days?: number;
  end_of_life?: string;
  warranty_period?: number;
  weight_per_unit?: number;
  weight_uom?: string;
  default_material_request_type?: string;
  valuation_method?: string;
  allow_negative_stock?: 0 | 1;
  allow_purchase?: 0 | 1;
  min_order_qty?: number;
  safety_stock?: number;
  lead_time_days?: number;
  last_purchase_rate?: number;
  customer_provided_item?: 0 | 1;
  grant_commission?: 0 | 1;
  allow_sales?: 0 | 1;
  max_discount?: number;
  inspection_required_before_purchase?: 0 | 1;
  inspection_required_before_delivery?: 0 | 1;
  quality_inspection_template?: string;
  barcodes?: ItemBarcode[];
  item_defaults?: ItemDefaultRow[];
  taxes?: ItemTaxRow[];
};

export type ItemBarcode = {
  barcode: string;
  barcode_type?: string;
  uom?: string;
};

export type ItemDefaultRow = {
  company: string;
  default_warehouse?: string;
  default_price_list?: string;
};

export type ItemTaxRow = {
  item_tax_template: string;
  tax_category?: string;
  valid_from?: string;
  minimum_net_rate?: number;
  maximum_net_rate?: number;
};

export type LookupOption = {
  label: string;
  value: string;
};

export type ItemMasterLookups = {
  item_groups: LookupOption[];
  uoms: LookupOption[];
  brands: LookupOption[];
};

export type ItemListParams = {
  page: number;
  pageSize: number;
  search?: string;
  itemCode?: string;
  itemName?: string;
  itemGroup?: string;
  variantOf?: string;
  hasVariants?: "all" | "0" | "1";
  disabled?: "all" | "0" | "1";
  sortBy?: "modified_desc" | "modified_asc" | "item_code_asc" | "item_name_asc";
};
