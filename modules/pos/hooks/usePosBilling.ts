import { useCallback, useEffect, useMemo, useState } from "react";

import { useAppSelector } from "@/core/store/hooks";
import { useListWarehousesQuery } from "@/modules/buying/api/buyingApi";
import {
  useCreatePosInvoiceMutation,
  useLazyGetItemStockQtyQuery,
  useLazyGetPosInvoiceQuery,
  useLazyGetPosItemMetaQuery,
  useLazyGetPosItemSellingRateQuery,
  useLazySearchPosItemsQuery,
  useListPosDraftInvoicesQuery,
  useListPosPaymentModesQuery,
  useSubmitPosInvoiceMutation,
  useUpdatePosInvoiceMutation
} from "@/modules/pos/api/posApi";
import { defaultWalkInCustomer } from "@/modules/pos/hooks/usePosCustomerSearch";
import type {
  PosCartItem,
  PosDiscountMode,
  PosDraftInvoiceLookup,
  PosFormState,
  PosInvoiceDoc,
  PosItemLookup,
  PosSession
} from "@/modules/pos/types/pos";
import { calcPosTotals } from "@/modules/pos/utils/posCalculations";
import { toPosInvoicePayload } from "@/modules/pos/utils/posPayloadMapper";
import { openErpNextPrintPreview } from "@/modules/pos/utils/printBill";
import { validatePosBeforeSave, validatePosBeforeSubmit } from "@/modules/pos/utils/posValidation";
import { createEmptyPosRow, normalizePosRows, toBillableRows } from "@/modules/pos/utils/rowCompletion";
import { createOrUpdatePosBillDraft, submitPosBill } from "@/modules/pos/utils/posSessionService";

const today = () => new Date().toISOString().slice(0, 10);

const createDefaultForm = (session?: PosSession | null): PosFormState => ({
  customer: session?.default_customer ?? defaultWalkInCustomer,
  pos_profile: session?.pos_profile,
  pos_opening_entry: session?.name,
  posting_date: today(),
  paid_amount: undefined,
  mode_of_payment: undefined,
  remarks: undefined,
  set_warehouse: session?.warehouse,
  discount_enabled: false,
  discount_mode: "item",
  overall_discount_percentage: 0
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
  hs_code: item.hs_code ?? item.value,
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
  design: item.design
});

const hasItemLevelDiscount = (rows: PosCartItem[]) =>
  rows.some((row) => row.discount_percentage > 0 || row.discount_amount > 0);

const resolveDiscountMode = (hasItemDiscount: boolean, hasOverallDiscount: boolean): PosDiscountMode => {
  if (hasItemDiscount && hasOverallDiscount) {
    return "both";
  }
  if (hasOverallDiscount) {
    return "overall";
  }
  return "item";
};

const mapInvoiceToCartItems = (doc: PosInvoiceDoc): PosCartItem[] =>
  doc.items.map((row) => ({
    rowId: createEmptyPosRow().rowId,
    item_code: row.item_code,
    item_name: row.item_name ?? row.item_code,
    hs_code: row.gst_hsn_code ?? row.item_code,
    uom: row.uom ?? "Nos",
    qty: row.qty,
    rate: row.rate,
    discount_percentage: row.discount_percentage ?? 0,
    discount_amount: row.discount_amount ?? 0,
    warehouse: row.warehouse,
    barcode: row.barcode
  }));

const mapInvoiceToForm = (doc: PosInvoiceDoc, session?: PosSession | null): PosFormState => {
  const hasOverallDiscount = (doc.additional_discount_percentage ?? 0) > 0;
  const itemRows = mapInvoiceToCartItems(doc);
  return {
    customer: doc.customer || session?.default_customer || defaultWalkInCustomer,
    pos_profile: doc.pos_profile ?? session?.pos_profile,
    pos_opening_entry: doc.pos_opening_entry ?? session?.name,
    posting_date: doc.posting_date || today(),
    paid_amount: doc.paid_amount,
    mode_of_payment: doc.mode_of_payment ?? doc.payments?.[0]?.mode_of_payment,
    remarks: doc.remarks,
    set_warehouse: doc.set_warehouse ?? session?.warehouse,
    discount_enabled: hasOverallDiscount || hasItemLevelDiscount(itemRows),
    discount_mode: resolveDiscountMode(hasItemLevelDiscount(itemRows), hasOverallDiscount),
    overall_discount_percentage: doc.additional_discount_percentage ?? 0
  };
};

export const usePosBilling = ({ session }: { session?: PosSession | null }) => {
  const me = useAppSelector((state) => state.auth.me);
  const userId = useMemo(
    () => (typeof me?.email === "string" && me.email ? me.email : (typeof me?.user_id === "string" ? me.user_id : undefined)),
    [me?.email, me?.user_id]
  );

  const [form, setForm] = useState<PosFormState>(() => createDefaultForm(session));
  const [cartItems, setCartItems] = useState<PosCartItem[]>([createEmptyPosRow()]);
  const [draftDocName, setDraftDocName] = useState<string | null>(null);
  const [lastSubmittedInvoiceName, setLastSubmittedInvoiceName] = useState<string | null>(null);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const [focusSequence, setFocusSequence] = useState(0);

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
  const [fetchPosInvoice] = useLazyGetPosInvoiceQuery();

  const paymentModesQuery = useListPosPaymentModesQuery();
  const warehousesQuery = useListWarehousesQuery();
  const draftListQuery = useListPosDraftInvoicesQuery(
    session ? { openingEntry: session.name, userId } : undefined,
    { skip: !session }
  );

  const itemDiscountEnabled = form.discount_enabled && (form.discount_mode === "item" || form.discount_mode === "both");
  const overallDiscountEnabled =
    form.discount_enabled && (form.discount_mode === "overall" || form.discount_mode === "both");

  const billableRows = useMemo(() => toBillableRows(cartItems), [cartItems]);
  const totals = useMemo(
    () =>
      calcPosTotals(billableRows, {
        itemDiscountEnabled,
        overallDiscountEnabled,
        overallDiscountPercentage: form.overall_discount_percentage
      }),
    [billableRows, form.overall_discount_percentage, itemDiscountEnabled, overallDiscountEnabled]
  );
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
  const draftInvoices = draftListQuery.data ?? [];
  const activeBillName = lastSubmittedInvoiceName ?? draftDocName;
  const activeBillStatus = lastSubmittedInvoiceName ? "Submitted" : draftDocName ? "Draft" : undefined;

  const updateForm = useCallback((patch: Partial<PosFormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const syncRows = useCallback((updater: (rows: PosCartItem[]) => PosCartItem[]) => {
    setCartItems((prev) => normalizePosRows(updater(prev)));
  }, []);

  const zeroItemDiscounts = useCallback(() => {
    syncRows((prev) =>
      prev.map((row) => ({
        ...row,
        discount_percentage: 0,
        discount_amount: 0
      }))
    );
  }, [syncRows]);

  const updateDiscountConfig = useCallback((patch: Partial<Pick<PosFormState, "discount_enabled" | "discount_mode" | "overall_discount_percentage">>) => {
    setForm((prev) => {
      const next = { ...prev, ...patch };

      if (!next.discount_enabled) {
        next.discount_mode = "item";
        next.overall_discount_percentage = 0;
      }

      if (next.discount_mode === "item") {
        next.overall_discount_percentage = 0;
      }

      return next;
    });

    const nextEnabled = patch.discount_enabled ?? form.discount_enabled;
    const nextMode = patch.discount_mode ?? form.discount_mode;
    if (!nextEnabled || nextMode === "overall") {
      zeroItemDiscounts();
    }
  }, [form.discount_enabled, form.discount_mode, zeroItemDiscounts]);

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
    const warehouse = form.set_warehouse;
    const [detail, stockQty, sellingRate] = await Promise.all([
      resolveItemMeta(item),
      updateStockForRow(item.value, warehouse),
      fetchPosItemSellingRate(item.value, true)
        .unwrap()
        .catch(() => null)
    ]);

    const resolvedItemName = item.item_name ?? detail.item_name ?? item.label;
    const resolvedHsCode = item.hs_code ?? detail.hs_code ?? item.value;
    const resolvedBarcode = item.barcode ?? detail.barcode;
    const resolvedUom = item.stock_uom ?? detail.stock_uom ?? "Nos";
    const resolvedRate =
      (typeof item.standard_rate === "number" && item.standard_rate > 0 ? item.standard_rate : undefined) ??
      (typeof detail.standard_rate === "number" && detail.standard_rate > 0 ? detail.standard_rate : undefined) ??
      (typeof sellingRate === "number" && sellingRate > 0 ? sellingRate : undefined);

    syncRows((prev) => {
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
    });
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
          hs_code: detail.hs_code ?? detail.value
        }
      : null;
    const matched = detailMapped ?? (await lookupItemByCode(itemCode));
    if (!matched) {
      return false;
    }

    await applyItemToRow(rowId, matched);
    return true;
  }, [applyItemToRow, fetchPosItemMeta, lookupItemByCode]);

  const applyBarcodeToRow = useCallback(async (rowId: string, barcode: string) => {
    const token = barcode.trim();
    if (!token) {
      return false;
    }

    const matched = await lookupItemByBarcode(token);
    if (!matched) {
      return false;
    }

    await applyItemToRow(rowId, {
      ...matched,
      barcode: token
    }, { incrementQtyOnly: true });
    return true;
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
          hs_code: patch.hs_code === undefined ? row.hs_code : patch.hs_code || row.item_code,
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
    setFocusSequence((prev) => prev + 1);
  }, []);

  const resetForNextBill = useCallback(() => {
    setForm(createDefaultForm(session));
    setCartItems([createEmptyPosRow()]);
    setDraftDocName(null);
    setLastSubmittedInvoiceName(null);
    setFocusSequence((prev) => prev + 1);
  }, [session]);

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
      setLastSubmittedInvoiceName(null);
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

  const loadDraft = useCallback(async (name: string) => {
    setIsLoadingDraft(true);
    try {
      const doc = await fetchPosInvoice(name, true).unwrap();
      setForm(mapInvoiceToForm(doc, session));
      setCartItems(normalizePosRows(mapInvoiceToCartItems(doc)));
      setDraftDocName(doc.name ?? name);
      setLastSubmittedInvoiceName(null);
    } finally {
      setIsLoadingDraft(false);
    }
  }, [fetchPosInvoice, session]);

  const printBill = useCallback(() => {
    const docName = lastSubmittedInvoiceName ?? draftDocName;
    if (!docName) {
      return false;
    }
    return openErpNextPrintPreview("Sales Invoice", docName);
  }, [draftDocName, lastSubmittedInvoiceName]);

  const saveAndPrint = useCallback(async (): Promise<PosInvoiceDoc> => {
    const submitted = await saveAndSubmit();
    const opened = submitted.name ? openErpNextPrintPreview("Sales Invoice", submitted.name) : false;
    if (!opened) {
      throw new Error("Print preview was blocked. Allow pop-ups to continue.");
    }
    resetForNextBill();
    return submitted;
  }, [resetForNextBill, saveAndSubmit]);

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
    isLoadingDraft,
    isPaymentModesLoading: paymentModesQuery.isLoading,
    isWarehousesLoading: warehousesQuery.isLoading,
    isLoadingDraftList: draftListQuery.isLoading || draftListQuery.isFetching,
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
    saveAndPrint,
    resetForNextBill,
    printBill,
    updateDiscountConfig,
    draftInvoices,
    loadDraft,
    focusSequence,
    itemDiscountEnabled,
    overallDiscountEnabled,
    activeBillName,
    activeBillStatus
  };
};
