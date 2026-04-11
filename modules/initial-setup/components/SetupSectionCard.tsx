"use client";

import { Card, Space, Tag, Typography } from "antd";

import type { SetupUiStatus } from "@/modules/initial-setup/types/initialSetup";
import { statusColor } from "@/modules/initial-setup/utils/statusMapper";

const { Text } = Typography;

export function SetupSectionCard({
  title,
  status,
  message,
  extra,
  children
}: {
  title: string;
  status: SetupUiStatus;
  message?: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card
      title={
        <Space>
          <span>{title}</span>
          <Tag color={statusColor(status)}>{status.replace("_", " ").toUpperCase()}</Tag>
        </Space>
      }
      extra={extra}
    >
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        {message ? <Text type="secondary">{message}</Text> : null}
        {children}
      </Space>
    </Card>
  );
}