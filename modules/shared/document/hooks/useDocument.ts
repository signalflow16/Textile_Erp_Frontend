"use client";

import { useEffect, useMemo } from "react";

import { computeDocumentTotals, createDocumentLine, documentConfigs, normalizeDocumentLine } from "@/modules/shared/document/api/documentEngine";
import { fetchLookupCache } from "@/modules/shared/document/store/lookupCache";
import { useAppDispatch, useAppSelector } from "@/core/store/hooks";
import {
  createEmptyDraftDocument,
  fetchDocumentDetail,
  hydrateDocumentRow,
  saveDocumentDraft,
  cancelDocument,
  selectDocumentDetail,
  selectDocumentModule,
  selectDocumentValidations,
  setDraftDocumentRows,
  submitDocument,
  validateDocumentRows
} from "@/modules/shared/document/store/documentEngineSlice";
import type { DocumentEngineConfig, DocumentLineItem, DocumentRecord } from "@/modules/shared/document/types/document-engine";

export function useDocument({
  doctype,
  name
}: {
  doctype: DocumentEngineConfig["doctype"];
  name: string;
}) {
  const dispatch = useAppDispatch();
  const config = useMemo(
    () => Object.values(documentConfigs).find((entry) => entry.doctype === doctype) as DocumentEngineConfig,
    [doctype]
  );
  const moduleState = useAppSelector((state) => selectDocumentModule(state, config.key));
  const document = useAppSelector((state) => selectDocumentDetail(state, config.key, name));
  const validations = useAppSelector((state) => selectDocumentValidations(state, config.key, name));
  const lookupCache = useAppSelector((state) => state.lookupCache);

  useEffect(() => {
    void dispatch(fetchLookupCache({ key: "items" }));
    void dispatch(fetchLookupCache({ key: "warehouses" }));
    void dispatch(fetchLookupCache({ key: "uoms" }));
    void dispatch(fetchLookupCache({ key: "priceLists" }));
    void dispatch(fetchLookupCache({ key: config.partyField === "supplier" ? "suppliers" : "customers" }));
  }, [config.partyField, dispatch]);

  useEffect(() => {
    if (name.startsWith("__draft__")) {
      if (!document) {
        dispatch(
          createEmptyDraftDocument({
            key: config.key,
            name,
            document: {
              posting_date: new Date().toISOString().slice(0, 10),
              posting_time: new Date().toTimeString().slice(0, 8),
              currency: "INR",
              items: [createDocumentLine()]
            }
          })
        );
      }
      return;
    }

    if (!document && moduleState.commands.detailStatus[name] !== "loading") {
      void dispatch(fetchDocumentDetail({ key: config.key, name }));
    }
  }, [config.key, dispatch, document, moduleState.commands.detailStatus, name]);

  useEffect(() => {
    if (!document) {
      return;
    }

    void dispatch(
      validateDocumentRows({
        key: config.key,
        documentName: document.name,
        rows: document.items ?? [],
        defaultWarehouse: document.set_warehouse ?? undefined
      })
    );
  }, [config.key, dispatch, document]);

  const totals = useMemo(
    () => computeDocumentTotals(document?.items ?? [], document?.taxes ?? []),
    [document?.items, document?.taxes]
  );

  const lookups = useMemo(
    () => ({
      parties: lookupCache[config.partyField === "supplier" ? "suppliers" : "customers"].items,
      items: lookupCache.items.items,
      warehouses: lookupCache.warehouses.items,
      uoms: lookupCache.uoms.items,
      priceLists: lookupCache.priceLists.items
    }),
    [config.partyField, lookupCache]
  );

  const setField = <K extends keyof DocumentRecord>(field: K, value: DocumentRecord[K]) => {
    if (!document) {
      return;
    }

    dispatch(
      createEmptyDraftDocument({
        key: config.key,
        name: document.name,
        document: {
          ...document,
          [field]: value
        }
      })
    );
  };

  const updateRows = (rows: DocumentLineItem[]) => {
    if (!document) {
      return;
    }
    dispatch(setDraftDocumentRows({ key: config.key, name: document.name, items: rows.map(normalizeDocumentLine) }));
  };

  const updateRow = (rowId: string, patch: Partial<DocumentLineItem>) => {
    if (!document) {
      return;
    }

    const rows = (document.items ?? []).map((row) => (row.id === rowId ? normalizeDocumentLine({ ...row, ...patch }) : row));
    updateRows(rows);

    const updatedRow = rows.find((row) => row.id === rowId);
    if (updatedRow?.item_code) {
      const priceList =
        config.priceListField === "buying_price_list" ? document.buying_price_list : document.selling_price_list;
      void dispatch(
        hydrateDocumentRow({
          key: config.key,
          row: updatedRow,
          party: document.party,
          priceList
        })
      );
    }
  };

  const addRow = () => {
    updateRows([...(document?.items ?? []), createDocumentLine()]);
  };

  const removeRow = (rowId: string) => {
    const rows = (document?.items ?? []).filter((row) => row.id !== rowId);
    updateRows(rows.length > 0 ? rows : [createDocumentLine()]);
  };

  const save = async () => {
    if (!document) {
      return null;
    }
    return dispatch(saveDocumentDraft({ key: config.key, document })).unwrap();
  };

  const submit = async () => {
    if (!document) {
      return null;
    }
    return dispatch(submitDocument({ key: config.key, document })).unwrap();
  };

  const cancel = async () => {
    if (!document?.name || document.name.startsWith("__draft__")) {
      return null;
    }
    return dispatch(cancelDocument({ key: config.key, name: document.name })).unwrap();
  };

  return {
    config,
    document,
    lookups,
    validations,
    totals,
    commands: moduleState.commands,
    isReadonly: document?.docstatus === 1 || document?.docstatus === 2,
    setField,
    updateRows,
    updateRow,
    addRow,
    removeRow,
    save,
    submit,
    cancel
  };
}

