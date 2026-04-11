"use client";

import { Card, Statistic, Typography } from "antd";

const { Text } = Typography;

export function DashboardCard({
  title,
  value,
  suffix,
  helper
}: {
  title: string;
  value: number | string;
  suffix?: string;
  helper?: string;
}) {
  return (
    <Card className="stock-dashboard-card" bordered={false}>
      <Statistic title={title} value={value} suffix={suffix} />
      {helper ? <Text type="secondary">{helper}</Text> : null}
    </Card>
  );
}
