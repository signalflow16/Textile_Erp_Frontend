"use client";

import { ReloadOutlined } from "@ant-design/icons";
import { Button, Space, Typography } from "antd";

const { Text } = Typography;

type ItemGroupToolbarProps = {
  totalGroups: number;
  selectedCountLabel: string;
  onRefresh: () => void;
};

export function ItemGroupToolbar({
  totalGroups,
  selectedCountLabel,
  onRefresh
}: ItemGroupToolbarProps) {
  return (
    <div className="item-group-toolbar">
      <div className="item-group-toolbar-copy">
        <Text className="item-toolbar-title">Item Group</Text>
        <Text className="item-toolbar-subtitle">
          Browse the standard ERPNext item group hierarchy in read-only mode from the Stock workspace.
        </Text>
        <Space size={10} wrap className="item-group-toolbar-metrics">
          <Text type="secondary">{totalGroups} groups in tree</Text>
          <Text type="secondary">{selectedCountLabel}</Text>
        </Space>
      </div>
      <Space size="middle" wrap>
        <Button
          size="middle"
          icon={<ReloadOutlined />}
          className="item-toolbar-refresh"
          onClick={onRefresh}
        >
          Refresh
        </Button>
      </Space>
    </div>
  );
}
