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
  barcodes?: ItemBarcode[];
};

export type ItemBarcode = {
  barcode: string;
  barcode_type?: string;
  uom?: string;
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
