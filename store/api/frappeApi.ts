"use client";

import { createApi } from "@reduxjs/toolkit/query/react";

import { axiosBaseQuery } from "@/lib/axiosBaseQuery";
import type {
  ApiEnvelope,
  AuthMeResponse,
  CreateRoleRequest,
  CreateUserAccountRequest,
  ListUsersParams,
  LoginRequest,
  LoginResponse,
  RoleMasterItem,
  LogoutRequest,
  SignupOwnerRequest,
  UserAccount
} from "@/types/auth";
import type { FrappeListResponse, FrappeMessageResponse, SessionStatus } from "@/types/frappe";
import type {
  ItemGroupDeleteResponse,
  ItemGroupDocument,
  ItemGroupListParams,
  ItemGroupListResponse,
  ItemGroupLookups,
  ItemGroupLookupsParams,
  ItemGroupMutationPayload,
  ItemGroupTreeResponse
} from "@/types/item-group";
import type {
  ItemDocument,
  ItemListParams,
  ItemListSortBy,
  ItemListSortOrder,
  ItemMutationResponse,
  ItemListResponse,
  ItemMasterLookups,
  ItemPriceListParams,
  ItemPriceListResponse,
  ItemPriceSummary,
  ItemVariantAttributeLookups
} from "@/types/item";
import { setCsrfToken } from "@/store/features/session/sessionSlice";
import type { RootState } from "@/store";

type FrappeDocResponse<T> = {
  data: T;
};

type FrappeListCountResponse = {
  data?: Array<{ total_count?: number | string }>;
};

type FrappeLoggedUserResponse = {
  message?: string;
};

type FrappeLoginResponse = {
  message?: string;
  full_name?: string;
  home_page?: string;
};

type BaseQueryError = {
  status?: number;
  data: unknown;
};

type QueryArg = string | {
  url: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  data?: unknown;
  params?: Record<string, unknown>;
};

type BaseQueryResult = { data: unknown } | { error: BaseQueryError };

type ItemGroupResourceRecord = {
  name: string;
  item_group_name?: string | null;
  parent_item_group?: string | null;
  is_group?: 0 | 1 | boolean | null;
  disabled?: 0 | 1 | boolean | null;
  image?: string | null;
  description?: string | null;
  modified?: string | null;
  creation?: string | null;
};

const toBaseQueryError = (error: unknown): BaseQueryError => {
  if (error && typeof error === "object" && "data" in error) {
    const statusRaw = (error as { status?: unknown }).status;
    return {
      status: typeof statusRaw === "number" ? statusRaw : undefined,
      data: (error as { data: unknown }).data
    };
  }

  return {
    data: error
  };
};

const hasQueryError = (result: BaseQueryResult): result is { error: BaseQueryError } => "error" in result;

const LEGACY_ROLE_BLACKLIST = new Set(["Guest", "All", "Administrator"]);

const toSuccess = <T>(data: T, message = "Success", code = "OK"): ApiEnvelope<T> => ({
  ok: true,
  code,
  message,
  data
});

const toFailure = <T>(message: string, code = "BACKEND_ERROR"): ApiEnvelope<T> => ({
  ok: false,
  code,
  message,
  data: null
});

const readCsrfTokenFromCookie = (): string | null => {
  if (typeof document === "undefined") {
    return null;
  }

  const tokenCookie = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith("csrf_token="));

  if (!tokenCookie) {
    return null;
  }

  const token = tokenCookie.slice("csrf_token=".length).trim();
  return token ? decodeURIComponent(token) : null;
};

const encodeFrappeJson = (value: unknown) => JSON.stringify(value);

const toPositiveNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const mapSortBy = (sortBy: ItemListParams["sortBy"], sortOrder: ItemListSortOrder = "desc") => {
  const direction = sortOrder === "asc" ? "asc" : "desc";

  switch (sortBy) {
    case "item_code":
      return `item_code ${direction}`;
    case "item_name":
      return `item_name ${direction}`;
    case "modified":
    default:
      return `modified ${direction}`;
  }
};

const buildItemFilters = (params: ItemListParams) => {
  const filters: unknown[][] = [];
  const orFilters: unknown[][] = [];

  if (params.itemCode?.trim()) {
    filters.push(["item_code", "like", `%${params.itemCode.trim()}%`]);
  }

  if (params.itemName?.trim()) {
    filters.push(["item_name", "like", `%${params.itemName.trim()}%`]);
  }

  if (params.itemGroup?.trim()) {
    filters.push(["item_group", "=", params.itemGroup.trim()]);
  }

  if (params.variantOf?.trim()) {
    filters.push(["variant_of", "like", `%${params.variantOf.trim()}%`]);
  }

  if (params.hasVariants && params.hasVariants !== "all") {
    filters.push(["has_variants", "=", Number(params.hasVariants)]);
  }

  if (params.disabled && params.disabled !== "all") {
    filters.push(["disabled", "=", Number(params.disabled)]);
  }

  if (params.search?.trim()) {
    const token = `%${params.search.trim()}%`;
    orFilters.push(["item_code", "like", token]);
    orFilters.push(["item_name", "like", token]);
  }

  return { filters, orFilters };
};

const extractRoleMasterItems = (payload: unknown): RoleMasterItem[] => {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((entry): RoleMasterItem | null => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const roleRow = entry as {
        name?: unknown;
        is_custom?: unknown;
        disabled?: unknown;
        desk_access?: unknown;
      };

      if (typeof roleRow.name !== "string") {
        return null;
      }

      const isDisabled = Boolean(roleRow.disabled);
      const hasDeskAccess = roleRow.desk_access === undefined ? true : Boolean(roleRow.desk_access);
      const assignable = !isDisabled && hasDeskAccess && !LEGACY_ROLE_BLACKLIST.has(roleRow.name);

      return {
        value: roleRow.name,
        label: roleRow.name,
        is_default: !Boolean(roleRow.is_custom),
        is_custom: Boolean(roleRow.is_custom),
        assignable
      };
    })
    .filter((entry): entry is RoleMasterItem => entry !== null);
};

const extractUserRoles = (payload: unknown): string[] => {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const rolesRaw = (payload as { roles?: unknown }).roles;
  if (!Array.isArray(rolesRaw)) {
    return [];
  }

  return rolesRaw
    .map((entry) => {
      if (typeof entry === "string") {
        return entry;
      }

      if (!entry || typeof entry !== "object") {
        return null;
      }

      const role = (entry as { role?: unknown; name?: unknown }).role ?? (entry as { name?: unknown }).name;
      return typeof role === "string" ? role : null;
    })
    .filter((entry): entry is string => Boolean(entry));
};

const toBitFlag = (value: unknown): 0 | 1 => (Boolean(toPositiveNumber(value) || value === true) ? 1 : 0);

const toNullableString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const serializeItemPriceFilters = (params: ItemPriceListParams) => {
  const searchParams = new URLSearchParams();
  searchParams.set("item_code", params.itemCode);
  searchParams.set("page", String(params.page ?? 1));
  searchParams.set("page_size", String(params.pageSize ?? 20));

  if (params.priceList?.trim()) {
    searchParams.set("price_list", params.priceList.trim());
  }

  if (params.selling) {
    searchParams.set("selling", params.selling);
  }

  if (params.buying) {
    searchParams.set("buying", params.buying);
  }

  return searchParams.toString();
};

const itemGroupListFields = [
  "name",
  "parent_item_group",
  "is_group",
  "modified",
  "creation"
];

const mapItemGroupResourceRecord = (record: ItemGroupResourceRecord) => ({
  name: record.name,
  item_group_name: toNullableString(record.item_group_name) ?? record.name,
  parent_item_group: toNullableString(record.parent_item_group),
  is_group: toBitFlag(record.is_group),
  // MIGRATION NOTE: Standard ERPNext Item Group does not reliably expose `disabled` in list queries.
  disabled: 0 as const,
  image: toNullableString(record.image),
  description: toNullableString(record.description),
  modified: toNullableString(record.modified) ?? undefined,
  creation: toNullableString(record.creation) ?? undefined
});

const buildItemGroupQueryFilters = (params: {
  search?: string;
  parentItemGroup?: string;
  isGroup?: "all" | "0" | "1";
  disabled?: "all" | "0" | "1";
}) => {
  const filters: unknown[][] = [];
  const orFilters: unknown[][] = [];

  if (params.parentItemGroup?.trim()) {
    filters.push(["parent_item_group", "=", params.parentItemGroup.trim()]);
  }

  if (params.isGroup && params.isGroup !== "all") {
    filters.push(["is_group", "=", Number(params.isGroup)]);
  }

  if (params.search?.trim()) {
    const token = `%${params.search.trim()}%`;
    orFilters.push(["name", "like", token]);
  }

  return { filters, orFilters };
};

const mapItemGroupSort = (sortBy?: string, sortOrder?: "asc" | "desc") => {
  const allowedField = sortBy === "creation" ? "creation" : sortBy === "item_group_name" ? "name" : "modified";
  const direction = sortOrder === "asc" ? "asc" : "desc";
  return `${allowedField} ${direction}`;
};

const getItemGroupLabel = (record: ReturnType<typeof mapItemGroupResourceRecord>) => record.item_group_name || record.name;

const buildItemGroupChildCounts = (records: Array<ReturnType<typeof mapItemGroupResourceRecord>>) => {
  const counts: Record<string, number> = {};

  for (const record of records) {
    if (!record.parent_item_group) {
      continue;
    }

    counts[record.parent_item_group] = (counts[record.parent_item_group] ?? 0) + 1;
  }

  return counts;
};

const buildItemGroupItemCounts = async (
  run: (arg: QueryArg) => Promise<BaseQueryResult>,
  names: string[]
) => {
  const uniqueNames = Array.from(new Set(names.filter(Boolean)));
  if (!uniqueNames.length) {
    return {};
  }

  const entries = await Promise.all(
    uniqueNames.map(async (name) => {
      const result = await run({
        url: "/resource/Item",
        method: "GET",
        params: {
          filters: encodeFrappeJson([["item_group", "=", name]]),
          fields: encodeFrappeJson(["count(name) as total_count"]),
          limit_page_length: 1
        }
      });

      if (hasQueryError(result)) {
        throw result.error;
      }

      const totalCount = toPositiveNumber((result.data as FrappeListCountResponse).data?.[0]?.total_count);
      return [name, totalCount] as const;
    })
  );

  return Object.fromEntries(entries);
};

const deriveItemGroupActionState = (disabled: 0 | 1, childCount: number, itemCount: number) => ({
  can_delete: childCount === 0 && itemCount === 0,
  // MIGRATION NOTE: Standard ERPNext Item Group resource has no portable disable/enable lifecycle.
  can_disable: false,
  can_enable: false
});

const toItemGroupDocument = (
  record: ReturnType<typeof mapItemGroupResourceRecord>,
  childCounts: Record<string, number>,
  itemCounts: Record<string, number>
): ItemGroupDocument => {
  const children_count = childCounts[record.name] ?? 0;
  const item_count = itemCounts[record.name] ?? 0;

  return {
    name: record.name,
    item_group_name: getItemGroupLabel(record),
    parent_item_group: record.parent_item_group,
    is_group: record.is_group,
    disabled: record.disabled,
    image: record.image,
    description: record.description,
    modified: record.modified,
    creation: record.creation,
    children_count,
    item_count,
    dependency_counts: {
      child_groups: children_count,
      linked_items: item_count
    },
    ...deriveItemGroupActionState(record.disabled, children_count, item_count)
  };
};

const toLookupOption = (record: ReturnType<typeof mapItemGroupResourceRecord>) => ({
  label: getItemGroupLabel(record),
  value: record.name
});

const getDescendantNames = (records: Array<ReturnType<typeof mapItemGroupResourceRecord>>, currentItemGroup?: string) => {
  if (!currentItemGroup) {
    return new Set<string>();
  }

  const childrenByParent = new Map<string | null, string[]>();
  for (const record of records) {
    const key = record.parent_item_group ?? null;
    const entries = childrenByParent.get(key) ?? [];
    entries.push(record.name);
    childrenByParent.set(key, entries);
  }

  const visited = new Set<string>([currentItemGroup]);
  const queue = [currentItemGroup];

  while (queue.length) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    for (const childName of childrenByParent.get(current) ?? []) {
      if (visited.has(childName)) {
        continue;
      }

      visited.add(childName);
      queue.push(childName);
    }
  }

  return visited;
};

const filterItemGroupTree = (
  nodes: ItemGroupTreeResponse["data"],
  search?: string
): ItemGroupTreeResponse["data"] => {
  const token = search?.trim().toLowerCase();
  if (!token) {
    return nodes;
  }

  const filterNode = (node: ItemGroupTreeResponse["data"][number]): ItemGroupTreeResponse["data"][number] | null => {
    const children = (node.children ?? [])
      .map(filterNode)
      .filter((entry): entry is ItemGroupTreeResponse["data"][number] => entry !== null);
    const selfMatch =
      node.name.toLowerCase().includes(token) ||
      node.item_group_name.toLowerCase().includes(token);

    if (!selfMatch && !children.length) {
      return null;
    }

    return {
      ...node,
      children
    };
  };

  return nodes
    .map(filterNode)
    .filter((entry): entry is ItemGroupTreeResponse["data"][number] => entry !== null);
};

const buildItemGroupTree = (
  records: Array<ReturnType<typeof mapItemGroupResourceRecord>>,
  childCounts: Record<string, number>,
  itemCounts: Record<string, number>
): ItemGroupTreeResponse["data"] => {
  const byParent = new Map<string | null, ItemGroupTreeResponse["data"]>();
  const childrenByParent = new Map<string | null, Array<ReturnType<typeof mapItemGroupResourceRecord>>>();

  for (const record of records) {
    const key = record.parent_item_group ?? null;
    const entries = childrenByParent.get(key) ?? [];
    entries.push(record);
    childrenByParent.set(key, entries);
  }

  const buildNodes = (parentName: string | null): ItemGroupTreeResponse["data"] =>
    (childrenByParent.get(parentName) ?? []).map((record) => {
      const children = buildNodes(record.name);
      const document = toItemGroupDocument(record, childCounts, itemCounts);
      const node = {
        ...document,
        children
      };
      return node;
    });

  if (!byParent.has(null)) {
    byParent.set(null, buildNodes(null));
  }

  return byParent.get(null) ?? [];
};

const buildItemGroupLookupsPayload = (
  records: Array<ReturnType<typeof mapItemGroupResourceRecord>>,
  currentItemGroup?: string
): ItemGroupLookups => {
  const descendants = getDescendantNames(records, currentItemGroup);
  const enabledRecords = records.filter((record) => record.disabled === 0);
  const leafEnabledRecords = enabledRecords.filter((record) => record.is_group === 0);
  const parentCandidates = records.filter((record) => record.is_group === 1 && !descendants.has(record.name));

  return {
    item_groups: enabledRecords.map(toLookupOption),
    item_groups_all: records.map(toLookupOption),
    leaf_item_groups: leafEnabledRecords.map(toLookupOption),
    parent_candidates: parentCandidates.map(toLookupOption),
    root_candidates: records.filter((record) => !record.parent_item_group).map(toLookupOption),
    // MIGRATION NOTE: Legacy lookup semantics/schema metadata are no longer returned by ERPNext standard resources.
    lookup_semantics: {
      item_groups: "Enabled Item Groups from ERPNext /api/resource/Item Group",
      item_groups_all: "All Item Groups from ERPNext /api/resource/Item Group",
      leaf_item_groups: "Enabled leaf Item Groups derived client-side from ERPNext resources",
      parent_candidates: "Group nodes excluding current node and descendants",
      root_candidates: "Top-level Item Groups"
    }
  };
};

const fetchAllItemGroups = async (run: (arg: QueryArg) => Promise<BaseQueryResult>) => {
  const result = await run({
    url: "/resource/Item Group",
    method: "GET",
    params: {
      fields: encodeFrappeJson(itemGroupListFields),
      order_by: "name asc",
      limit_page_length: 5000
    }
  });

  if (hasQueryError(result)) {
    throw result.error;
  }

  return (result.data as FrappeListResponse<ItemGroupResourceRecord>).data.map(mapItemGroupResourceRecord);
};

const fetchItemGroupDocument = async (
  run: (arg: QueryArg) => Promise<BaseQueryResult>,
  itemGroup: string
) => {
  const result = await run({
    url: `/resource/Item Group/${encodeURIComponent(itemGroup)}`,
    method: "GET"
  });

  if (hasQueryError(result)) {
    throw result.error;
  }

  return mapItemGroupResourceRecord((result.data as FrappeDocResponse<ItemGroupResourceRecord>).data);
};

export const frappeApi = createApi({
  reducerPath: "frappeApi",
  refetchOnFocus: true,
  refetchOnReconnect: true,
  baseQuery: axiosBaseQuery({
    baseUrl: "/api/frappe",
    prepareHeaders: (headers, { getState, endpoint, type }) => {
      const state = getState() as RootState;
      const csrfToken = state.session.csrfToken ?? readCsrfTokenFromCookie();
      const isWriteRequest = type === "mutation" || endpoint === "createItem" || endpoint === "updateItem";

      if (isWriteRequest && csrfToken) {
        headers["x-frappe-csrf-token"] = csrfToken;
      }

      return headers;
    }
  }),
  tagTypes: [
    "Session",
    "Item",
    "ItemList",
    "Lookups", "Users",
    "ItemPrice",
    "ItemGroupTree",
    "ItemGroupList",
    "ItemGroupDetail",
    "ItemGroupLookups"
  ],
  endpoints: (builder) => ({
    signupOwner: builder.mutation<ApiEnvelope<unknown>, SignupOwnerRequest>({
      query: (body) => ({
        // MIGRATION NOTE: Keeping temporary fallback; ERPNext has no standard unauthenticated Owner+Company bootstrap API.
        url: "/method/textile_erp.api_v3.auth.signup",
        method: "POST",
        data: body
      })
    }),
    login: builder.mutation<ApiEnvelope<LoginResponse>, LoginRequest>({
      query: (body) => ({
        url: "/method/login",
        method: "POST",
        data: {
          usr: body.login,
          pwd: body.password
        }
      }),
      transformResponse: (response: FrappeLoginResponse) =>
        toSuccess<LoginResponse>(
          {
            message: response.message,
            full_name: response.full_name,
            home_page: response.home_page
          },
          response.message || "Logged in"
        )
    }),
    logoutUser: builder.mutation<ApiEnvelope<unknown>, LogoutRequest | void>({
      query: () => ({
        url: "/method/logout",
        method: "POST"
      }),
      transformResponse: () => toSuccess({}, "Logged out"),
      invalidatesTags: ["Session"]
    }),
    authMe: builder.query<ApiEnvelope<AuthMeResponse>, void>({
      async queryFn(_arg, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<BaseQueryResult>;
        const loggedUserResult = await run({
          url: "/method/frappe.auth.get_logged_user",
          method: "GET"
        });

        if (hasQueryError(loggedUserResult)) {
          return { error: toBaseQueryError(loggedUserResult.error) };
        }

        const userId = (loggedUserResult.data as FrappeLoggedUserResponse).message;
        if (!userId || typeof userId !== "string") {
          return { data: toFailure<AuthMeResponse>("Unable to resolve signed-in user.", "INVALID_SESSION") };
        }

        const userDocResult = await run({
          url: `/resource/User/${encodeURIComponent(userId)}`,
          method: "GET"
        });

        if (hasQueryError(userDocResult)) {
          return {
            data: toSuccess<AuthMeResponse>(
              {
                user_id: userId,
                email: userId
              },
              "User loaded with minimal profile"
            )
          };
        }

        const userDoc = (userDocResult.data as FrappeDocResponse<Record<string, unknown>>).data;
        const mapped: AuthMeResponse = {
          user_id: userId,
          email: typeof userDoc.email === "string" ? userDoc.email : userId,
          first_name: typeof userDoc.first_name === "string" ? userDoc.first_name : undefined,
          last_name: typeof userDoc.last_name === "string" ? userDoc.last_name : undefined,
          full_name: typeof userDoc.full_name === "string" ? userDoc.full_name : undefined,
          roles: extractUserRoles(userDoc),
          company: typeof userDoc.company === "string" ? userDoc.company : undefined,
          user: userDoc
        };

        return { data: toSuccess(mapped, "User loaded") };
      },
      providesTags: ["Session"]
    }),
    createUserAccount: builder.mutation<ApiEnvelope<UserAccount>, CreateUserAccountRequest>({
      async queryFn(body, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<BaseQueryResult>;
        const userCreateResult = await run({
          url: "/resource/User",
          method: "POST",
          data: {
            email: body.email,
            first_name: body.first_name,
            last_name: body.last_name,
            enabled: body.enabled ?? true,
            new_password: body.password,
            send_welcome_email: 0
          }
        });

        if (hasQueryError(userCreateResult)) {
          return { error: toBaseQueryError(userCreateResult.error) };
        }

        const createdUser = (userCreateResult.data as FrappeDocResponse<Record<string, unknown>>).data;
        const userName = typeof createdUser.name === "string" ? createdUser.name : body.email;

        const uniqueRoles = Array.from(new Set(body.roles.filter((role) => role.trim().length > 0)));
        if (uniqueRoles.length) {
          const updateRolesResult = await run({
            url: `/resource/User/${encodeURIComponent(userName)}`,
            method: "PUT",
            data: {
              roles: uniqueRoles.map((role) => ({ role }))
            }
          });

          if (hasQueryError(updateRolesResult)) {
            return { error: toBaseQueryError(updateRolesResult.error) };
          }
        }

        const result: UserAccount = {
          user_id: userName,
          email: typeof createdUser.email === "string" ? createdUser.email : body.email,
          first_name: typeof createdUser.first_name === "string" ? createdUser.first_name : body.first_name,
          last_name: typeof createdUser.last_name === "string" ? createdUser.last_name : body.last_name,
          full_name: typeof createdUser.full_name === "string" ? createdUser.full_name : undefined,
          enabled: body.enabled ?? true,
          roles: uniqueRoles
        };

        return { data: toSuccess(result, "User account created") };
      },
      invalidatesTags: ["Users"]
    }),
    listUsers: builder.query<ApiEnvelope<unknown>, ListUsersParams | void>({
      async queryFn(params, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<BaseQueryResult>;
        const page = params?.page ?? 1;
        const pageSize = params?.pageSize ?? 20;
        const limitStart = (page - 1) * pageSize;

        const orFilters: unknown[][] = [];
        if (params?.search?.trim()) {
          const token = `%${params.search.trim()}%`;
          orFilters.push(["name", "like", token]);
          orFilters.push(["email", "like", token]);
          orFilters.push(["full_name", "like", token]);
        }

        const commonParams: Record<string, string | number> = {
          order_by: "creation desc"
        };

        if (orFilters.length) {
          commonParams.or_filters = encodeFrappeJson(orFilters);
        }

        const [listResult, countResult] = await Promise.all([
          run({
            url: "/resource/User",
            method: "GET",
            params: {
              ...commonParams,
              fields: encodeFrappeJson([
                "name",
                "email",
                "first_name",
                "last_name",
                "full_name",
                "enabled"
              ]),
              limit_start: limitStart,
              limit_page_length: pageSize
            }
          }),
          run({
            url: "/resource/User",
            method: "GET",
            params: {
              ...commonParams,
              fields: encodeFrappeJson(["count(name) as total_count"]),
              limit_page_length: 1
            }
          })
        ]);

        if (hasQueryError(listResult)) {
          return { error: toBaseQueryError(listResult.error) };
        }

        if (hasQueryError(countResult)) {
          return { error: toBaseQueryError(countResult.error) };
        }

        const users = (listResult.data as FrappeListResponse<Record<string, unknown>>).data.map((user) => ({
          user_id: typeof user.name === "string" ? user.name : undefined,
          email: typeof user.email === "string" ? user.email : undefined,
          first_name: typeof user.first_name === "string" ? user.first_name : undefined,
          last_name: typeof user.last_name === "string" ? user.last_name : undefined,
          full_name: typeof user.full_name === "string" ? user.full_name : undefined,
          enabled: Boolean(user.enabled)
        }));

        const total_count = toPositiveNumber((countResult.data as FrappeListCountResponse).data?.[0]?.total_count);

        return {
          data: toSuccess(
            {
              users,
              total_count,
              page,
              page_size: pageSize
            },
            "Users loaded"
          )
        };
      },
      providesTags: ["Users"]
    }),
    getRolesMaster: builder.query<ApiEnvelope<{ roles: RoleMasterItem[] }>, void>({
      query: () => ({
        url: "/resource/Role",
        method: "GET",
        params: {
          fields: encodeFrappeJson(["name", "is_custom", "disabled", "desk_access"]),
          order_by: "name asc",
          limit_page_length: 500
        }
      }),
      transformResponse: (response: FrappeListResponse<Record<string, unknown>>) => {
        const roles = extractRoleMasterItems(response.data);
        return toSuccess({ roles }, "Role master loaded");
      },
      providesTags: ["Lookups"]
    }),
    createRole: builder.mutation<ApiEnvelope<unknown>, CreateRoleRequest>({
      query: (body) => ({
        url: "/resource/Role",
        method: "POST",
        data: {
          role_name: body.role_name
        }
      }),
      transformResponse: () => toSuccess({}, "Role created"),
      invalidatesTags: ["Lookups"]
    }),
    getSession: builder.query<SessionStatus, void>({
      async queryFn(_arg, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<BaseQueryResult>;
        const result = await run({
          url: "/method/frappe.auth.get_logged_user",
          method: "GET"
        });

        if (hasQueryError(result)) {
          return { error: toBaseQueryError(result.error) };
        }

        const user = (result.data as FrappeMessageResponse<string>).message;
        return {
          data: {
            authenticated: Boolean(user),
            user: user || null,
            full_name: null,
            site: "erpnext",
            csrf_token: readCsrfTokenFromCookie()
          }
        };
      },
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCsrfToken(data.csrf_token));
        } catch {
          dispatch(setCsrfToken(readCsrfTokenFromCookie()));
        }
      },
      providesTags: ["Session"]
    }),
    getHealth: builder.query<{ status: string; app: string }, void>({
      query: () => ({
        url: "/method/ping",
        method: "GET"
      }),
      transformResponse: (response: FrappeMessageResponse<string>) => ({
        status: response.message === "pong" ? "ok" : "unknown",
        app: "erpnext"
      })
    }),
    getItemList: builder.query<ItemListResponse, ItemListParams>({
      async queryFn(params, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<BaseQueryResult>;
        const { filters, orFilters } = buildItemFilters(params);
        const limitStart = (params.page - 1) * params.pageSize;

        const commonParams: Record<string, string | number> = {
          order_by: mapSortBy(params.sortBy, params.sortOrder),
          limit_page_length: params.pageSize,
          limit_start: limitStart
        };

        if (filters.length) {
          commonParams.filters = encodeFrappeJson(filters);
        }

        if (orFilters.length) {
          commonParams.or_filters = encodeFrappeJson(orFilters);
        }

        const [listResult, countResult] = await Promise.all([
          run({
            url: "/resource/Item",
            method: "GET",
            params: {
              ...commonParams,
              fields: encodeFrappeJson([
                "item_code",
                "item_name",
                "item_group",
                "brand",
                "variant_of",
                "stock_uom",
                "disabled",
                "is_stock_item",
                "has_variants",
                "modified"
              ])
            }
          }),
          run({
            url: "/resource/Item",
            method: "GET",
            params: {
              ...(filters.length ? { filters: encodeFrappeJson(filters) } : {}),
              ...(orFilters.length ? { or_filters: encodeFrappeJson(orFilters) } : {}),
              fields: encodeFrappeJson(["count(name) as total_count"]),
              limit_page_length: 1
            }
          })
        ]);

        if (hasQueryError(listResult)) {
          return { error: toBaseQueryError(listResult.error) };
        }

        if (hasQueryError(countResult)) {
          return { error: toBaseQueryError(countResult.error) };
        }

        const listData = (listResult.data as FrappeListResponse<ItemListResponse["data"][number]>).data;
        const totalCount = toPositiveNumber((countResult.data as FrappeListCountResponse).data?.[0]?.total_count);

        return {
          data: {
            data: listData,
            page: params.page,
            page_size: params.pageSize,
            total_count: totalCount
          }
        };
      },
      providesTags: ["ItemList"]
    }),
    getItemLookups: builder.query<ItemMasterLookups, void>({
      async queryFn(_arg, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<BaseQueryResult>;
        const [itemGroupsResult, uomsResult, brandsResult] = await Promise.all([
          run({
            url: "/resource/Item Group",
            method: "GET",
            params: {
              fields: encodeFrappeJson(["name"]),
              order_by: "name asc",
              limit_page_length: 500
            }
          }),
          run({
            url: "/resource/UOM",
            method: "GET",
            params: {
              fields: encodeFrappeJson(["name"]),
              order_by: "name asc",
              limit_page_length: 500
            }
          }),
          run({
            url: "/resource/Brand",
            method: "GET",
            params: {
              fields: encodeFrappeJson(["name"]),
              order_by: "name asc",
              limit_page_length: 500
            }
          })
        ]);

        if (hasQueryError(itemGroupsResult)) {
          return { error: toBaseQueryError(itemGroupsResult.error) };
        }

        if (hasQueryError(uomsResult)) {
          return { error: toBaseQueryError(uomsResult.error) };
        }

        if (hasQueryError(brandsResult)) {
          return { error: toBaseQueryError(brandsResult.error) };
        }

        const item_groups = (itemGroupsResult.data as FrappeListResponse<{ name: string }>).data.map((entry) => ({
          label: entry.name,
          value: entry.name
        }));
        const uoms = (uomsResult.data as FrappeListResponse<{ name: string }>).data.map((entry) => ({
          label: entry.name,
          value: entry.name
        }));
        const brands = (brandsResult.data as FrappeListResponse<{ name: string }>).data.map((entry) => ({
          label: entry.name,
          value: entry.name
        }));

        return {
          data: {
            item_groups,
            uoms,
            brands,
            warehouses: [],
            quality_templates: [],
            tax_templates: [],
            price_lists: [],
            variant_parent_candidates: [],
            item_attributes: [],
            collections: [],
            seasons: [],
            fabric_types: [],
            display_categories: []
          }
        };
      },
      providesTags: ["Lookups"]
    }),
    getItemGroupLookups: builder.query<ItemGroupLookups, ItemGroupLookupsParams | void>({
      async queryFn(params, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<BaseQueryResult>;

        try {
          const records = await fetchAllItemGroups(run);
          return {
            data: buildItemGroupLookupsPayload(records, params?.currentItemGroup)
          };
        } catch (error) {
          return { error: toBaseQueryError(error) };
        }
      },
      providesTags: ["ItemGroupLookups"]
    }),
    getItemGroupList: builder.query<ItemGroupListResponse, ItemGroupListParams>({
      async queryFn(params, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<BaseQueryResult>;
        const limitStart = (params.page - 1) * params.pageSize;
        const { filters, orFilters } = buildItemGroupQueryFilters(params);

        try {
          const [allGroups, listResult, countResult] = await Promise.all([
            fetchAllItemGroups(run),
            run({
              url: "/resource/Item Group",
              method: "GET",
              params: {
                fields: encodeFrappeJson(itemGroupListFields),
                order_by: mapItemGroupSort(params.sortBy, params.sortOrder),
                limit_start: limitStart,
                limit_page_length: params.pageSize,
                ...(filters.length ? { filters: encodeFrappeJson(filters) } : {}),
                ...(orFilters.length ? { or_filters: encodeFrappeJson(orFilters) } : {})
              }
            }),
            run({
              url: "/resource/Item Group",
              method: "GET",
              params: {
                fields: encodeFrappeJson(["count(name) as total_count"]),
                limit_page_length: 1,
                ...(filters.length ? { filters: encodeFrappeJson(filters) } : {}),
                ...(orFilters.length ? { or_filters: encodeFrappeJson(orFilters) } : {})
              }
            })
          ]);

          if (hasQueryError(listResult)) {
            return { error: toBaseQueryError(listResult.error) };
          }

          if (hasQueryError(countResult)) {
            return { error: toBaseQueryError(countResult.error) };
          }

          const listRecords = (listResult.data as FrappeListResponse<ItemGroupResourceRecord>).data.map(mapItemGroupResourceRecord);
          const childCounts = buildItemGroupChildCounts(allGroups);
          const itemCounts = await buildItemGroupItemCounts(
            run,
            listRecords.map((record) => record.name)
          );

          return {
            data: {
              data: listRecords.map((record) => toItemGroupDocument(record, childCounts, itemCounts)),
              page: params.page,
              page_size: params.pageSize,
              total_count: toPositiveNumber((countResult.data as FrappeListCountResponse).data?.[0]?.total_count),
              sort_by: params.sortBy ?? "modified",
              sort_order: params.sortOrder ?? "desc"
            }
          };
        } catch (error) {
          return { error: toBaseQueryError(error) };
        }
      },
      providesTags: ["ItemGroupList"]
    }),
    getItemGroupTree: builder.query<ItemGroupTreeResponse, { search?: string; includeDisabled?: boolean } | void>({
      async queryFn(params, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<BaseQueryResult>;

        try {
          const allGroups = await fetchAllItemGroups(run);
          const records = allGroups;
          const childCounts = buildItemGroupChildCounts(records);
          const itemCounts = await buildItemGroupItemCounts(
            run,
            records.map((record) => record.name)
          );
          const tree = buildItemGroupTree(records, childCounts, itemCounts);

          return {
            data: {
              // MIGRATION NOTE: Search now filters the client-built ERPNext tree instead of a legacy custom endpoint.
              data: filterItemGroupTree(tree, params?.search)
            }
          };
        } catch (error) {
          return { error: toBaseQueryError(error) };
        }
      },
      providesTags: ["ItemGroupTree"]
    }),
    getItemGroup: builder.query<ItemGroupDocument, string>({
      async queryFn(itemGroup, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<BaseQueryResult>;

        try {
          const [allGroups, record] = await Promise.all([
            fetchAllItemGroups(run),
            fetchItemGroupDocument(run, itemGroup)
          ]);
          const childCounts = buildItemGroupChildCounts(allGroups);
          const itemCounts = await buildItemGroupItemCounts(run, [record.name]);

          return {
            data: toItemGroupDocument(record, childCounts, itemCounts)
          };
        } catch (error) {
          return { error: toBaseQueryError(error) };
        }
      },
      providesTags: (_result, _error, itemGroup) => [{ type: "ItemGroupDetail", id: itemGroup }]
    }),
    getItem: builder.query<ItemDocument, string>({
      query: (itemCode) => `/resource/Item/${encodeURIComponent(itemCode)}`,
      transformResponse: (response: { data: ItemDocument }) => response.data,
      providesTags: (_result, _error, itemCode) => [{ type: "Item", id: itemCode }]
    }),
    getItemVariantAttributeLookups: builder.query<ItemVariantAttributeLookups, string | void>({
      query: (templateItem) =>
        templateItem
          ? `/method/textile_erp.api.item_variant_attribute_lookups?template_item=${encodeURIComponent(templateItem)}`
          : "/method/textile_erp.api.item_variant_attribute_lookups",
      transformResponse: (response: FrappeMessageResponse<ItemVariantAttributeLookups>) => response.message,
      providesTags: ["Lookups"]
    }),
    getItemPriceSummary: builder.query<ItemPriceSummary, string>({
      query: (itemCode) =>
        `/method/textile_erp.api.item_price_summary?item_code=${encodeURIComponent(itemCode)}`,
      transformResponse: (response: FrappeMessageResponse<ItemPriceSummary>) => response.message,
      providesTags: (_result, _error, itemCode) => [{ type: "ItemPrice", id: itemCode }]
    }),
    getItemPriceList: builder.query<ItemPriceListResponse, ItemPriceListParams>({
      query: (params) => `/method/textile_erp.api.item_price_list?${serializeItemPriceFilters(params)}`,
      transformResponse: (response: FrappeMessageResponse<ItemPriceListResponse>) => response.message,
      providesTags: (_result, _error, arg) => [{ type: "ItemPrice", id: arg.itemCode }]
    }),
    createItem: builder.mutation<ItemDocument, ItemDocument>({
      query: (payload) => ({
        url: "/method/textile_erp.api.item_save",
        method: "POST",
        data: { payload }
      }),
      transformResponse: (response: FrappeMessageResponse<ItemMutationResponse>) => response.message.item,
      invalidatesTags: ["ItemList", "Lookups"]
    }),
    updateItem: builder.mutation<ItemDocument, { itemCode: string; values: Partial<ItemDocument> }>({
      query: ({ itemCode, values: payload }) => ({
        url: "/method/textile_erp.api.item_update",
        method: "POST",
        data: {
          item_code: itemCode,
          payload
        }
      }),
      transformResponse: (response: FrappeMessageResponse<ItemMutationResponse>) => response.message.item,
      invalidatesTags: (_result, _error, arg) => [
        "ItemList",
        "Lookups",
        { type: "Item", id: arg.itemCode },
        { type: "ItemPrice", id: arg.itemCode }
      ]
    }),
    createItemGroup: builder.mutation<ItemGroupDocument, ItemGroupMutationPayload>({
      async queryFn(payload, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<BaseQueryResult>;

        try {
          const createResult = await run({
            url: "/resource/Item Group",
            method: "POST",
            data: payload
          });

          if (hasQueryError(createResult)) {
            return { error: toBaseQueryError(createResult.error) };
          }

          const createdRecord = mapItemGroupResourceRecord(
            (createResult.data as FrappeDocResponse<ItemGroupResourceRecord>).data
          );
          const allGroups = await fetchAllItemGroups(run);
          const childCounts = buildItemGroupChildCounts(allGroups);
          const itemCounts = await buildItemGroupItemCounts(run, [createdRecord.name]);

          return {
            // MIGRATION NOTE: Item Group creation now posts directly to ERPNext standard resource APIs.
            data: toItemGroupDocument(createdRecord, childCounts, itemCounts)
          };
        } catch (error) {
          return { error: toBaseQueryError(error) };
        }
      },
      invalidatesTags: ["ItemGroupTree", "ItemGroupList", "ItemGroupLookups"]
    }),
    updateItemGroup: builder.mutation<
      ItemGroupDocument,
      { itemGroup: string; values: ItemGroupMutationPayload }
    >({
      async queryFn({ itemGroup, values }, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<BaseQueryResult>;

        try {
          const updateResult = await run({
            url: `/resource/Item Group/${encodeURIComponent(itemGroup)}`,
            method: "PUT",
            data: values
          });

          if (hasQueryError(updateResult)) {
            return { error: toBaseQueryError(updateResult.error) };
          }

          const updatedRecord = mapItemGroupResourceRecord(
            (updateResult.data as FrappeDocResponse<ItemGroupResourceRecord>).data
          );
          const allGroups = await fetchAllItemGroups(run);
          const childCounts = buildItemGroupChildCounts(allGroups);
          const itemCounts = await buildItemGroupItemCounts(run, [updatedRecord.name]);

          return {
            data: toItemGroupDocument(updatedRecord, childCounts, itemCounts)
          };
        } catch (error) {
          return { error: toBaseQueryError(error) };
        }
      },
      invalidatesTags: (_result, _error, arg) => [
        "ItemGroupTree",
        "ItemGroupList",
        "ItemGroupLookups",
        { type: "ItemGroupDetail", id: arg.itemGroup }
      ]
    }),
    toggleItemGroupDisabled: builder.mutation<
      ItemGroupDocument,
      { itemGroup: string; disabled: boolean }
    >({
      async queryFn() {
        return {
          error: {
            status: 400,
            data: {
              message: "Disable/enable is not supported by the standard ERPNext Item Group resource."
            }
          }
        };
      },
      invalidatesTags: (_result, _error, arg) => [
        "ItemGroupTree",
        "ItemGroupList",
        "ItemGroupLookups",
        { type: "ItemGroupDetail", id: arg.itemGroup }
      ]
    }),
    deleteItemGroup: builder.mutation<ItemGroupDeleteResponse, string>({
      async queryFn(itemGroup, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<BaseQueryResult>;

        try {
          const allGroups = await fetchAllItemGroups(run);
          const childCounts = buildItemGroupChildCounts(allGroups);
          const itemCounts = await buildItemGroupItemCounts(run, [itemGroup]);
          const deleteResult = await run({
            url: `/resource/Item Group/${encodeURIComponent(itemGroup)}`,
            method: "DELETE"
          });

          if (hasQueryError(deleteResult)) {
            return { error: toBaseQueryError(deleteResult.error) };
          }

          return {
            data: {
              deleted: true,
              item_group: itemGroup,
              dependency_counts: {
                child_groups: childCounts[itemGroup] ?? 0,
                linked_items: itemCounts[itemGroup] ?? 0
              }
            }
          };
        } catch (error) {
          return { error: toBaseQueryError(error) };
        }
      },
      invalidatesTags: (_result, _error, itemGroup) => [
        "ItemGroupTree",
        "ItemGroupList",
        "ItemGroupLookups",
        { type: "ItemGroupDetail", id: itemGroup }
      ]
    }),
    moveItemGroup: builder.mutation<
      ItemGroupDocument,
      { itemGroup: string; newParentItemGroup?: string | null }
    >({
      async queryFn({ itemGroup, newParentItemGroup }, _api, _extra, baseQuery) {
        const run = (arg: QueryArg) => baseQuery(arg) as Promise<BaseQueryResult>;

        try {
          const moveResult = await run({
            url: `/resource/Item Group/${encodeURIComponent(itemGroup)}`,
            method: "PUT",
            data: {
              parent_item_group: newParentItemGroup ?? ""
            }
          });

          if (hasQueryError(moveResult)) {
            return { error: toBaseQueryError(moveResult.error) };
          }

          const movedRecord = mapItemGroupResourceRecord(
            (moveResult.data as FrappeDocResponse<ItemGroupResourceRecord>).data
          );
          const allGroups = await fetchAllItemGroups(run);
          const childCounts = buildItemGroupChildCounts(allGroups);
          const itemCounts = await buildItemGroupItemCounts(run, [movedRecord.name]);

          return {
            data: toItemGroupDocument(movedRecord, childCounts, itemCounts)
          };
        } catch (error) {
          return { error: toBaseQueryError(error) };
        }
      },
      invalidatesTags: (_result, _error, arg) => [
        "ItemGroupTree",
        "ItemGroupList",
        "ItemGroupLookups",
        { type: "ItemGroupDetail", id: arg.itemGroup }
      ]
    }),
    getBrands: builder.query<{ label: string; value: string }[], void>({
      query: () => ({
        url: "/resource/Brand",
        method: "GET",
        params: {
          fields: encodeFrappeJson(["name"]),
          order_by: "name asc",
          limit_page_length: 500
        }
      }),
      transformResponse: (response: FrappeListResponse<{ name: string }>) =>
        response.data.map((entry) => ({ label: entry.name, value: entry.name })),
      providesTags: ["Lookups"]
    }),
    getRoleOptions: builder.query<{ label: string; value: string }[], void>({
      query: () => ({
        url: "/resource/Role",
        method: "GET",
        params: {
          fields: encodeFrappeJson(["name", "is_custom", "disabled", "desk_access"]),
          order_by: "name asc",
          limit_page_length: 500
        }
      }),
      transformResponse: (response: FrappeListResponse<Record<string, unknown>>) =>
        extractRoleMasterItems(response.data)
          .filter((entry) => entry.assignable !== false)
          .map((entry) => ({ label: entry.label, value: entry.value })),
      providesTags: ["Lookups"]
    })
  })
});

export const {
  useAuthMeQuery,
  useCreateUserAccountMutation,
  useCreateItemGroupMutation,
  useCreateItemMutation,
  useLazyAuthMeQuery,
  useDeleteItemGroupMutation,
  useGetHealthQuery,
  useGetItemGroupListQuery,
  useGetItemGroupLookupsQuery,
  useGetItemGroupQuery,
  useGetItemGroupTreeQuery,
  useGetItemListQuery,
  useGetItemLookupsQuery,
  useGetItemPriceListQuery,
  useGetItemPriceSummaryQuery,
  useGetItemQuery,
  useGetRolesMasterQuery,
  useGetRoleOptionsQuery,
  useGetItemVariantAttributeLookupsQuery,
  useGetSessionQuery,
  useListUsersQuery,
  useLoginMutation,
  useLogoutUserMutation,
  useSignupOwnerMutation,
  useMoveItemGroupMutation,
  useToggleItemGroupDisabledMutation,
  useUpdateItemGroupMutation,
  useUpdateItemMutation,
  useCreateRoleMutation
} = frappeApi;
