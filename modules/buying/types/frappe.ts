export type FrappeListResponse<T> = {
  data: T[];
};

export type FrappeDocResponse<T> = {
  data: T;
};

export type FrappeApiError = {
  status?: number;
  data: unknown;
};
