import type { PosCartItem, PosTotals } from "@/modules/pos/types/pos";

const toMoney = (value: number) => Number(value.toFixed(2));

export const calcRowBaseAmount = (item: PosCartItem) => toMoney(item.qty * item.rate);

export const calcRowDiscountAmount = (item: PosCartItem) => {
  const base = calcRowBaseAmount(item);
  const discountByPercent = base * (item.discount_percentage / 100);
  return toMoney(Math.max(item.discount_amount > 0 ? item.discount_amount : discountByPercent, 0));
};

export const calcLineAmount = (item: PosCartItem, options?: { includeItemDiscount?: boolean }) => {
  const base = item.qty * item.rate;
  const discount = options?.includeItemDiscount === false ? 0 : calcRowDiscountAmount(item);
  return toMoney(Math.max(base - discount, 0));
};

export const calcPosTotals = (
  items: PosCartItem[],
  options?: {
    itemDiscountEnabled?: boolean;
    overallDiscountEnabled?: boolean;
    overallDiscountPercentage?: number;
  }
): PosTotals => {
  const itemDiscountEnabled = options?.itemDiscountEnabled ?? true;
  const overallDiscountEnabled = options?.overallDiscountEnabled ?? false;
  const overallDiscountPercentage = Math.max(options?.overallDiscountPercentage ?? 0, 0);
  const totalItems = items.reduce((sum, row) => sum + row.qty, 0);
  const subtotal = items.reduce((sum, row) => sum + calcRowBaseAmount(row), 0);
  const itemDiscountTotal = itemDiscountEnabled
    ? items.reduce((sum, row) => sum + calcRowDiscountAmount(row), 0)
    : 0;
  const netSubtotal = subtotal - itemDiscountTotal;
  const overallDiscountTotal = overallDiscountEnabled
    ? netSubtotal * (overallDiscountPercentage / 100)
    : 0;
  const discountTotal = itemDiscountTotal + overallDiscountTotal;
  const grandTotal = netSubtotal - overallDiscountTotal;

  return {
    totalItems: toMoney(totalItems),
    subtotal: toMoney(subtotal),
    itemDiscountTotal: toMoney(itemDiscountTotal),
    netSubtotal: toMoney(Math.max(netSubtotal, 0)),
    overallDiscountTotal: toMoney(Math.max(overallDiscountTotal, 0)),
    discountTotal: toMoney(discountTotal),
    grandTotal: toMoney(Math.max(grandTotal, 0))
  };
};

