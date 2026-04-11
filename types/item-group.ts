import type { LookupOption } from "@/types/item";

export type ItemGroupActionState = {
  can_delete: boolean;
  can_disable: boolean;
  can_enable: boolean;
};

export type ItemGroupDependencyCounts = {
  child_groups?: number;
  linked_items?: number;
};

export type ItemGroupTreeNode = ItemGroupActionState & {
  name: string;
  item_group_name: string;
  parent_item_group?: string | null;
  is_group: 0 | 1;
  disabled: 0 | 1;
  children_count: number;
  item_count: number;
  children: ItemGroupTreeNode[];
};

export type ItemGroupListRow = ItemGroupActionState & {
  name: string;
  item_group_name: string;
  parent_item_group?: string | null;
  is_group: 0 | 1;
  disabled: 0 | 1;
  children_count: number;
  item_count: number;
  dependency_counts?: ItemGroupDependencyCounts;
  modified?: string;
  creation?: string;
};

export type ItemGroupDocument = ItemGroupActionState & {
  name: string;
  item_group_name: string;
  parent_item_group?: string | null;
  is_group: 0 | 1;
  disabled: 0 | 1;
  image?: string | null;
  description?: string | null;
  children_count: number;
  item_count: number;
  dependency_counts?: ItemGroupDependencyCounts;
  modified?: string;
  creation?: string;
  schema_version?: string | number;
};

export type ItemGroupLookupSemantics = {
  item_groups?: string;
  item_groups_all?: string;
  leaf_item_groups?: string;
  parent_candidates?: string;
  root_candidates?: string;
};

export type ItemGroupLookups = {
  item_groups: LookupOption[];
  item_groups_all?: LookupOption[];
  leaf_item_groups?: LookupOption[];
  parent_candidates: LookupOption[];
  root_candidates: LookupOption[];
  lookup_semantics?: ItemGroupLookupSemantics;
  schema_version?: string | number;
};

export type ItemGroupListResponse = {
  data: ItemGroupListRow[];
  page: number;
  page_size: number;
  total_count: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  schema_version?: string | number;
};

export type ItemGroupTreeResponse = {
  data: ItemGroupTreeNode[];
  schema_version?: string | number;
};

export type ItemGroupMutationPayload = {
  item_group_name?: string;
  parent_item_group?: string | null;
  is_group?: 0 | 1;
  disabled?: 0 | 1;
  image?: string | null;
  description?: string | null;
};

export type ItemGroupDeleteResponse = {
  deleted: boolean;
  item_group: string;
  dependency_counts?: ItemGroupDependencyCounts;
  schema_version?: string | number;
};

export type ItemGroupListParams = {
  page: number;
  pageSize: number;
  search?: string;
  parentItemGroup?: string;
  isGroup?: "all" | "0" | "1";
  disabled?: "all" | "0" | "1";
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type ItemGroupLookupsParams = {
  currentItemGroup?: string;
};
