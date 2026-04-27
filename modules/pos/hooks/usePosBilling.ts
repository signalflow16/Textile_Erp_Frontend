import { useCallback, useEffect, useMemo, useState } from "react";

import {
  useCreatePosInvoiceMutation,
  useLazyGetItemStockQtyQuery,
  useLazyGetPosItemMetaQuery,
  useLazyGetPosItemSellingRateQuery,
  useLazySearchPosItemsQuery,
  useListPosPaymentModesQuery,
  useSubmitPosInvoiceMutation,
  useUpdatePosInvoiceMutation
} from "@/modules/pos/api/posApi";
import { useListWarehousesQuery } from "@/modules/buying/api/buyingApi";
import { defaultWalkInCustomer } from "@/modules/pos/hooks/usePosCustomerSearch";
import type { PosCartItem, PosFormState, PosItemLookup, PosInvoiceDoc, PosSession } from "@/modules/pos/types/pos";
import { calcPosTotals } from "@/modules/pos/utils/posCalculations";
import { toPosInvoicePayload } from "@/modules/pos/utils/posPayloadMapper";
import { openErpNextPrintPreview } from "@/modules/pos/utils/printBill";
import { createEmptyPosRow, normalizePosRows, toBillableRows } from "@/modules/pos/utils/rowCompletion";
import { validatePosBeforeSave, validatePosBeforeSubmit } from "@/modules/pos/utils/posValidation";
import { createOrUpdatePosBillDraft, submitPosBill } from "@/modules/pos/utils/posSessionService";
import { variantSelectionError } from "@/modules/shared/variants/variant-utils";

const today = () => new Date().toISOString().slice(0, 10);

const createDefaultForm = (session?: PosSession | null): PosFormState => ({
  customer: session?.default_customer ?? defaultWalkInCustomer,
  pos_profile: session?.pos_profile,
  pos_opening_entry: session?.name,
  posting_date: today(),
  paid_amount: undefined,
  mode_of_payment: undefined,
  remarks: undefined,
  set_warehouse: session?.warehouse
});

const toPositiveNumber = (value: number, fallback = 0) => {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(value, 0);
};

const toLookupKey = (value?: string) => value?.trim().toLowerCase() ?? "";

const buildNewCartItem = (item: PosItemLookup, warehouse?: string): PosCartItem => ({
  rowId: createEmptyPosRow().rowId,
  item_code: item.value,
  item_name: item.item_name ?? item.label,
  hs_code: item.hs_code,
  uom: item.stock_uom ?? "Nos",
  qty: 1,
  rate: item.standard_rate ?? 0,
  discount_percentage: 0,
  discount_amount: 0,
  barcode: item.barcode,
  warehouse,
  variant_of: item.variant_of,
  color: item.color,
  size: item.size,
  design: item.design,
  has_batch_no: item.has_batch_no ?? 0
});

export const usePosBilling = ({ session }: { session?: PosSession | null }) => {
  const [form, setForm] = useState<PosFormState>(() => createDefaultForm(session));
  const [cartItems, setCartItems] = useState<PosCartItem[]>([createEmptyPosRow()]);
  const [draftDocName, setDraftDocName] = useState<string | null>(null);
  const [lastSubmittedInvoiceName, setLastSubmittedInvoiceName] = useState<string | null>(null);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      customer: prev.customer || session?.default_customer || defaultWalkInCustomer,
      pos_profile: session?.pos_profile,
      pos_opening_entry: session?.name,
      set_warehouse: prev.set_warehouse ?? session?.warehouse
    }));
  }, [session?.default_customer, session?.name, session?.pos_profile, session?.warehouse]);

  const [createPosInvoice, createState] = useCreatePosInvoiceMutation();
  const [updatePosInvoice, updateState] = useUpdatePosInvoiceMutation();
  const [submitPosInvoice, submitState] = useSubmitPosInvoiceMutation();
  const [fetchStockQty] = useLazyGetItemStockQtyQuery();
  const [fetchPosItemMeta] = useLazyGetPosItemMetaQuery();
  const [fetchPosItemSellingRate] = useLazyGetPosItemSellingRateQuery();
  const [searchPosItems] = useLazySearchPosItemsQuery();

  const paymentModesQuery = useListPosPaymentModesQuery();
  const warehousesQuery = useListWarehousesQuery();

  const billableRows = useMemo(() => toBillableRows(cartItems), [cartItems]);
  const totals = useMemo(() => calcPosTotals(billableRows), [billableRows]);
  const paymentModes = useMemo(() => {
    if (paymentModesQuery.data?.length) {
      return paymentModesQuery.data;
    }

    return [
      { label: "Cash", value: "Cash" },
      { label: "UPI", value: "UPI" },
      { label: "Card", value: "Card" }
    ];
  }, [paymentModesQuery.data]);

  const paidAmount = typeof form.paid_amount === "number" ? form.paid_amount : totals.grandTotal;
  const balanceAmount = Number((paidAmount - totals.grandTotal).toFixed(2));

  const updateForm = useCallback((patch: Partial<PosFormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const syncRows = useCallback((updater: (rows: PosCartItem[]) => PosCartItem[]) => {
    setCartItems((prev) => normalizePosRows(updater(prev)));
  }, []);

  const updateStockForRow = useCallback(async (itemCode: string, warehouse?: string) => {
    if (!warehouse) {
      return undefined;
    }

    const qty = await fetchStockQty({ itemCode, warehouse }, true).unwrap();
    return qty;
  }, [fetchStockQty]);

  const refreshStockByWarehouse = useCallback(async (warehouse?: string) => {
    if (!warehouse || !cartItems.length) {
      syncRows((prev) =>
        prev.map((row) => ({
          ...row,
          warehouse,
          available_qty: warehouse ? row.available_qty : undefined
        }))
      );
      return;
    }

    const stockRows = await Promise.all(
      cartItems.filter((row) => row.item_code).map(async (row) => ({
        rowId: row.rowId,
        available_qty: await updateStockForRow(row.item_code, warehouse)
      }))
    );

    syncRows((prev) =>
      prev.map((row) => {
        const matched = stockRows.find((entry) => entry.rowId === row.rowId);
        return {
          ...row,
          warehouse,
          available_qty: matched?.available_qty
        };
      })
    );
  }, [cartItems, syncRows, updateStockForRow]);

  const setWarehouse = useCallback(async (warehouse?: string) => {
    updateForm({ set_warehouse: warehouse });
    await refreshStockByWarehouse(warehouse);
  }, [refreshStockByWarehouse, updateForm]);

  const resolveItemMeta = useCallback(async (item: PosItemLookup) => {
    const detail = await fetchPosItemMeta(item.value, true).unwrap();
    return detail;
  }, [fetchPosItemMeta]);

  const applyItemToRow = useCallback(async (rowId: string, item: PosItemLookup, options?: { incrementQtyOnly?: boolean }) => {
    const selectionError = variantSelectionError({
      item_code: item.value,
      variant_of: item.variant_of,
      has_variants: item.has_variants
    });
    if (selectionError) {
      throw new Error(selectionError);
    }

    const warehouse = form.set_warehouse;
    const [detail, stockQty, sellingRate] = await Promise.all([
      resolveItemMeta(item),
      updateStockForRow(item.value, warehouse),
      fetchPosItemSellingRate(item.value, true)
        .unwrap()
        .catch(() => null)
    ]);

    const resolvedItemName = item.item_name ?? detail.item_name ?? item.label;
    const resolvedHsCode = item.hs_code ?? detail.hs_code;
    const resolvedBarcode = item.barcode ?? detail.barcode;
    const resolvedUom = item.stock_uom ?? detail.stock_uom ?? "Nos";
    const resolvedRate =
      (typeof item.standard_rate === "number" && item.standard_rate > 0 ? item.standard_rate : undefined) ??
      (typeof detail.standard_rate === "number" && detail.standard_rate > 0 ? detail.standard_rate : undefined) ??
      (typeof sellingRate === "number" && sellingRate > 0 ? sellingRate : undefined);

    syncRows((prev) =>
      {
        const target = prev.find((row) => row.rowId === rowId);
        const targetQty = target && target.qty > 0 ? target.qty : 1;

        if (options?.incrementQtyOnly) {
          const targetSameItem =
            target && target.item_code && toLookupKey(target.item_code) === toLookupKey(item.value) ? target : undefined;
          if (targetSameItem) {
            return prev.map((row) =>
              row.rowId === rowId
                ? {
                    ...row,
                    item_name: row.item_name ?? resolvedItemName,
                    hs_code: row.hs_code ?? resolvedHsCode,
                    barcode: row.barcode ?? resolvedBarcode,
                    uom: row.uom || resolvedUom,
                    rate: row.rate > 0 ? row.rate : (resolvedRate ?? row.rate),
                    qty: (row.qty > 0 ? row.qty : 0) + 1,
                    available_qty: stockQty
                  }
                : row
            );
          }

          const duplicate = prev.find(
            (row) => row.rowId !== rowId && row.item_code && toLookupKey(row.item_code) === toLookupKey(item.value)
          );
          if (duplicate) {
            return prev
              .filter((row) => row.rowId !== rowId)
              .map((row) =>
                row.rowId === duplicate.rowId
                  ? {
                      ...row,
                      item_name: row.item_name ?? resolvedItemName,
                      hs_code: row.hs_code ?? resolvedHsCode,
                      barcode: row.barcode ?? resolvedBarcode,
                      uom: row.uom || resolvedUom,
                      rate: row.rate > 0 ? row.rate : (resolvedRate ?? row.rate),
                      qty: (row.qty > 0 ? row.qty : 0) + 1,
                      available_qty: stockQty
                    }
                  : row
              );
          }
        }

        return prev.map((row) =>
          row.rowId === rowId
            ? {
                ...row,
                ...buildNewCartItem(item, warehouse),
                rowId,
                qty: row.qty > 0 ? row.qty : targetQty,
                item_name: resolvedItemName ?? row.item_name,
                hs_code: resolvedHsCode ?? row.hs_code,
                barcode: resolvedBarcode ?? row.barcode,
                uom: resolvedUom || row.uom,
                rate: resolvedRate ?? row.rate,
                available_qty: stockQty
              }
            : row
        );
      }
    );
  }, [fetchPosItemSellingRate, form.set_warehouse, resolveItemMeta, syncRows, updateStockForRow]);

  const addItem = useCallback(async (item: PosItemLookup) => {
    const target = cartItems.find((row) => !row.item_code) ?? cartItems[cartItems.length - 1];
    if (!target) {
      return;
    }

    await applyItemToRow(target.rowId, item);
  }, [applyItemToRow, cartItems]);

  const lookupItemByBarcode = useCallback(async (token: string) => {
    const rows = await searchPosItems(token, true).unwrap();
    const normalized = token.trim().toLowerCase();
    const byBarcode = rows.find((row) => (row.barcode ?? "").trim().toLowerCase() === normalized);
    const byCode = rows.find((row) => row.value.trim().toLowerCase() === normalized);
    return byBarcode ?? byCode ?? rows[0];
  }, [searchPosItems]);

  const lookupItemByCode = useCallback(async (itemCode: string) => {
    const token = itemCode.trim();
    if (!token) {
      return null;
    }

    const rows = await searchPosItems(token, true).unwrap();
    const normalized = token.toLowerCase();
    const exact = rows.find((row) => row.value.trim().toLowerCase() === normalized);
    return exact ?? rows[0] ?? null;
  }, [searchPosItems]);

  const applyItemCodeToRow = useCallback(async (rowId: string, itemCode: string) => {
    const detail = await fetchPosItemMeta(itemCode, true).unwrap();
    const detailMapped: PosItemLookup | null = detail.value
      ? {
          value: detail.value,
          label: detail.item_name ?? detail.label ?? detail.value,
          item_name: detail.item_name ?? detail.label ?? detail.value,
          stock_uom: detail.stock_uom,
          standard_rate: detail.standard_rate,
          barcode: detail.barcode,
          variant_of: detail.variant_of,
          has_variants: detail.has_variants,
          has_batch_no: detail.has_batch_no,
          color: detail.color,
          size: detail.size,
          design: detail.design,
          hs_code: detail.hs_code
        }
      : null;
    const matched = detailMapped ?? (await lookupItemByCode(itemCode));
    if (!matched) {
      return false;
    }

    await applyItemToRow(rowId, matched);
    return true;
  }, [applyItemToRow, lookupItemByCode]);

  const applyBarcodeToRow = useCallback(async (rowId: string, barcode: string) => {
    const token = barcode.trim();
    if (!token) {
      return false;
    }

    const matched = await lookupItemByBarcode(token);
    if (!matched) {
      return false;
    }

    try {
      await applyItemToRow(rowId, {
        ...matched,
        barcode: token
      }, { incrementQtyOnly: true });
      return true;
    } catch {
      return false;
    }
  }, [applyItemToRow, lookupItemByBarcode]);

  const updateCartItem = useCallback((rowId: string, patch: Partial<PosCartItem>) => {
    syncRows((prev) =>
      prev.map((row) => {
        if (row.rowId !== rowId) {
          return row;
        }

        const nextQty = patch.qty === undefined ? row.qty : toPositiveNumber(patch.qty, row.qty);
        const nextRate = patch.rate === undefined ? row.rate : toPositiveNumber(patch.rate, row.rate);

        return {
          ...row,
          ...patch,
          qty: nextQty,
          rate: nextRate,
          discount_percentage:
            patch.discount_percentage === undefined
              ? row.discount_percentage
              : toPositiveNumber(patch.discount_percentage, row.discount_percentage),
          discount_amount:
            patch.discount_amount === undefined
              ? row.discount_amount
              : toPositiveNumber(patch.discount_amount, row.discount_amount)
        };
      })
    );
  }, [syncRows]);

  const removeCartItem = useCallback((rowId: string) => {
    syncRows((prev) => {
      const next = prev.filter((row) => row.rowId !== rowId);
      return next.length ? next : [createEmptyPosRow()];
    });
  }, [syncRows]);

  const clearCart = useCallback(() => {
    setCartItems([createEmptyPosRow()]);
    setDraftDocName(null);
    setLastSubmittedInvoiceName(null);
  }, []);

  const toPayload = useCallback(() => toPosInvoicePayload(form, billableRows), [billableRows, form]);

  const saveDraft = useCallback(async (): Promise<PosInvoiceDoc> => {
    const validationError = validatePosBeforeSave(form, billableRows);
    if (validationError) {
      throw new Error(validationError);
    }

    const payload = toPayload();
    const saved = await createOrUpdatePosBillDraft(() =>
      draftDocName
        ? updatePosInvoice({ name: draftDocName, values: payload }).unwrap()
        : createPosInvoice(payload).unwrap()
    );
    if (saved.name) {
      setDraftDocName(saved.name);
    }
    return saved;
  }, [billableRows, createPosInvoice, draftDocName, form, toPayload, updatePosInvoice]);

  const saveAndSubmit = useCallback(async (): Promise<PosInvoiceDoc> => {
    const validationError = validatePosBeforeSubmit(form, billableRows);
    if (validationError) {
      throw new Error(validationError);
    }

    const saved = await saveDraft();
    const name = saved.name ?? draftDocName;
    if (!name) {
      throw new Error("Unable to submit bill because invoice number is missing.");
    }

    const submitted = await submitPosBill(() => submitPosInvoice(name).unwrap());
    setDraftDocName(submitted.name ?? name);
    setLastSubmittedInvoiceName(submitted.name ?? name);
    return submitted;
  }, [billableRows, draftDocName, form, saveDraft, submitPosInvoice]);

  const resetForNextBill = useCallback(() => {
    setForm(createDefaultForm(session));
    setCartItems([createEmptyPosRow()]);
    setDraftDocName(null);
    setLastSubmittedInvoiceName(null);
  }, [session]);

  return {
    form,
    cartItems,
    totals,
    paymentModes,
    warehouseOptions: warehousesQuery.data ?? [],
    billableRows,
    draftDocName,
    lastSubmittedInvoiceName,
    paidAmount,
    balanceAmount,
    isSaving: createState.isLoading || updateState.isLoading,
    isSubmitting: submitState.isLoading,
    isPaymentModesLoading: paymentModesQuery.isLoading,
    isWarehousesLoading: warehousesQuery.isLoading,
    updateForm,
    setWarehouse,
    addItem,
    applyItemToRow,
    applyItemCodeToRow,
    applyBarcodeToRow,
    updateCartItem,
    removeCartItem,
    clearCart,
    saveDraft,
    saveAndSubmit,
    resetForNextBill,
    printBill: () => {
      const docName = lastSubmittedInvoiceName ?? draftDocName;
      if (!docName) {
        return false;
      }
      openErpNextPrintPreview("Sales Invoice", docName);
      return true;
    }
  };
};
