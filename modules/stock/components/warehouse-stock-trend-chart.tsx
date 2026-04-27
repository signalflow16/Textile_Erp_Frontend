"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis
} from "recharts";

import type { StockValueTrendPoint } from "@/modules/stock/types";
import { useStockTrendData } from "./use-stock-trend-data";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

export function WarehouseStockTrendChart({ rows }: { rows: StockValueTrendPoint[] }) {
  const data = useStockTrendData(rows);

  return (
    <div className="warehouse-stock-trend-chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 10, left: -16, bottom: 8 }}>
          <defs>
            <linearGradient id="warehouseStockAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1677ff" stopOpacity={0.32} />
              <stop offset="100%" stopColor="#1677ff" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e8edf5" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "#64748b" }}
            tickFormatter={(value: number) => currencyFormatter.format(value)}
            width={90}
          />
          <RechartsTooltip
            labelFormatter={(label) => `Date: ${label}`}
            formatter={(value: unknown) => ["Stock Value", currencyFormatter.format(Number(value ?? 0))]}
            contentStyle={{ borderRadius: 10, border: "1px solid #e5ebf3" }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#1677ff"
            strokeWidth={3}
            fill="url(#warehouseStockAreaGradient)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
