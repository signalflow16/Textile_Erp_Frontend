"use client";

import type { ReactNode } from "react";
import { Card, Empty, Skeleton, Tag, Typography } from "antd";

const { Text } = Typography;

export function ChartCard({
  title,
  subtitle,
  status,
  statusText,
  children,
  empty,
  loading,
  emptyText,
  extra
}: {
  title: string;
  subtitle?: string;
  status?: "default" | "processing" | "warning";
  statusText?: string;
  children: ReactNode;
  empty?: boolean;
  loading?: boolean;
  emptyText?: string;
  extra?: ReactNode;
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
      extra={
        extra ?? (subtitle ? <Text type="secondary">{subtitle}</Text> : null)
      }
    >
      <div className="stock-chart-card-body">
        {loading ? (
          <div className="stock-chart-state">
            <Skeleton active paragraph={{ rows: 8 }} title={false} />
          </div>
        ) : empty ? (
          <div className="stock-chart-state">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={emptyText ?? "No data available yet. Data will appear once transactions are recorded."}
            />
          </div>
        ) : (
          children
        )}
      </div>
    </Card>
  );
}
