"use client";

import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button, Space, Typography } from "antd";

const { Text } = Typography;

type ItemGroupToolbarProps = {
  totalGroups: number;
  selectedCountLabel: string;
  onCreate: () => void;
  onRefresh: () => void;
};

export function ItemGroupToolbar({
  totalGroups,
  selectedCountLabel,
  onCreate,
  onRefresh
}: ItemGroupToolbarProps) {
  return (
    <div className="item-group-toolbar">
      <div className="item-group-toolbar-copy">
        <Text className="item-toolbar-title">Item Group</Text>
        <Text className="item-toolbar-subtitle">
          Structure your stock catalog with a clear hierarchy, safe actions, and quick dependency visibility.
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
        <Button type="primary" size="middle" icon={<PlusOutlined />} className="item-toolbar-primary" onClick={onCreate}>
          New Item Group
        </Button>
      </Space>
    </div>
  );
}
