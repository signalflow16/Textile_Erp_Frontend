import { apiRequest } from "@/services/axiosInstance";
import type { FrappeListPayload } from "@/types/master-data";

export const encodeFrappeJson = (value: unknown) => JSON.stringify(value);

export const parseFrappeNumber = (value: unknown) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

export const buildPagedParams = ({
  fields,
  filters,
  orFilters,
  orderBy,
  page,
  pageSize
}: {
  fields: string[];
  filters?: unknown[][];
  orFilters?: unknown[][];
  orderBy?: string;
  page: number;
  pageSize: number;
}) => ({
  fields: encodeFrappeJson(fields),
  ...(filters?.length ? { filters: encodeFrappeJson(filters) } : {}),
  ...(orFilters?.length ? { or_filters: encodeFrappeJson(orFilters) } : {}),
  ...(orderBy ? { order_by: orderBy } : {}),
  limit_start: (page - 1) * pageSize,
  limit_page_length: pageSize
});

export const fetchFrappeCount = async ({
  url,
  filters,
  orFilters
}: {
  url: string;
  filters?: unknown[][];
  orFilters?: unknown[][];
}) => {
  const payload = await apiRequest<FrappeListPayload<{ total_count?: number | string }>>({
    url,
    method: "GET",
    params: {
      fields: encodeFrappeJson(["count(name) as total_count"]),
      ...(filters?.length ? { filters: encodeFrappeJson(filters) } : {}),
      ...(orFilters?.length ? { or_filters: encodeFrappeJson(orFilters) } : {}),
      limit_page_length: 1
    }
  });

  return parseFrappeNumber(payload.data?.[0]?.total_count);
};

export const fetchAllFrappePages = async <T>({
  url,
  fields,
  filters,
  orFilters,
  orderBy,
  pageSize = 500
}: {
  url: string;
  fields: string[];
  filters?: unknown[][];
  orFilters?: unknown[][];
  orderBy?: string;
  pageSize?: number;
}) => {
  const total = await fetchFrappeCount({ url, filters, orFilters });
  const rows: T[] = [];

  if (total === 0) {
    return rows;
  }

  const totalPages = Math.ceil(total / pageSize);

  for (let page = 1; page <= totalPages; page += 1) {
    const payload = await apiRequest<FrappeListPayload<T>>({
      url,
      method: "GET",
      params: buildPagedParams({
        fields,
        filters,
        orFilters,
        orderBy,
        page,
        pageSize
      })
    });

    rows.push(...(payload.data ?? []));
  }

  return rows;
};
