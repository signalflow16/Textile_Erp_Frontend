"use client";

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { AuthMeResponse } from "@/core/auth/types";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthState = {
  me: AuthMeResponse | null;
  hydrated: boolean;
  status: AuthStatus;
};

const initialState: AuthState = {
  me: null,
  hydrated: false,
  status: "loading"
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthStatus(state, action: PayloadAction<AuthStatus>) {
      state.status = action.payload;
    },
    markAuthenticated(state, action: PayloadAction<Partial<AuthMeResponse> | null | undefined>) {
      state.status = "authenticated";

      if (action.payload) {
        state.me = {
          ...(state.me ?? {}),
          ...action.payload
        };
      }
    },
    setAuthMe(state, action: PayloadAction<AuthMeResponse | null>) {
      state.me = action.payload;
      state.status = action.payload ? "authenticated" : "unauthenticated";
    },
    clearAuth(state) {
      state.me = null;
      state.status = "unauthenticated";
    },
    setAuthHydrated(state, action: PayloadAction<boolean>) {
      state.hydrated = action.payload;
    }
  }
});

export const {
  clearAuth,
  setAuthHydrated,
  setAuthMe,
  setAuthStatus,
  markAuthenticated
} = authSlice.actions;

export default authSlice.reducer;
