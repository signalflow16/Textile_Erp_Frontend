"use client";

import { Typography } from "antd";

const { Text } = Typography;

export type ReportStatItem = {
  label: string;
  value: string;
};

export function ReportStatStrip({ items }: { items: ReportStatItem[] }) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="stock-report-stat-strip">
      {items.map((item) => (
        <div key={item.label} className="stock-report-stat-card">
          <Text className="stock-report-stat-label">{item.label}</Text>
          <Text className="stock-report-stat-value">{item.value}</Text>
        </div>
      ))}
    </div>
  );
}
