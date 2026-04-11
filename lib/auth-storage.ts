const ACCESS_TOKEN_KEY = "textile_erp_access_token";
const REFRESH_TOKEN_KEY = "textile_erp_refresh_token";

export type StoredAuthTokens = {
  accessToken: string | null;
  refreshToken: string | null;
};

const isBrowser = () => typeof window !== "undefined";

export const loadAuthTokens = (): StoredAuthTokens => {
  if (!isBrowser()) {
    return {
      accessToken: null,
      refreshToken: null
    };
  }

  return {
    accessToken: window.localStorage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: window.localStorage.getItem(REFRESH_TOKEN_KEY)
  };
};

export const saveAuthTokens = ({ accessToken, refreshToken }: StoredAuthTokens) => {
  if (!isBrowser()) {
    return;
  }

  if (accessToken) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  } else {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  }

  if (refreshToken) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } else {
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};

export const clearAuthTokens = () => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
};
