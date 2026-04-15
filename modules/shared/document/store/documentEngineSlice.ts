"use client";

import { createAsyncThunk, createEntityAdapter, createSlice } from "@reduxjs/toolkit";

import { normalizeFrappeError } from "@/core/api/frappeErrors";
import {
  cancelDocumentApi,
  createDocumentLine,
  documentConfigs,
  fetchDocumentDetailApi,
  fetchDocumentListApi,
  normalizeDocumentLine,
  resolveItemPricing,
  resolveUomConversion,
  saveDocumentDraftApi,
  submitDocumentApi,
  validateStockAvailability
} from "@/modules/shared/document/api/documentEngine";
import { stockEvents } from "@/core/store/stockEvents";
import type { RootState } from "@/store";
import type {
  DocumentEngineConfig,
  DocumentEngineState,
  DocumentLineItem,
  DocumentListFilters,
  DocumentListRow,
  DocumentModuleState,
  DocumentRecord,
  DocumentTaxLine,
  RowStockValidation
} from "@/modules/shared/document/types/document-engine";

const createListAdapter = () =>
  createEntityAdapter<DocumentListRow, string>({
    selectId: (entry) => entry.name,
    sortComparer: (left, right) => `${right.posting_date ?? ""} ${right.name}`.localeCompare(`${left.posting_date ?? ""} ${left.name}`)
  });

const purchaseAdapter = createListAdapter();
const salesAdapter = createListAdapter();

const createModuleState = (adapter: ReturnType<typeof createListAdapter>): DocumentModuleState => ({
  list: adapter.getInitialState(),
  pagination: {
    current: 1,
    pageSize: 20,
    total: 0
  },
  details: {},
  validations: {},
  commands: {
    listStatus: "idle",
    listError: null,
    detailStatus: {},
    detailError: {},
    saveStatus: "idle",
    saveError: null,
    submitStatus: "idle",
    submitError: null,
    cancelStatus: "idle",
    cancelError: null
  }
});

const initialState: DocumentEngineState = {
  purchaseReceipt: createModuleState(purchaseAdapter),
  salesInvoice: createModuleState(salesAdapter)
};

const getAdapter = (key: DocumentEngineConfig["key"]) => (key === "purchaseReceipt" ? purchaseAdapter : salesAdapter);

export const fetchDocumentList = createAsyncThunk<
  { key: DocumentEngineConfig["key"]; rows: DocumentListRow[]; total: number; page: number; pageSize: number },
  { key: DocumentEngineConfig["key"]; filters?: DocumentListFilters },
  { rejectValue: { key: DocumentEngineConfig["key"]; message: string } }
>("documentEngine/fetchList", async ({ key, filters }, thunkApi) => {
  try {
    return {
      key,
      ...(await fetchDocumentListApi(documentConfigs[key], filters))
    };
  } catch (error) {
    return thunkApi.rejectWithValue({
      key,
      message: normalizeFrappeError(error, "Unable to fetch documents.").message
    });
  }
});

export const fetchDocumentDetail = createAsyncThunk<
  { key: DocumentEngineConfig["key"]; document: DocumentRecord },
  { key: DocumentEngineConfig["key"]; name: string },
  { rejectValue: { key: DocumentEngineConfig["key"]; name: string; message: string } }
>("documentEngine/fetchDetail", async ({ key, name }, thunkApi) => {
  try {
    return {
      key,
      document: await fetchDocumentDetailApi(documentConfigs[key], name)
    };
  } catch (error) {
    return thunkApi.rejectWithValue({
      key,
      name,
      message: normalizeFrappeError(error, "Unable to fetch document details.").message
    });
  }
});

export const saveDocumentDraft = createAsyncThunk<
  { key: DocumentEngineConfig["key"]; document: DocumentRecord },
  { key: DocumentEngineConfig["key"]; document: Partial<DocumentRecord> },
  { rejectValue: { key: DocumentEngineConfig["key"]; message: string } }
>("documentEngine/saveDraft", async ({ key, document }, thunkApi) => {
  try {
    const saved = await saveDocumentDraftApi(documentConfigs[key], document);
    thunkApi.dispatch(
      stockEvents.documentDraftSaved({
        doctype: documentConfigs[key].doctype,
        name: saved.name,
        postingDate: saved.posting_date
      })
    );
    return { key, document: saved };
  } catch (error) {
    return thunkApi.rejectWithValue({
      key,
      message: normalizeFrappeError(error, "Unable to save draft.").message
    });
  }
});

export const submitDocument = createAsyncThunk<
  { key: DocumentEngineConfig["key"]; document: DocumentRecord },
  { key: DocumentEngineConfig["key"]; document: Partial<DocumentRecord> },
  { rejectValue: { key: DocumentEngineConfig["key"]; message: string } }
>("documentEngine/submit", async ({ key, document }, thunkApi) => {
  try {
    const submitted = await submitDocumentApi(documentConfigs[key], document);
    thunkApi.dispatch(
      stockEvents.documentSubmitted({
        doctype: documentConfigs[key].doctype,
        name: submitted.name,
        postingDate: submitted.posting_date,
        warehouses: [
          submitted.set_warehouse,
          ...(submitted.items ?? []).map((row) => row.warehouse || row.source_warehouse || row.target_warehouse)
        ].filter((value): value is string => Boolean(value))
      })
    );
    return { key, document: submitted };
  } catch (error) {
    return thunkApi.rejectWithValue({
      key,
      message: normalizeFrappeError(error, "Unable to submit document.").message
    });
  }
});

export const cancelDocument = createAsyncThunk<
  { key: DocumentEngineConfig["key"]; document: DocumentRecord },
  { key: DocumentEngineConfig["key"]; name: string },
  { rejectValue: { key: DocumentEngineConfig["key"]; message: string } }
>("documentEngine/cancel", async ({ key, name }, thunkApi) => {
  try {
    const cancelled = await cancelDocumentApi(documentConfigs[key], name);
    thunkApi.dispatch(
      stockEvents.documentCancelled({
        doctype: documentConfigs[key].doctype,
        name: cancelled.name,
        postingDate: cancelled.posting_date,
        warehouses: [
          cancelled.set_warehouse,
          ...(cancelled.items ?? []).map((row) => row.warehouse || row.source_warehouse || row.target_warehouse)
        ].filter((value): value is string => Boolean(value))
      })
    );
    return { key, document: cancelled };
  } catch (error) {
    return thunkApi.rejectWithValue({
      key,
      message: normalizeFrappeError(error, "Unable to cancel document.").message
    });
  }
});

export const hydrateDocumentRow = createAsyncThunk<
  { key: DocumentEngineConfig["key"]; rowId: string; row: DocumentLineItem },
  { key: DocumentEngineConfig["key"]; row: DocumentLineItem; party?: string | null; priceList?: string | null },
  { rejectValue: { key: DocumentEngineConfig["key"]; rowId: string; message: string } }
>("documentEngine/hydrateRow", async ({ key, row, party, priceList }, thunkApi) => {
  try {
    const config = documentConfigs[key];
    const pricing = row.manual_rate
      ? { rate: row.rate, source: "manual" as const, currency: null }
      : await resolveItemPricing({
          itemCode: row.item_code,
          party,
          priceList,
          pricingMode: config.pricingMode
        });

    const conversion = await resolveUomConversion(row.item_code, row.uom, row.stock_uom);
    return {
      key,
      rowId: row.id,
      row: normalizeDocumentLine({
        ...row,
        conversion_factor: conversion.conversionFactor,
        rate: pricing.rate || row.rate,
        pricing_source: pricing.source,
        warning: conversion.warning ?? null
      })
    };
  } catch (error) {
    return thunkApi.rejectWithValue({
      key,
      rowId: row.id,
      message: normalizeFrappeError(error, "Unable to update row pricing or conversion.").message
    });
  }
});

export const validateDocumentRows = createAsyncThunk<
  { key: DocumentEngineConfig["key"]; documentName: string; validations: RowStockValidation[] },
  { key: DocumentEngineConfig["key"]; documentName: string; rows: DocumentLineItem[]; defaultWarehouse?: string },
  { rejectValue: { key: DocumentEngineConfig["key"]; documentName: string; message: string } }
>("documentEngine/validateRows", async ({ key, documentName, rows, defaultWarehouse }, thunkApi) => {
  try {
    const config = documentConfigs[key];
    const validations = await Promise.all(
      rows
        .filter((row) => row.item_code)
        .map(async (row) => {
          const warehouse =
            config.warehouseMode === "source"
              ? row.warehouse || row.source_warehouse || defaultWarehouse
              : row.warehouse || row.target_warehouse || defaultWarehouse;

          const validation = config.stockValidation
            ? await validateStockAvailability({
                itemCode: row.item_code,
                warehouse,
                requiredQty: row.stock_qty
              })
            : {
                rowId: row.id,
                warehouse,
                availableQty: 0,
                requiredQty: row.stock_qty,
                shortageQty: 0,
                ok: true
              };

          return {
            ...validation,
            rowId: row.id
          };
        })
    );

    return { key, documentName, validations };
  } catch (error) {
    return thunkApi.rejectWithValue({
      key,
      documentName,
      message: normalizeFrappeError(error, "Unable to validate stock.").message
    });
  }
});

const applyDocumentToState = (moduleState: DocumentModuleState, key: DocumentEngineConfig["key"], document: DocumentRecord) => {
  moduleState.details[document.name] = document;
  getAdapter(key).upsertOne(moduleState.list, {
    name: document.name,
    party: document.party,
    posting_date: document.posting_date,
    posting_time: document.posting_time,
    docstatus: document.docstatus,
    grand_total: document.grand_total,
    currency: document.currency,
    set_warehouse: document.set_warehouse,
    modified: document.modified
  });
};

const documentEngineSlice = createSlice({
  name: "documentEngine",
  initialState,
  reducers: {
    upsertDraftDocument: (
      state,
      action: {
        payload: {
          key: DocumentEngineConfig["key"];
          document: DocumentRecord;
        };
      }
    ) => {
      applyDocumentToState(state[action.payload.key], action.payload.key, action.payload.document);
    },
    setDraftDocumentRows: (
      state,
      action: {
        payload: {
          key: DocumentEngineConfig["key"];
          name: string;
          items: DocumentLineItem[];
        };
      }
    ) => {
      const document = state[action.payload.key].details[action.payload.name];
      if (document) {
        document.items = action.payload.items.map(normalizeDocumentLine);
      }
    },
    setDraftDocumentTaxes: (
      state,
      action: {
        payload: {
          key: DocumentEngineConfig["key"];
          name: string;
          taxes: DocumentTaxLine[];
        };
      }
    ) => {
      const document = state[action.payload.key].details[action.payload.name];
      if (document) {
        document.taxes = action.payload.taxes;
      }
    },
    createEmptyDraftDocument: (
      state,
      action: {
        payload: {
          key: DocumentEngineConfig["key"];
          name: string;
          document: Partial<DocumentRecord>;
        };
      }
    ) => {
      state[action.payload.key].details[action.payload.name] = {
        name: action.payload.name,
        party: action.payload.document.party ?? null,
        posting_date: action.payload.document.posting_date ?? null,
        posting_time: action.payload.document.posting_time ?? null,
        set_warehouse: action.payload.document.set_warehouse ?? null,
        buying_price_list: action.payload.document.buying_price_list ?? null,
        selling_price_list: action.payload.document.selling_price_list ?? null,
        currency: action.payload.document.currency ?? "INR",
        docstatus: action.payload.document.docstatus ?? 0,
        remarks: action.payload.document.remarks ?? null,
        items: action.payload.document.items?.length ? action.payload.document.items : [createDocumentLine()],
        taxes: action.payload.document.taxes?.length ? action.payload.document.taxes : [],
        total: 0,
        grand_total: 0,
        rounded_total: 0,
        base_grand_total: 0,
        modified: null,
        owner: null,
        creation: null,
        modified_by: null
      };
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDocumentList.pending, (state, action) => {
        state[action.meta.arg.key].commands.listStatus = "loading";
        state[action.meta.arg.key].commands.listError = null;
      })
      .addCase(fetchDocumentList.fulfilled, (state, action) => {
        const moduleState = state[action.payload.key];
        moduleState.commands.listStatus = "succeeded";
        moduleState.pagination = {
          current: action.payload.page,
          pageSize: action.payload.pageSize,
          total: action.payload.total
        };
        getAdapter(action.payload.key).setAll(moduleState.list, action.payload.rows);
      })
      .addCase(fetchDocumentList.rejected, (state, action) => {
        if (!action.payload) {
          return;
        }
        state[action.payload.key].commands.listStatus = "failed";
        state[action.payload.key].commands.listError = action.payload.message;
      })
      .addCase(fetchDocumentDetail.pending, (state, action) => {
        state[action.meta.arg.key].commands.detailStatus[action.meta.arg.name] = "loading";
        state[action.meta.arg.key].commands.detailError[action.meta.arg.name] = undefined;
      })
      .addCase(fetchDocumentDetail.fulfilled, (state, action) => {
        const moduleState = state[action.payload.key];
        moduleState.commands.detailStatus[action.payload.document.name] = "succeeded";
        applyDocumentToState(moduleState, action.payload.key, action.payload.document);
      })
      .addCase(fetchDocumentDetail.rejected, (state, action) => {
        if (!action.payload) {
          return;
        }
        state[action.payload.key].commands.detailStatus[action.payload.name] = "failed";
        state[action.payload.key].commands.detailError[action.payload.name] = action.payload.message;
      })
      .addCase(saveDocumentDraft.pending, (state, action) => {
        state[action.meta.arg.key].commands.saveStatus = "loading";
        state[action.meta.arg.key].commands.saveError = null;
      })
      .addCase(saveDocumentDraft.fulfilled, (state, action) => {
        state[action.payload.key].commands.saveStatus = "succeeded";
        applyDocumentToState(state[action.payload.key], action.payload.key, action.payload.document);
      })
      .addCase(saveDocumentDraft.rejected, (state, action) => {
        if (!action.payload) {
          return;
        }
        state[action.payload.key].commands.saveStatus = "failed";
        state[action.payload.key].commands.saveError = action.payload.message;
      })
      .addCase(submitDocument.pending, (state, action) => {
        state[action.meta.arg.key].commands.submitStatus = "loading";
        state[action.meta.arg.key].commands.submitError = null;
      })
      .addCase(submitDocument.fulfilled, (state, action) => {
        state[action.payload.key].commands.submitStatus = "succeeded";
        applyDocumentToState(state[action.payload.key], action.payload.key, action.payload.document);
      })
      .addCase(submitDocument.rejected, (state, action) => {
        if (!action.payload) {
          return;
        }
        state[action.payload.key].commands.submitStatus = "failed";
        state[action.payload.key].commands.submitError = action.payload.message;
      })
      .addCase(cancelDocument.pending, (state, action) => {
        state[action.meta.arg.key].commands.cancelStatus = "loading";
        state[action.meta.arg.key].commands.cancelError = null;
      })
      .addCase(cancelDocument.fulfilled, (state, action) => {
        state[action.payload.key].commands.cancelStatus = "succeeded";
        applyDocumentToState(state[action.payload.key], action.payload.key, action.payload.document);
      })
      .addCase(cancelDocument.rejected, (state, action) => {
        if (!action.payload) {
          return;
        }
        state[action.payload.key].commands.cancelStatus = "failed";
        state[action.payload.key].commands.cancelError = action.payload.message;
      })
      .addCase(hydrateDocumentRow.fulfilled, (state, action) => {
        const moduleState = state[action.payload.key];
        Object.values(moduleState.details).forEach((document) => {
          const rowIndex = document?.items?.findIndex((row) => row.id === action.payload.rowId) ?? -1;
          if (document?.items && rowIndex >= 0) {
            document.items[rowIndex] = action.payload.row;
          }
        });
      })
      .addCase(validateDocumentRows.fulfilled, (state, action) => {
        state[action.payload.key].validations[action.payload.documentName] = action.payload.validations;
      });
  }
});

export const {
  createEmptyDraftDocument,
  setDraftDocumentRows,
  setDraftDocumentTaxes,
  upsertDraftDocument
} = documentEngineSlice.actions;

export const selectDocumentModule = (state: RootState, key: DocumentEngineConfig["key"]) => state.documentEngine[key];
export const selectDocumentList = (state: RootState, key: DocumentEngineConfig["key"]) =>
  getAdapter(key).getSelectors<RootState>((root) => root.documentEngine[key].list).selectAll(state);
export const selectDocumentDetail = (state: RootState, key: DocumentEngineConfig["key"], name: string) =>
  state.documentEngine[key].details[name];
export const selectDocumentValidations = (state: RootState, key: DocumentEngineConfig["key"], name: string) =>
  state.documentEngine[key].validations[name] ?? [];

export default documentEngineSlice.reducer;
