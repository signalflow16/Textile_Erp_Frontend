"use client";

import { useMemo } from "react";
import { ClearOutlined, FolderOpenOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Empty, Input, Space, Tag, Tree, Typography } from "antd";
import type { DataNode, TreeProps } from "antd/es/tree";

import { WarehouseActions } from "./warehouse-actions";
import type { WarehouseNode } from "@/modules/stock/types/master-data";

const { Text } = Typography;

const toTreeData = ({
  nodes,
  selectedWarehouse,
  onSelect,
  onEdit,
  onAddChild,
  onDelete
}: {
  nodes: WarehouseNode[];
  selectedWarehouse?: string;
  onSelect: (warehouse?: string) => void;
  onEdit: (warehouse: string) => void;
  onAddChild: (warehouse: string) => void;
  onDelete: (warehouse: string) => void;
}): DataNode[] =>
  nodes.map((node) => ({
    key: node.key,
    title: (
      <div className={`item-group-tree-row ${selectedWarehouse === node.name ? "selected" : ""}`}>
        <div className="item-group-tree-row-main" onClick={() => onSelect(node.name)}>
          <Text strong className="item-group-tree-row-title">
            {node.title}
          </Text>
          <Space size={6} wrap>
            <Tag bordered={false} className="item-group-tree-chip">
              {node.parent_warehouse ? (node.is_group ? "Group" : "Leaf") : "Root"}
            </Tag>
            {node.company ? <Text type="secondary" className="item-group-tree-meta">{node.company}</Text> : null}
          </Space>
        </div>

        {selectedWarehouse === node.name ? (
          <div className="item-group-tree-row-actions">
            <WarehouseActions
              canAddChild={!node.parent_warehouse}
              canDelete={Boolean(node.parent_warehouse)}
              onEdit={() => onEdit(node.name)}
              onAddChild={() => onAddChild(node.name)}
              onDelete={() => onDelete(node.name)}
            />
          </div>
        ) : null}
      </div>
    ),
    children: toTreeData({
      nodes: node.children ?? [],
      selectedWarehouse,
      onSelect,
      onEdit,
      onAddChild,
      onDelete
    })
  }));

export function WarehouseTreePanel({
  nodes,
  loading,
  selectedWarehouse,
  search,
  expandedKeys,
  onSearchChange,
  onSelect,
  onExpandedKeysChange,
  onClear,
  onCollapseAll,
  onExpandAll,
  onCreate,
  onEdit,
  onAddChild,
  onDelete
}: {
  nodes: WarehouseNode[];
  loading: boolean;
  selectedWarehouse?: string;
  search: string;
  expandedKeys: string[];
  onSearchChange: (value: string) => void;
  onSelect: (warehouse?: string) => void;
  onExpandedKeysChange: (keys: string[]) => void;
  onClear: () => void;
  onCollapseAll: () => void;
  onExpandAll: () => void;
  onCreate: () => void;
  onEdit: (warehouse: string) => void;
  onAddChild: (warehouse: string) => void;
  onDelete: (warehouse: string) => void;
}) {
  const treeData = useMemo(
    () => toTreeData({ nodes, selectedWarehouse, onSelect, onEdit, onAddChild, onDelete }),
    [nodes, selectedWarehouse, onSelect, onEdit, onAddChild, onDelete]
  );

  const handleSelect: TreeProps["onSelect"] = (keys) => {
    const nextKey = keys[0];
    onSelect(typeof nextKey === "string" ? nextKey : undefined);
  };

  return (
    <div className="item-group-tree-shell item-group-tree-shell-elevated">
      <div className="item-group-panel-head compact">
        <div>
          <Text className="item-group-panel-title">Warehouse Tree</Text>
          <Text className="item-group-panel-subtitle">
            Minimal warehouse hierarchy with root, group, and leaf nodes plus page-based editing.
          </Text>
        </div>
        <Space size={8} wrap>
          <Button size="small" onClick={onCollapseAll}>
            Collapse All
          </Button>
          <Button size="small" onClick={onExpandAll}>
            Expand All
          </Button>
          <Button size="small" icon={<ClearOutlined />} onClick={onClear}>
            Clear
          </Button>
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={onCreate}>
            New Warehouse
          </Button>
        </Space>
      </div>

      <Input
        allowClear
        value={search}
        prefix={<SearchOutlined />}
        placeholder="Search warehouses"
        onChange={(event) => onSearchChange(event.target.value)}
      />

      <div className="item-group-tree-summary-line">
        <span className="item-group-summary-inline">
          <FolderOpenOutlined /> {nodes.length} root warehouses
        </span>
        <span className="item-group-summary-inline">Only root warehouses can add child warehouses</span>
      </div>

      <div className="item-group-tree-simple-card item-group-tree-simple-card-tall">
        {treeData.length === 0 && !loading ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={search ? "No warehouses matched this search." : "No warehouses found."}
          />
        ) : (
          <Tree
            blockNode
            showLine
            selectedKeys={selectedWarehouse ? [selectedWarehouse] : []}
            expandedKeys={expandedKeys}
            treeData={treeData}
            onSelect={handleSelect}
            onExpand={(keys) => onExpandedKeysChange(keys.map(String))}
            className="item-group-simple-tree"
          />
        )}
      </div>
    </div>
  );
}
