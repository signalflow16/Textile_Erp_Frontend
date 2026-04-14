import { parseFrappeNumber } from "@/services/frappe";

export const DEFAULT_STOCK_SHORTAGE_THRESHOLD = 10;

export const resolveMinimumQuantity = (value: unknown, fallback = DEFAULT_STOCK_SHORTAGE_THRESHOLD) => {
  const parsed = parseFrappeNumber(value);
  return parsed > 0 ? parsed : fallback;
};

export const buildShortageRecord = ({
  itemCode,
  warehouse,
  actualQty,
  minimumQty
}: {
  itemCode: string;
  warehouse: string;
  actualQty: number;
  minimumQty: number;
}) => ({
  itemCode,
  warehouse,
  actualQty,
  shortageQty: Math.max(minimumQty - actualQty, 0)
});

export const isShortage = (actualQty: number, minimumQty: number) => actualQty < minimumQty;
