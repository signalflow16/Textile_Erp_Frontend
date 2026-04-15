export type ApiErrorPayload = {
  code: string;
  message: string;
  details?: Record<string, unknown> | null;
};

export type ApiSuccess<T> = {
  ok: true;
  code: string;
  message: string;
  data: T;
};

export type ApiFailure = {
  ok: false;
  code: string;
  message: string;
  data: null;
  details?: Record<string, unknown> | null;
  // Backward compatibility for older backend responses.
  error?: ApiErrorPayload;
};

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

export type SignupOwnerRequest = {
  email: string;
  password: string;
  first_name: string;
  last_name?: string;
  company: string;
  branch_name: string;
};

export type LoginRequest = {
  login: string;
  password: string;
};

export type LoginResponse = {
  message?: string;
  full_name?: string;
  home_page?: string;
  [key: string]: unknown;
};

export type AuthMeResponse = {
  user_id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  roles?: string[];
  [key: string]: unknown;
};

export type CreateUserAccountRequest = {
  email: string;
  password: string;
  first_name: string;
  last_name?: string;
  roles: string[];
  enabled?: boolean;
};

export type UserAccount = {
  user_id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  enabled?: boolean;
  roles?: string[];
  [key: string]: unknown;
};

export type ListUsersParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export type RoleMasterItem = {
  value: string;
  label: string;
  is_default?: boolean;
  is_custom?: boolean;
  assignable?: boolean;
};

export type CreateRoleRequest = {
  role_name: string;
};
