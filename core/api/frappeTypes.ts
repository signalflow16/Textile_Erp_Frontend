export type FrappeMessageResponse<T> = {
  message: T;
};

export type FrappeListResponse<T> = {
  data: T[];
};

export type SessionStatus = {
  authenticated: boolean;
  user: string | null;
  full_name: string | null;
  site: string;
  csrf_token: string | null;
};

export type FrappeError = {
  message?: string;
  exception?: string;
  exc_type?: string;
  _server_messages?: string;
};
