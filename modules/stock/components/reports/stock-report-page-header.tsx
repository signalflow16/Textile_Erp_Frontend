"use client";

import { Button, Space, Typography } from "antd";
import { DownloadOutlined, ReloadOutlined } from "@ant-design/icons";

const { Text } = Typography;

export function StockReportPageHeader({
  title,
  subtitle,
  onRefresh
}: {
  title: string;
  subtitle: string;
  onRefresh: () => void;
}) {
  return (
    <div className="stock-report-page-header">
      <div className="stock-report-page-header-copy">
        <Text className="stock-report-page-title">{title}</Text>
        <Text className="stock-report-page-subtitle">{subtitle}</Text>
      </div>
      <Space wrap>
        <Button icon={<DownloadOutlined />} disabled>
          Export
        </Button>
        <Button icon={<ReloadOutlined />} onClick={onRefresh}>
          Refresh
        </Button>
      </Space>
    </div>
  );
}
