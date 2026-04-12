"use client";

import type { ReactNode } from "react";
import { Card, Space, Statistic, Typography } from "antd";

const { Text } = Typography;

export function DashboardCard({
  title,
  value,
  suffix,
  helper,
  icon,
  accentClassName
}: {
  title: string;
  value: number | string;
  suffix?: string;
  helper?: string;
  icon?: ReactNode;
  accentClassName?: string;
}) {
  return (
    <Card className={`stock-dashboard-card ${accentClassName ?? ""}`.trim()} bordered={false}>
      <div className="stock-dashboard-card-shell">
        <div className="stock-dashboard-card-icon">{icon}</div>
        <Space direction="vertical" size={4} className="stock-dashboard-card-content">
          <Text className="stock-dashboard-card-label">{title}</Text>
          <Statistic value={value} suffix={suffix} />
          {helper ? <Text type="secondary">{helper}</Text> : null}
        </Space>
      </div>
    </Card>
  );
}
