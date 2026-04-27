import type { LookupOption } from "@/modules/stock/types/item";

export type FrappeListPayload<T> = {
  data: T[];
};

export type FrappeDocumentPayload<T> = {
  data: T;
};

export type FrappeDocField = {
  fieldname?: string;
  label?: string;
};

export type MasterDataRequestState = "idle" | "loading" | "succeeded" | "failed";

export type ItemMasterRow = {
  name: string;
  item_code: string;
  item_name?: string | null;
  item_group?: string | null;
  stock_uom?: string | null;
  variant_of?: string | null;
  has_variants?: 0 | 1;
  has_batch_no?: 0 | 1;
  disabled?: 0 | 1;
  modified?: string | null;
};

export type ItemCreateValues = {
  item_code: string;
  item_name: string;
  item_group: string;
  stock_uom: string;
  fabric_type?: string;
  color?: string;
  gsm?: number;
};

export type ItemFormLookups = {
  itemGroups: LookupOption[];
  uoms: LookupOption[];
};

export type ItemFieldAvailability = {
  fabric_type: boolean;
  color: boolean;
  gsm: boolean;
};

export type WarehouseRow = {
  name: string;
  warehouse_name?: string | null;
  parent_warehouse?: string | null;
  company?: string | null;
  is_group?: 0 | 1;
  disabled?: 0 | 1;
  modified?: string | null;
};

export type WarehouseNode = WarehouseRow & {
  title: string;
  key: string;
  children: WarehouseNode[];
  depth: number;
};

export type WarehouseCreateValues = {
  warehouse_name: string;
  parent_warehouse?: string;
  company?: string;
  is_group?: boolean;
};

export type SupplierRow = {
  name: string;
  supplier_name?: string | null;
  supplier_group?: string | null;
  supplier_type?: string | null;
  mobile_no?: string | null;
  email_id?: string | null;
  gstin?: string | null;
  modified?: string | null;
};

export type CustomerRow = {
  name: string;
  customer_name?: string | null;
  customer_group?: string | null;
  territory?: string | null;
  mobile_no?: string | null;
  email_id?: string | null;
  gstin?: string | null;
  modified?: string | null;
};

export type SupplierCreateValues = {
  supplier_name: string;
  supplier_group: string;
  supplier_type: string;
  mobile_no?: string;
  email_id?: string;
  gstin?: string;
};

export type CustomerCreateValues = {
  customer_name: string;
  customer_group: string;
  territory: string;
  mobile_no?: string;
  email_id?: string;
  gstin?: string;
};

export type PartyCreatePayload =
  | { type: "supplier"; values: SupplierCreateValues }
  | { type: "customer"; values: CustomerCreateValues };

export type LookupState = {
  companies: LookupOption[];
};

export type PartyLookups = {
  supplierGroups: LookupOption[];
  customerGroups: LookupOption[];
  territories: LookupOption[];
};
