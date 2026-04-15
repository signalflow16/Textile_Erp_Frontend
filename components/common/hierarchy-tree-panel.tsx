"use client";

import { Button, Empty, Input, Space, Tree, Typography } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import type { DataNode, TreeProps } from "antd/es/tree";

const { Text } = Typography;

export function HierarchyTreePanel({
  title,
  subtitle,
  searchValue,
  onSearchChange,
  treeData,
  selectedKeys,
  expandedKeys,
  onSelect,
  onExpand,
  onCollapseAll,
  onExpandAll
}: {
  title: string;
  subtitle: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  treeData: DataNode[];
  selectedKeys: string[];
  expandedKeys: string[];
  onSelect: (selectedKey?: string) => void;
  onExpand: (keys: string[]) => void;
  onCollapseAll: () => void;
  onExpandAll: () => void;
}) {
  const handleSelect: TreeProps["onSelect"] = (keys) => {
    const nextKey = keys[0];
    onSelect(typeof nextKey === "string" ? nextKey : undefined);
  };

  return (
    <div className="master-tree-panel">
      <div className="master-tree-head">
        <div>
          <Text className="master-tree-title">{title}</Text>
          <Text className="master-tree-subtitle">{subtitle}</Text>
        </div>
        <Space>
          <Button size="small" onClick={onCollapseAll}>
            Collapse All
          </Button>
          <Button size="small" onClick={onExpandAll}>
            Expand All
          </Button>
        </Space>
      </div>

      <Input
        allowClear
        value={searchValue}
        prefix={<SearchOutlined />}
        placeholder={`Search ${title.toLowerCase()}`}
        onChange={(event) => onSearchChange(event.target.value)}
      />

      <div className="master-tree-surface">
        {treeData.length ? (
          <Tree
            blockNode
            showLine
            treeData={treeData}
            selectedKeys={selectedKeys}
            expandedKeys={expandedKeys}
            onSelect={handleSelect}
            onExpand={(keys) => onExpand(keys.map(String))}
          />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No records matched this view." />
        )}
      </div>
    </div>
  );
}
