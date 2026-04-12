"use client";

import { configureStore } from "@reduxjs/toolkit";

import { frappeApi } from "@/store/api/frappeApi";
import authReducer from "@/store/features/auth/authSlice";
import sessionReducer from "@/store/features/session/sessionSlice";
import itemGroupsReducer from "@/store/slices/itemGroupSlice";
import itemsReducer from "@/store/slices/itemsSlice";
import partiesReducer from "@/store/slices/partySlice";
import stockReducer from "@/store/slices/stockSlice";
import stockReportsReducer from "@/store/slices/stockReportSlice";
import warehousesReducer from "@/store/slices/warehouseSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    itemGroups: itemGroupsReducer,
    items: itemsReducer,
    parties: partiesReducer,
    session: sessionReducer,
    stock: stockReducer,
    stockReports: stockReportsReducer,
    warehouses: warehousesReducer,
    [frappeApi.reducerPath]: frappeApi.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(frappeApi.middleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
