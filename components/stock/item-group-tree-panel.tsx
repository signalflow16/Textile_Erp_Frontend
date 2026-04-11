"use client";

import { useMemo } from "react";
import {
  ClearOutlined,
  EllipsisOutlined,
  EyeOutlined,
  FolderOpenOutlined,
  PlusOutlined,
  SearchOutlined,
  SettingOutlined
} from "@ant-design/icons";
import { Button, Dropdown, Empty, Input, Space, Tag, Tree, Typography } from "antd";
import type { MenuProps } from "antd";
import type { DataNode, TreeProps } from "antd/es/tree";

import type { ItemGroupTreeNode } from "@/types/item-group";

const { Text } = Typography;

type ItemGroupTreePanelProps = {
  nodes: ItemGroupTreeNode[];
  isLoading: boolean;
  selectedItemGroup?: string;
  search: string;
  expandedKeys: string[];
  onSearchChange: (value: string) => void;
  onSelect: (itemGroup?: string) => void;
  onExpandedKeysChange: (keys: string[]) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onEdit: (itemGroup: string) => void;
  onAddChild: (itemGroup: string) => void;
  onViewDetails: (itemGroup: string) => void;
};

const getNodeMenuItems = (
  node: ItemGroupTreeNode,
  onEdit: (itemGroup: string) => void,
  onAddChild: (itemGroup: string) => void,
  onViewDetails: (itemGroup: string) => void
): MenuProps["items"] => [
  {
    key: "edit",
    label: "Edit",
    onClick: () => onEdit(node.name)
  },
  {
    key: "add-child",
    label: "Add Child",
    icon: <PlusOutlined />,
    onClick: () => onAddChild(node.name)
  },
  {
    key: "view-details",
    label: "View Details",
    icon: <EyeOutlined />,
    onClick: () => onViewDetails(node.name)
  }
];

const renderTreeTitle = (
  node: ItemGroupTreeNode,
  selectedItemGroup: string | undefined,
  onEdit: (itemGroup: string) => void,
  onAddChild: (itemGroup: string) => void,
  onViewDetails: (itemGroup: string) => void
) => (
  <div className={`item-group-tree-row ${selectedItemGroup === node.name ? "selected" : ""}`}>
    <div className="item-group-tree-row-main">
      <Text strong={!node.disabled} className="item-group-tree-row-title">
        {node.item_group_name}
      </Text>
      <Space size={6} wrap>
        {node.disabled ? (
          <Tag bordered={false} className="item-group-tree-chip muted">
            Disabled
          </Tag>
        ) : null}
        <Text type="secondary" className="item-group-tree-meta">
          {node.children_count} child groups
        </Text>
        <Text type="secondary" className="item-group-tree-meta">
          {node.item_count} items
        </Text>
      </Space>
    </div>
    <Dropdown
      trigger={["click"]}
      menu={{ items: getNodeMenuItems(node, onEdit, onAddChild, onViewDetails) }}
    >
      <Button
        type="text"
        size="small"
        className="item-group-tree-action"
        icon={<SettingOutlined />}
        onClick={(event) => event.stopPropagation()}
      />
    </Dropdown>
  </div>
);

const toTreeData = (
  nodes: ItemGroupTreeNode[],
  selectedItemGroup: string | undefined,
  onEdit: (itemGroup: string) => void,
  onAddChild: (itemGroup: string) => void,
  onViewDetails: (itemGroup: string) => void
): DataNode[] =>
  nodes.map((node) => ({
    key: node.name,
    title: renderTreeTitle(node, selectedItemGroup, onEdit, onAddChild, onViewDetails),
    children: toTreeData(node.children ?? [], selectedItemGroup, onEdit, onAddChild, onViewDetails)
  }));

export function ItemGroupTreePanel({
  nodes,
  isLoading,
  selectedItemGroup,
  search,
  expandedKeys,
  onSearchChange,
  onSelect,
  onExpandedKeysChange,
  onExpandAll,
  onCollapseAll,
  onEdit,
  onAddChild,
  onViewDetails
}: ItemGroupTreePanelProps) {
  const treeData = useMemo(
    () => toTreeData(nodes, selectedItemGroup, onEdit, onAddChild, onViewDetails),
    [nodes, onAddChild, onEdit, onViewDetails, selectedItemGroup]
  );

  const onSelectTree: TreeProps["onSelect"] = (selectedKeys) => {
    const nextKey = selectedKeys[0];
    onSelect(typeof nextKey === "string" ? nextKey : undefined);
  };

  return (
    <div className="item-group-tree-shell">
      <div className="item-group-panel-head compact">
        <div>
          <Text className="item-group-panel-title">Item Group Tree</Text>
          <Text className="item-group-panel-subtitle">
            Simple hierarchy browser with fast actions and a detail drawer.
          </Text>
        </div>
        <Space size={8} wrap>
          <Button size="small" onClick={onCollapseAll}>
            Collapse All
          </Button>
          <Button size="small" onClick={onExpandAll}>
            Expand All
          </Button>
          <Button size="small" icon={<ClearOutlined />} onClick={() => onSelect(undefined)}>
            Clear
          </Button>
        </Space>
      </div>

      <div className="item-group-tree-toolbar">
        <Input
          allowClear
          value={search}
          prefix={<SearchOutlined />}
          placeholder="Search item groups"
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="item-group-tree-summary-line">
        <span className="item-group-summary-inline">
          <FolderOpenOutlined /> {nodes.length} root groups
        </span>
        <span className="item-group-summary-inline">
          <EllipsisOutlined /> Use the settings icon for quick actions
        </span>
      </div>

      <div className="item-group-tree-simple-card">
        {treeData.length === 0 && !isLoading ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={search ? "No item groups matched this search." : "No item groups found."}
          />
        ) : (
          <Tree
            blockNode
            showLine
            selectedKeys={selectedItemGroup ? [selectedItemGroup] : []}
            expandedKeys={expandedKeys}
            treeData={treeData}
            onSelect={onSelectTree}
            onExpand={(keys) => onExpandedKeysChange(keys.map(String))}
            className="item-group-simple-tree"
          />
        )}
      </div>
    </div>
  );
}
