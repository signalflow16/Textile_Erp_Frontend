"use client";

import Link from "next/link";
import { Button, Checkbox, Input, Select, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";

import type { ItemRow } from "@/types/item";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useGetItemListQuery, useGetItemLookupsQuery } from "@/store/api/frappeApi";
import {
  setHasVariants,
  setItemCode,
  setItemGroup,
  setItemName,
  setPage,
  setPageSize,
  setSortBy,
  setVariantOf
} from "@/store/features/items/itemsUiSlice";
import { formatRelativeTime } from "@/components/stock/item-master-helpers";

const { Text } = Typography;

export function ItemTable() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((state) => state.itemsUi);
  const { data: lookups } = useGetItemLookupsQuery();
  const { data, isFetching } = useGetItemListQuery({
    page: filters.page,
    pageSize: filters.pageSize,
    itemCode: filters.itemCode,
    itemName: filters.itemName,
    itemGroup: filters.itemGroup,
    variantOf: filters.variantOf,
    hasVariants: filters.hasVariants,
    disabled: filters.disabled,
    sortBy: filters.sortBy
  });

  const columns: ColumnsType<ItemRow> = [
    {
      title: "",
      dataIndex: "select",
      key: "select",
      width: 44,
      render: () => <Checkbox />
    },
    {
      title: "Item Name",
      dataIndex: "item_name",
      key: "item_name",
      render: (_value: string, record) => (
        <Space direction="vertical" size={2}>
          <Link href={`/stock/items/${encodeURIComponent(record.item_code)}`}>
            <Text strong className="item-link">
              {record.item_name || record.item_code}
            </Text>
          </Link>
          <Space size={8}>
            <Tag color={record.disabled ? "default" : "blue"} bordered={false} className="status-pill">
              {record.disabled ? "Disabled" : "Enabled"}
            </Tag>
            {record.has_variants ? (
              <Tag color="gold" bordered={false} className="status-pill">
                Template
              </Tag>
            ) : null}
          </Space>
        </Space>
      )
    },
    {
      title: "Status",
      dataIndex: "disabled",
      key: "disabled",
      width: 110,
      render: (value: 0 | 1) => <Text>{value ? "Disabled" : "Enabled"}</Text>
    },
    {
      title: "Item Group",
      dataIndex: "item_group",
      key: "item_group"
    },
    {
      title: "ID",
      dataIndex: "item_code",
      key: "item_code",
      render: (value: string) => <Text>{value}</Text>
    },
    {
      title: "Variants",
      dataIndex: "has_variants",
      key: "has_variants",
      align: "center",
      width: 90,
      render: (value: 0 | 1) => <Checkbox checked={Boolean(value)} disabled />
    },
    {
      title: "Updated",
      dataIndex: "modified",
      key: "modified",
      width: 110,
      render: (value: string) => <Text type="secondary">{formatRelativeTime(value)}</Text>
    },
    {
      title: "",
      dataIndex: "actions",
      key: "actions",
      width: 90,
      render: (_value: unknown, record) => (
        <Button size="small" href={`/stock/items/${encodeURIComponent(record.item_code)}`}>
          Edit
        </Button>
      )
    }
  ];

  const activeFilterCount = [
    filters.itemCode,
    filters.itemName,
    filters.itemGroup,
    filters.variantOf,
    filters.hasVariants !== "all" ? filters.hasVariants : "",
    filters.disabled !== "all" ? filters.disabled : ""
  ].filter(Boolean).length;

  const onTableChange = (pagination: TablePaginationConfig) => {
    if (pagination.current) {
      dispatch(setPage(pagination.current));
    }

    if (pagination.pageSize) {
      dispatch(setPageSize(pagination.pageSize));
    }
  };

  return (
    <div className="item-list-card">
      <div className="item-quick-filters">
        <Input
          allowClear
          placeholder="ID"
          value={filters.itemCode}
          onChange={(event) => dispatch(setItemCode(event.target.value))}
        />
        <Input
          allowClear
          placeholder="Item Name"
          className="item-name-filter-input"
          value={filters.itemName}
          onChange={(event) => dispatch(setItemName(event.target.value))}
        />
        <Select
          allowClear
          placeholder="Item Group"
          value={filters.itemGroup}
          options={lookups?.item_groups ?? []}
          onChange={(value) => dispatch(setItemGroup(value))}
        />
        <Checkbox
          checked={filters.hasVariants === "1"}
          onChange={(event) => dispatch(setHasVariants(event.target.checked ? "1" : "all"))}
        >
          Has Variants
        </Checkbox>
        <Input
          allowClear
          placeholder="Variant Of"
          value={filters.variantOf}
          onChange={(event) => dispatch(setVariantOf(event.target.value))}
        />
        <Select
          size="middle"
          value={filters.sortBy}
          onChange={(value) => dispatch(setSortBy(value))}
          options={[
            { label: "Last Updated On", value: "modified_desc" },
            { label: "Oldest Updated", value: "modified_asc" },
            { label: "Item Code", value: "item_code_asc" },
            { label: "Item Name", value: "item_name_asc" }
          ]}
          style={{ minWidth: 180 }}
        />
      </div>
      <div className="item-list-summary advanced">
        <Space>
          <Text type="secondary">{data?.total_count ?? 0} items</Text>
          <Tag bordered={false} color={activeFilterCount ? "processing" : "default"}>
            {activeFilterCount} active filters
          </Tag>
        </Space>
      </div>
      <Table
        className="item-master-table"
        rowKey="item_code"
        columns={columns}
        dataSource={data?.data ?? []}
        loading={isFetching}
        pagination={{
          current: filters.page,
          pageSize: filters.pageSize,
          total: data?.total_count ?? 0,
          showSizeChanger: true,
          pageSizeOptions: [20, 100, 500, 2500].map(String)
        }}
        onChange={onTableChange}
      />
    </div>
  );
}
