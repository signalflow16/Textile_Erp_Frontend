import type { PosCartItem } from "@/modules/pos/types/pos";

export const createEmptyPosRow = (): PosCartItem => ({
  rowId: `pos-row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  item_code: "",
  item_name: undefined,
  hs_code: undefined,
  uom: "Nos",
  qty: 0,
  rate: 0,
  discount_percentage: 0,
  discount_amount: 0,
  warehouse: undefined,
  barcode: undefined,
  variant_of: undefined,
  color: undefined,
  size: undefined,
  design: undefined,
  available_qty: undefined
});

export const isPosRowEmpty = (row: PosCartItem) =>
  !row.item_code &&
  !(row.item_name?.trim()) &&
  !(row.barcode?.trim()) &&
  !(row.hs_code?.trim()) &&
  row.qty <= 0 &&
  row.rate <= 0 &&
  row.discount_percentage <= 0 &&
  row.discount_amount <= 0;

export const isPosRowCompleted = (row: PosCartItem) => Boolean(row.item_code) && row.qty > 0;

export const toBillableRows = (rows: PosCartItem[]) => rows.filter((row) => isPosRowCompleted(row));

export const normalizePosRows = (rows: PosCartItem[]) => {
  const dataRows = rows.filter((row) => !isPosRowEmpty(row));
  if (!dataRows.length) {
    return [createEmptyPosRow()];
  }

  return [...dataRows, createEmptyPosRow()];
};
