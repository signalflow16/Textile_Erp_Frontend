"use client";

import { useState } from "react";
import { Alert, Card, Select, Space, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";

import type { ItemPriceRow } from "@/modules/stock/types/item";
import { useGetItemLookupsQuery, useGetItemPriceListQuery, useGetItemPriceSummaryQuery } from "@/core/api/frappeApi";
import { formatRelativeTime } from "./item-master-helpers";

const { Text } = Typography;

export function ItemPricePanel({ itemCode }: { itemCode: string }) {
  const [priceList, setPriceList] = useState<string>();
  const [selling, setSelling] = useState<"0" | "1" | undefined>("1");
  const [buying, setBuying] = useState<"0" | "1" | undefined>(undefined);
  const { data: lookups } = useGetItemLookupsQuery();
  const { data: summary } = useGetItemPriceSummaryQuery(itemCode);
  const { data, isFetching, error } = useGetItemPriceListQuery({
    itemCode,
    page: 1,
    pageSize: 50,
    priceList,
    selling,
    buying
  });

  const columns: ColumnsType<ItemPriceRow> = [
    {
      title: "Price List",
      dataIndex: "price_list",
      key: "price_list"
    },
    {
      title: "Rate",
      dataIndex: "price_list_rate",
      key: "price_list_rate",
      render: (value: number, record) => `${record.currency ?? ""} ${value}`.trim()
    },
    {
      title: "Selling",
      dataIndex: "selling",
      key: "selling",
      render: (value: 0 | 1 | undefined) => (value ? "Yes" : "No")
    },
    {
      title: "Buying",
      dataIndex: "buying",
      key: "buying",
      render: (value: 0 | 1 | undefined) => (value ? "Yes" : "No")
    },
    {
      title: "Updated",
      dataIndex: "modified",
      key: "modified",
      render: (value?: string) => (value ? formatRelativeTime(value) : "-")
    }
  ];

  return (
    <div className="page-stack">
      <Card size="small">
        <Space size={24} wrap>
          <Text>Retail: <Text strong>{summary?.retail ?? "-"}</Text></Text>
          <Text>Wholesale: <Text strong>{summary?.wholesale ?? "-"}</Text></Text>
          <Text type="secondary">Last Updated: {summary?.last_updated ?? "-"}</Text>
        </Space>
      </Card>

      <Card title="Item Prices">
        <Space style={{ marginBottom: 16 }} wrap>
          <Select
            allowClear
            placeholder="Price List"
            value={priceList}
            options={lookups?.price_lists ?? []}
            style={{ minWidth: 220 }}
            onChange={(value) => setPriceList(value)}
          />
          <Select
            allowClear
            placeholder="Selling"
            value={selling}
            style={{ minWidth: 140 }}
            options={[
              { label: "Selling: Yes", value: "1" },
              { label: "Selling: No", value: "0" }
            ]}
            onChange={(value) => setSelling(value)}
          />
          <Select
            allowClear
            placeholder="Buying"
            value={buying}
            style={{ minWidth: 140 }}
            options={[
              { label: "Buying: Yes", value: "1" },
              { label: "Buying: No", value: "0" }
            ]}
            onChange={(value) => setBuying(value)}
          />
        </Space>

        {error ? (
          <Alert
            type="error"
            showIcon
            message="Unable to load item prices"
            description="Confirm the backend user has access to Item Price data."
          />
        ) : (
          <Table
            rowKey="name"
            columns={columns}
            dataSource={data?.data ?? []}
            loading={isFetching}
            pagination={false}
          />
        )}
      </Card>
    </div>
  );
}
