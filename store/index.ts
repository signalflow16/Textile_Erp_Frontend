"use client";

import { configureStore } from "@reduxjs/toolkit";

import { frappeApi } from "@/store/api/frappeApi";
import itemGroupsUiReducer from "@/store/features/itemGroups/itemGroupsUiSlice";
import itemsUiReducer from "@/store/features/items/itemsUiSlice";
import sessionReducer from "@/store/features/session/sessionSlice";

export const store = configureStore({
  reducer: {
    itemGroupsUi: itemGroupsUiReducer,
    itemsUi: itemsUiReducer,
    session: sessionReducer,
    [frappeApi.reducerPath]: frappeApi.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(frappeApi.middleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
