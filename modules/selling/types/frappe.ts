export type FrappeApiError = {
  status?: number;
  data: unknown;
};

export type FrappeDocResponse<T> = {
  data: T;
};

export type FrappeListResponse<T> = {
  data: T[];
};
