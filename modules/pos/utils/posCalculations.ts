import type { PosCartItem, PosTotals } from "@/modules/pos/types/pos";

const toMoney = (value: number) => Number(value.toFixed(2));

export const calcLineAmount = (item: PosCartItem) => {
  const base = item.qty * item.rate;
  const discountByPercent = base * (item.discount_percentage / 100);
  const discount = item.discount_amount > 0 ? item.discount_amount : discountByPercent;
  return toMoney(Math.max(base - discount, 0));
};

export const calcPosTotals = (items: PosCartItem[]): PosTotals => {
  const totalItems = items.reduce((sum, row) => sum + row.qty, 0);
  const subtotal = items.reduce((sum, row) => sum + row.qty * row.rate, 0);
  const discountTotal = items.reduce((sum, row) => {
    const base = row.qty * row.rate;
    const byPercent = base * (row.discount_percentage / 100);
    return sum + (row.discount_amount > 0 ? row.discount_amount : byPercent);
  }, 0);
  const grandTotal = subtotal - discountTotal;

  return {
    totalItems: toMoney(totalItems),
    subtotal: toMoney(subtotal),
    discountTotal: toMoney(discountTotal),
    grandTotal: toMoney(Math.max(grandTotal, 0))
  };
};

