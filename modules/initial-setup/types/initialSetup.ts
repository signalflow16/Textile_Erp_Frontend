import type { ApiEnvelope } from "@/types/auth";

export type SetupUiStatus = "not_started" | "in_progress" | "completed" | "failed";

export type SetupSectionKey =
  | "company"
  | "warehouses"
  | "uoms"
  | "item_groups"
  | "suppliers"
  | "customers";

export type SectionOutcome = "created" | "skipped" | "failed" | "completed" | "not_started";

export type CompanySetupPayload = {
  company_name: string;
  abbreviation: string;
  default_currency: string;
  country: string;
};

export type WarehouseNode = {
  warehouse_name: string;
  children?: WarehouseNode[];
};

export type WarehousesSetupPayload = {
  company: string;
  warehouses: WarehouseNode[];
};

export type UomRow = {
  uom_name: string;
  must_be_whole_number: 0 | 1;
};

export type UomsSetupPayload = {
  uoms: UomRow[];
};

export type ItemGroupNode = {
  item_group_name: string;
  children?: ItemGroupNode[];
};

export type ItemGroupsSetupPayload = {
  item_groups: ItemGroupNode[];
};

export type SupplierRow = {
  supplier_name: string;
  supplier_group: string;
  supplier_type: string;
  mobile_no?: string;
  email_id?: string;
  gstin?: string;
};

export type SuppliersSetupPayload = {
  suppliers: SupplierRow[];
};

export type CustomerRow = {
  customer_name: string;
  customer_group: string;
  territory: string;
  mobile_no?: string;
  email_id?: string;
  gstin?: string;
};

export type CustomersSetupPayload = {
  customers: CustomerRow[];
};

export type InitialSetupPayload = {
  company: CompanySetupPayload;
  warehouses: WarehousesSetupPayload;
  uoms: UomRow[];
  item_groups: ItemGroupsSetupPayload;
  suppliers: SuppliersSetupPayload;
  customers: CustomersSetupPayload;
};

export type SetupSectionStatus = {
  status?: string;
  message?: string;
  code?: string;
  last_updated_on?: string;
  details?: Record<string, unknown> | null;
  [key: string]: unknown;
};

export type SetupStatusData = {
  status?: string;
  sections?: Partial<Record<SetupSectionKey, SetupSectionStatus>>;
  readiness?: Record<string, unknown>;
  message?: string;
  [key: string]: unknown;
};

export type MasterCountsData = {
  company_count?: number;
  warehouse_count?: number;
  uom_count?: number;
  item_group_count?: number;
  supplier_count?: number;
  customer_count?: number;
  [key: string]: unknown;
};

export type ReadinessData = {
  ready?: boolean;
  is_ready?: boolean;
  can_create_items?: boolean;
  missing_sections?: string[];
  message?: string;
  [key: string]: unknown;
};

export type SetupActionResponseData = {
  sections?: Partial<Record<SetupSectionKey, Record<string, unknown>>>;
  summary?: Record<string, unknown>;
  [key: string]: unknown;
};

export type InitialSetupEnvelope<T> = ApiEnvelope<T>;

export type SetupStatusResponse = InitialSetupEnvelope<SetupStatusData>;
export type MasterCountsResponse = InitialSetupEnvelope<MasterCountsData>;
export type SetupReadinessResponse = InitialSetupEnvelope<ReadinessData>;
export type SetupMutationResponse = InitialSetupEnvelope<SetupActionResponseData>;

export type CompanyFormValues = CompanySetupPayload;

export type WarehouseFormNode = {
  warehouse_name: string;
  children: WarehouseFormNode[];
};

export type WarehouseFormValues = {
  company: string;
  warehouses: WarehouseFormNode[];
};

export type UomFormRow = {
  uom_name: string;
  must_be_whole_number: boolean;
};

export type UomFormValues = {
  uoms: UomFormRow[];
};

export type ItemGroupFormNode = {
  item_group_name: string;
  children: ItemGroupFormNode[];
};

export type ItemGroupFormValues = {
  item_groups: ItemGroupFormNode[];
};

export type SupplierFormValues = {
  suppliers: SupplierRow[];
};

export type CustomerFormValues = {
  customers: CustomerRow[];
};
