"use client";

import { Card, Empty, Tag, Typography } from "antd";

const { Text } = Typography;

export function ChartCard({
  title,
  subtitle,
  status,
  statusText,
  children,
  empty
}: {
  title: string;
  subtitle?: string;
  status?: "default" | "processing" | "warning";
  statusText?: string;
  children: React.ReactNode;
  empty?: boolean;
}) {
  return (
    <Card
      className="stock-chart-card"
      title={
        <div className="stock-chart-card-title">
          <span>{title}</span>
          {statusText ? (
            <Tag color={status === "warning" ? "warning" : status === "processing" ? "processing" : "default"} bordered={false}>
              {statusText}
            </Tag>
          ) : null}
        </div>
      }
      extra={subtitle ? <Text type="secondary">{subtitle}</Text> : null}
    >
      {empty ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data available." /> : children}
    </Card>
  );
}
