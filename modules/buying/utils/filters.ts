import type { BuyingListParams } from "@/modules/buying/types/buying";

export const toOrderBy = (sortBy?: BuyingListParams["sortBy"]) =>
  sortBy === "modified_asc" ? "modified asc" : "modified desc";

export const toLimitStart = (page: number, pageSize: number) => (page - 1) * pageSize;
