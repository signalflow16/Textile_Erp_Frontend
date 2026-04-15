"use client";

import { Area } from "@ant-design/charts";

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
      <Area
        data={data}
        xField="date"
        yField="value"
        autoFit
        padding={[20, 20, 40, 12]}
        axis={{
          x: {
            title: false,
            labelAutoRotate: false,
            labelAutoHide: true,
            labelFill: "#64748b",
            grid: false,
            line: false,
            tick: false
          },
          y: {
            title: false,
            labelFill: "#64748b",
            gridLineDash: [4, 4],
            gridStroke: "#e8edf5",
            line: false
          }
        }}
        line={{
          style: {
            stroke: "#1677ff",
            lineWidth: 3,
            shadowColor: "rgba(22, 119, 255, 0.18)",
            shadowBlur: 12
          }
        }}
        area={{
          style: {
            fill: "l(270) 0:#91caff66 1:#ffffff0d"
          }
        }}
        tooltip={{
          title: (datum: { date: string }) => datum.date,
          items: [
            (datum: { value: number }) => ({
              name: "Stock Value",
              value: currencyFormatter.format(datum.value)
            })
          ]
        }}
        style={{
          shape: "smooth"
        }}
      />
    </div>
  );
}
