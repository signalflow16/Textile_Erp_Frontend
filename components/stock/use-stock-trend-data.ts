"use client";

import { useMemo } from "react";

import type { StockValueTrendPoint } from "@/types/stock";

export function useStockTrendData(rows: StockValueTrendPoint[]) {
  return useMemo(
    () =>
      rows.map((row) => ({
        date: row.date,
        value: Number(row.value.toFixed(2))
      })),
    [rows]
  );
}
