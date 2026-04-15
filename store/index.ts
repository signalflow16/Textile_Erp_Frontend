"use client";

import { configureStore } from "@reduxjs/toolkit";

import stockReducer from "@/modules/stock/store/stockSlice";
import stockReportsReducer from "@/modules/stock/store/stockReportSlice";
import documentEngineReducer from "@/modules/shared/document/store/documentEngineSlice";
import { frappeApi } from "@/core/api/frappeApi";
import authReducer from "@/core/store/authSlice";
import lookupCacheReducer from "@/modules/stock/store/lookupCacheSlice";
import sessionReducer from "@/core/store/sessionSlice";
import itemGroupsReducer from "@/modules/stock/store/itemGroupSlice";
import itemsReducer from "@/modules/stock/store/itemsSlice";
import partiesReducer from "@/modules/stock/store/partySlice";
import warehousesReducer from "@/modules/stock/store/warehouseSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    documentEngine: documentEngineReducer,
    itemGroups: itemGroupsReducer,
    items: itemsReducer,
    lookupCache: lookupCacheReducer,
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
