"use client";

import { useMemo } from "react";
import { ClearOutlined, FolderOpenOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Empty, Input, Space, Tag, Tree, Typography } from "antd";
import type { DataNode, TreeProps } from "antd/es/tree";

import { GroupActions } from "@/components/stock/item-groups/group-actions";
import type { ItemGroupTreeNode } from "@/types/item-group";

const { Text } = Typography;

const toTreeData = ({
  nodes,
  selectedGroup,
  renamingGroup,
  renameValue,
  renameLoading,
  onSelect,
  onEdit,
  onAddChild,
  onDelete,
  onRenameStart,
  onRenameCancel,
  onRenameChange,
  onRenameSubmit
}: {
  nodes: ItemGroupTreeNode[];
  selectedGroup?: string;
  renamingGroup?: string;
  renameValue: string;
  renameLoading: boolean;
  onSelect: (itemGroup?: string) => void;
  onEdit: (itemGroup: string) => void;
  onAddChild: (itemGroup: string) => void;
  onDelete: (itemGroup: string) => void;
  onRenameStart: (itemGroup: ItemGroupTreeNode) => void;
  onRenameCancel: () => void;
  onRenameChange: (value: string) => void;
  onRenameSubmit: () => void;
}): DataNode[] =>
  nodes.map((node) => ({
    key: node.name,
    title: (
      <div className={`item-group-tree-row ${selectedGroup === node.name ? "selected" : ""}`}>
        <div className="item-group-tree-row-main" onClick={() => onSelect(node.name)}>
          <Text strong className="item-group-tree-row-title">
            {node.item_group_name}
          </Text>
          <Space size={6} wrap>
            <Tag bordered={false} className="item-group-tree-chip">
              {node.is_group ? "Group" : "Leaf"}
            </Tag>
            <Text type="secondary" className="item-group-tree-meta">
              {node.children_count} child groups
            </Text>
          </Space>
        </div>

        {selectedGroup === node.name ? (
          <div className="item-group-tree-row-actions">
            <GroupActions
              itemGroupName={node.item_group_name}
              canDelete={node.can_delete}
              canAddChild={Boolean(node.is_group)}
              isRenaming={renamingGroup === node.name}
              renameValue={renameValue}
              renameLoading={renameLoading}
              onRenameValueChange={onRenameChange}
              onRenameStart={() => onRenameStart(node)}
              onRenameCancel={onRenameCancel}
              onRenameSubmit={onRenameSubmit}
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
      selectedGroup,
      renamingGroup,
      renameValue,
      renameLoading,
      onSelect,
      onEdit,
      onAddChild,
      onDelete,
      onRenameStart,
      onRenameCancel,
      onRenameChange,
      onRenameSubmit
    })
  }));

export function TreePanel({
  nodes,
  loading,
  selectedGroup,
  search,
  expandedKeys,
  renamingGroup,
  renameValue,
  renameLoading,
  onSearchChange,
  onSelect,
  onExpandedKeysChange,
  onClear,
  onCollapseAll,
  onExpandAll,
  onCreate,
  onEdit,
  onAddChild,
  onDelete,
  onRenameStart,
  onRenameCancel,
  onRenameChange,
  onRenameSubmit
}: {
  nodes: ItemGroupTreeNode[];
  loading: boolean;
  selectedGroup?: string;
  search: string;
  expandedKeys: string[];
  renamingGroup?: string;
  renameValue: string;
  renameLoading: boolean;
  onSearchChange: (value: string) => void;
  onSelect: (itemGroup?: string) => void;
  onExpandedKeysChange: (keys: string[]) => void;
  onClear: () => void;
  onCollapseAll: () => void;
  onExpandAll: () => void;
  onCreate: () => void;
  onEdit: (itemGroup: string) => void;
  onAddChild: (itemGroup: string) => void;
  onDelete: (itemGroup: string) => void;
  onRenameStart: (itemGroup: ItemGroupTreeNode) => void;
  onRenameCancel: () => void;
  onRenameChange: (value: string) => void;
  onRenameSubmit: () => void;
}) {
  const treeData = useMemo(
    () =>
      toTreeData({
        nodes,
        selectedGroup,
        renamingGroup,
        renameValue,
        renameLoading,
        onSelect,
        onEdit,
        onAddChild,
        onDelete,
        onRenameStart,
        onRenameCancel,
        onRenameChange,
        onRenameSubmit
      }),
    [
      nodes,
      selectedGroup,
      renamingGroup,
      renameValue,
      renameLoading,
      onSelect,
      onEdit,
      onAddChild,
      onDelete,
      onRenameStart,
      onRenameCancel,
      onRenameChange,
      onRenameSubmit
    ]
  );

  const handleSelect: TreeProps["onSelect"] = (keys) => {
    const nextKey = keys[0];
    onSelect(typeof nextKey === "string" ? nextKey : undefined);
  };

  return (
    <div className="item-group-tree-shell item-group-tree-shell-elevated">
      <div className="item-group-panel-head compact">
        <div>
          <Text className="item-group-panel-title">Item Group Tree</Text>
          <Text className="item-group-panel-subtitle">
            Simple stock hierarchy with root, group, and leaf nodes plus inline actions.
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
            New Item Group
          </Button>
        </Space>
      </div>

      <Input
        allowClear
        value={search}
        prefix={<SearchOutlined />}
        placeholder="Search item groups"
        onChange={(event) => onSearchChange(event.target.value)}
      />

      <div className="item-group-tree-summary-line">
        <span className="item-group-summary-inline">
          <FolderOpenOutlined /> {nodes.length} root groups
        </span>
        <span className="item-group-summary-inline">Only group nodes can add child item groups</span>
      </div>

      <div className="item-group-tree-simple-card item-group-tree-simple-card-tall">
        {treeData.length === 0 && !loading ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={search ? "No item groups matched this search." : "No item groups found."}
          />
        ) : (
          <Tree
            blockNode
            showLine
            selectedKeys={selectedGroup ? [selectedGroup] : []}
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
