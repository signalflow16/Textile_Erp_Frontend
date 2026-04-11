"use client";

import { useMemo } from "react";
import {
  ClearOutlined,
  EyeOutlined,
  FolderOpenOutlined,
  SearchOutlined
} from "@ant-design/icons";
import { Button, Empty, Input, Space, Tag, Tree, Typography } from "antd";
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
  onViewDetails: (itemGroup: string) => void;
};

const renderTreeTitle = (
  node: ItemGroupTreeNode,
  selectedItemGroup: string | undefined,
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
    <Button
      type="text"
      size="small"
      className="item-group-tree-action"
      icon={<EyeOutlined />}
      onClick={(event) => {
        event.stopPropagation();
        onViewDetails(node.name);
      }}
    />
  </div>
);

const toTreeData = (
  nodes: ItemGroupTreeNode[],
  selectedItemGroup: string | undefined,
  onViewDetails: (itemGroup: string) => void
): DataNode[] =>
  nodes.map((node) => ({
    key: node.name,
    title: renderTreeTitle(node, selectedItemGroup, onViewDetails),
    children: toTreeData(node.children ?? [], selectedItemGroup, onViewDetails)
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
  onViewDetails
}: ItemGroupTreePanelProps) {
  const treeData = useMemo(
    () => toTreeData(nodes, selectedItemGroup, onViewDetails),
    [nodes, onViewDetails, selectedItemGroup]
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
        <span className="item-group-summary-inline">Read-only browser for standard item groups</span>
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
