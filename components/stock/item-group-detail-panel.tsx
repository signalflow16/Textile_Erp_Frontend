"use client";

import {
  AppstoreAddOutlined,
  EyeOutlined
} from "@ant-design/icons";
import { Alert, Card, Descriptions, Drawer, Empty, Image, Skeleton, Space, Tag, Typography } from "antd";

import type { ItemGroupDocument } from "@/types/item-group";
import {
  formatDateTime,
  formatDependencySummary,
  formatRelativeTime
} from "@/components/stock/item-group-helpers";

const { Paragraph, Text, Title } = Typography;

type ItemGroupDetailPanelProps = {
  open: boolean;
  itemGroup?: ItemGroupDocument;
  isLoading: boolean;
  error?: boolean;
  onClose: () => void;
};

export function ItemGroupDetailPanel({
  open,
  itemGroup,
  isLoading,
  error,
  onClose
}: ItemGroupDetailPanelProps) {
  return (
    <Drawer
      title="Item Group Details"
      placement="right"
      width={520}
      open={open}
      onClose={onClose}
      destroyOnClose
    >
      {isLoading ? <Skeleton active paragraph={{ rows: 12 }} /> : null}

      {!isLoading && (error || !itemGroup) ? (
        <Alert
          type="error"
          showIcon
          message="Item Group could not be loaded"
          description="Confirm the group exists and that the ERPNext resource is reachable."
        />
      ) : null}

      {!isLoading && !error && !itemGroup ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Select an item group to inspect and manage it."
        />
      ) : null}

      {!isLoading && itemGroup ? (
        <Space direction="vertical" size={18} style={{ width: "100%" }}>
          <div className="item-group-drawer-hero">
            <div>
              <Text type="secondary">{itemGroup.parent_item_group || "Root group"}</Text>
              <Title level={3} style={{ margin: "6px 0 8px" }}>
                {itemGroup.item_group_name}
              </Title>
              <Space size={8} wrap>
                <Tag color={itemGroup.disabled ? "default" : "blue"} bordered={false} className="status-pill">
                  {itemGroup.disabled ? "Disabled" : "Enabled"}
                </Tag>
                <Tag color={itemGroup.is_group ? "gold" : "green"} bordered={false} className="status-pill">
                  {itemGroup.is_group ? "Group" : "Leaf"}
                </Tag>
              </Space>
            </div>
          </div>

          <Text type="secondary">Read-only view sourced from the standard ERPNext Item Group resource.</Text>

          <Card size="small" className="item-group-drawer-card">
            <div className="item-group-stat-row">
              <span className="item-group-stat-label">Children</span>
              <span className="item-group-stat-value">{itemGroup.children_count}</span>
            </div>
            <div className="item-group-stat-row">
              <span className="item-group-stat-label">Linked Items</span>
              <span className="item-group-stat-value">{itemGroup.item_count}</span>
            </div>
            <div className="item-group-stat-row">
              <span className="item-group-stat-label">Updated</span>
              <span className="item-group-stat-value">{formatRelativeTime(itemGroup.modified)}</span>
            </div>
            <div className="item-group-stat-row">
              <span className="item-group-stat-label">Action State</span>
              <span className="item-group-stat-value">
                <EyeOutlined /> {formatDependencySummary(itemGroup.dependency_counts)}
              </span>
            </div>
          </Card>

          <Card size="small" className="item-group-drawer-card">
            <Text className="item-group-section-label">Description</Text>
            <Paragraph className="item-group-description-text">
              {itemGroup.description?.trim() || "No description added for this item group yet."}
            </Paragraph>
            {itemGroup.image ? (
              <div className="item-group-image-preview">
                <Image
                  src={itemGroup.image}
                  alt={itemGroup.item_group_name}
                  fallback="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
                />
              </div>
            ) : (
              <div className="item-group-image-placeholder">
                <AppstoreAddOutlined />
                <Text type="secondary">No image configured</Text>
              </div>
            )}
          </Card>

          <Descriptions column={1} size="small" className="item-group-meta-list">
            <Descriptions.Item label="Document Name">{itemGroup.name}</Descriptions.Item>
            <Descriptions.Item label="Created">{formatDateTime(itemGroup.creation)}</Descriptions.Item>
            <Descriptions.Item label="Modified">{formatDateTime(itemGroup.modified)}</Descriptions.Item>
            <Descriptions.Item label="Schema Version">{itemGroup.schema_version ?? "-"}</Descriptions.Item>
          </Descriptions>
        </Space>
      ) : null}
    </Drawer>
  );
}
