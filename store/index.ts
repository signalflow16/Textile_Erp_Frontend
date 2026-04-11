"use client";

import { configureStore } from "@reduxjs/toolkit";

import { frappeApi } from "@/store/api/frappeApi";
import authReducer from "@/store/features/auth/authSlice";
import itemsUiReducer from "@/store/features/items/itemsUiSlice";
import sessionReducer from "@/store/features/session/sessionSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    itemsUi: itemsUiReducer,
    session: sessionReducer,
    [frappeApi.reducerPath]: frappeApi.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(frappeApi.middleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
