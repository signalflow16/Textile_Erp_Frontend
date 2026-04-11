"use client";

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { AuthMeResponse } from "@/types/auth";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  me: AuthMeResponse | null;
  hydrated: boolean;
};

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  me: null,
  hydrated: false
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    hydrateAuthTokens(
      state,
      action: PayloadAction<{ accessToken: string | null; refreshToken: string | null }>
    ) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
    setTokens(
      state,
      action: PayloadAction<{ accessToken: string | null; refreshToken: string | null }>
    ) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
    setAccessToken(state, action: PayloadAction<string | null>) {
      state.accessToken = action.payload;
    },
    setAuthMe(state, action: PayloadAction<AuthMeResponse | null>) {
      state.me = action.payload;
    },
    clearAuth(state) {
      state.accessToken = null;
      state.refreshToken = null;
      state.me = null;
    },
    setAuthHydrated(state, action: PayloadAction<boolean>) {
      state.hydrated = action.payload;
    }
  }
});

export const {
  clearAuth,
  hydrateAuthTokens,
  setAccessToken,
  setAuthHydrated,
  setAuthMe,
  setTokens
} = authSlice.actions;

export default authSlice.reducer;
