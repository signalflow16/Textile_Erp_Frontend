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
  ItemDocument,
  ItemListParams,
  ItemListResponse,
  ItemMasterLookups
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

const mapSortBy = (sortBy: ItemListParams["sortBy"]) => {
  switch (sortBy) {
    case "modified_asc":
      return "modified asc";
    case "item_code_asc":
      return "item_code asc";
    case "item_name_asc":
      return "item_name asc";
    case "modified_desc":
    default:
      return "modified desc";
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
  tagTypes: ["Session", "Item", "ItemList", "Lookups", "Users"],
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
          order_by: mapSortBy(params.sortBy),
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
            brands
          }
        };
      },
      providesTags: ["Lookups"]
    }),
    getItem: builder.query<ItemDocument, string>({
      query: (itemCode) => `/resource/Item/${encodeURIComponent(itemCode)}`,
      transformResponse: (response: { data: ItemDocument }) => response.data,
      providesTags: (_result, _error, itemCode) => [{ type: "Item", id: itemCode }]
    }),
    createItem: builder.mutation<ItemDocument, ItemDocument>({
      query: (body) => ({
        url: "/resource/Item",
        method: "POST",
        data: body
      }),
      transformResponse: (response: { data: ItemDocument }) => response.data,
      invalidatesTags: ["ItemList"]
    }),
    updateItem: builder.mutation<ItemDocument, { itemCode: string; values: Partial<ItemDocument> }>({
      query: ({ itemCode, values }) => ({
        url: `/resource/Item/${encodeURIComponent(itemCode)}`,
        method: "PUT",
        data: values
      }),
      transformResponse: (response: { data: ItemDocument }) => response.data,
      invalidatesTags: (_result, _error, arg) => [
        "ItemList",
        "Lookups",
        { type: "Item", id: arg.itemCode }
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
  useCreateItemMutation,
  useLazyAuthMeQuery,
  useGetHealthQuery,
  useGetItemListQuery,
  useGetItemLookupsQuery,
  useGetItemQuery,
  useGetRolesMasterQuery,
  useGetRoleOptionsQuery,
  useGetSessionQuery,
  useListUsersQuery,
  useLoginMutation,
  useLogoutUserMutation,
  useSignupOwnerMutation,
  useUpdateItemMutation,
  useCreateRoleMutation
} = frappeApi;
