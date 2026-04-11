"use client";

import { Button, Input, Select, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";

import { formatRelativeTime } from "@/components/stock/item-group-helpers";
import { useGetItemGroupListQuery, useGetItemGroupLookupsQuery } from "@/store/api/frappeApi";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setListDisabled,
  setListIsGroup,
  setListPage,
  setListPageSize,
  setListParentItemGroup,
  setListSearch,
  setSelectedItemGroup
} from "@/store/features/itemGroups/itemGroupsUiSlice";
import type { ItemGroupListRow } from "@/types/item-group";

const { Text } = Typography;

type ItemGroupListProps = {
  onEdit: (itemGroup: string) => void;
  onMove: (itemGroup: string) => void;
  onDelete: (itemGroup: string) => void;
  onToggleDisabled: (itemGroup: string, disabled: boolean) => void;
};

export function ItemGroupList({
  onEdit,
  onMove,
  onDelete,
  onToggleDisabled
}: ItemGroupListProps) {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((state) => state.itemGroupsUi);
  const { data: lookups } = useGetItemGroupLookupsQuery();
  const { data, isFetching } = useGetItemGroupListQuery({
    page: filters.listPage,
    pageSize: filters.listPageSize,
    search: filters.listSearch,
    parentItemGroup: filters.listParentItemGroup,
    isGroup: filters.listIsGroup,
    disabled: filters.listDisabled,
    sortBy: "modified",
    sortOrder: "desc"
  });

  const columns: ColumnsType<ItemGroupListRow> = [
    {
      title: "Item Group",
      dataIndex: "item_group_name",
      key: "item_group_name",
      render: (_value, record) => (
        <Space direction="vertical" size={2}>
          <Button
            type="link"
            className="item-group-row-link"
            onClick={() => dispatch(setSelectedItemGroup(record.name))}
          >
            {record.item_group_name}
          </Button>
          <Text type="secondary">{record.parent_item_group || "Root group"}</Text>
        </Space>
      )
    },
    {
      title: "Type",
      dataIndex: "is_group",
      key: "is_group",
      width: 100,
      render: (value: 0 | 1) => (
        <Tag bordered={false} color={value ? "gold" : "green"} className="status-pill">
          {value ? "Group" : "Leaf"}
        </Tag>
      )
    },
    {
      title: "Status",
      dataIndex: "disabled",
      key: "disabled",
      width: 110,
      render: (value: 0 | 1) => (
        <Tag bordered={false} color={value ? "default" : "blue"} className="status-pill">
          {value ? "Disabled" : "Enabled"}
        </Tag>
      )
    },
    {
      title: "Dependencies",
      key: "dependencies",
      width: 170,
      render: (_value, record) => (
        <Text type="secondary">
          {record.children_count} child groups, {record.item_count} items
        </Text>
      )
    },
    {
      title: "Updated",
      dataIndex: "modified",
      key: "modified",
      width: 110,
      render: (value?: string) => <Text type="secondary">{formatRelativeTime(value)}</Text>
    },
    {
      title: "",
      key: "actions",
      width: 260,
      render: (_value, record) => (
        <Space size={6} wrap>
          <Button size="small" onClick={() => onEdit(record.name)}>
            Edit
          </Button>
          <Button size="small" onClick={() => onMove(record.name)}>
            Move
          </Button>
          <Button
            size="small"
            disabled={record.disabled ? !record.can_enable : !record.can_disable}
            onClick={() => onToggleDisabled(record.name, !Boolean(record.disabled))}
          >
            {record.disabled ? "Enable" : "Disable"}
          </Button>
          <Button size="small" danger disabled={!record.can_delete} onClick={() => onDelete(record.name)}>
            Delete
          </Button>
        </Space>
      )
    }
  ];

  const onTableChange = (pagination: TablePaginationConfig) => {
    if (pagination.current) {
      dispatch(setListPage(pagination.current));
    }

    if (pagination.pageSize) {
      dispatch(setListPageSize(pagination.pageSize));
    }
  };

  return (
    <div className="item-group-panel item-group-list-card">
      <div className="item-group-list-filters">
        <Input
          allowClear
          placeholder="Search item groups"
          value={filters.listSearch}
          onChange={(event) => dispatch(setListSearch(event.target.value))}
        />
        <Select
          allowClear
          placeholder="Parent Group"
          value={filters.listParentItemGroup}
          options={lookups?.item_groups_all ?? lookups?.item_groups ?? []}
          onChange={(value) => dispatch(setListParentItemGroup(value))}
          showSearch
          optionFilterProp="label"
        />
        <Select
          value={filters.listIsGroup}
          onChange={(value) => dispatch(setListIsGroup(value))}
          options={[
            { label: "Type: All", value: "all" },
            { label: "Groups", value: "1" },
            { label: "Leaf", value: "0" }
          ]}
        />
        <Select
          value={filters.listDisabled}
          onChange={(value) => dispatch(setListDisabled(value))}
          options={[
            { label: "Status: All", value: "all" },
            { label: "Enabled", value: "0" },
            { label: "Disabled", value: "1" }
          ]}
        />
      </div>

      <Table
        rowKey="name"
        columns={columns}
        dataSource={data?.data ?? []}
        loading={isFetching}
        pagination={{
          current: filters.listPage,
          pageSize: filters.listPageSize,
          total: data?.total_count ?? 0,
          showSizeChanger: true,
          pageSizeOptions: [20, 50, 100].map(String)
        }}
        onChange={onTableChange}
      />
    </div>
  );
}
