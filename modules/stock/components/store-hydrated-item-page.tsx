"use client";

import Link from "next/link";
import { Alert, Card, Skeleton, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";

import { ItemForm } from "./item-form";
import { useGetItemListQuery, useGetItemQuery } from "@/core/api/frappeApi";
import type { ItemRow } from "@/modules/stock/types/item";
import { formatVariantDescriptor, isTemplateItem, isVariantItem } from "@/modules/shared/variants/variant-utils";

const { Text } = Typography;

export function StoreHydratedItemPage({ itemCode }: { itemCode: string }) {
  const { data, isLoading, error } = useGetItemQuery(itemCode);
  const templateCode = data ? (isTemplateItem(data) ? data.item_code : data.variant_of || undefined) : undefined;
  const variantsQuery = useGetItemListQuery(
    {
      page: 1,
      pageSize: 200,
      variantOf: templateCode,
      hasVariants: "all",
      disabled: "all",
      sortBy: "item_name",
      sortOrder: "asc"
    },
    { skip: !templateCode }
  );

  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 10 }} />;
  }

  if (error || !data) {
    return (
      <Alert
        type="error"
        message="Item could not be loaded"
        description="Confirm the item exists and the ERPNext user has permission to access it."
        showIcon
      />
    );
  }

  const variants = variantsQuery.data?.data ?? [];
  const variantColumns: ColumnsType<ItemRow> = [
    {
      title: "Variant SKU",
      dataIndex: "item_code",
      key: "item_code",
      render: (value, row) => (
        <Space direction="vertical" size={2}>
          <Link href={`/stock/items/${encodeURIComponent(value)}`}>
            <Text strong>{row.item_name || value}</Text>
          </Link>
          <Text type="secondary">{value}</Text>
        </Space>
      )
    },
    {
      title: "Attributes",
      key: "variant_attrs",
      width: 200,
      render: (_value, row) => {
        const descriptor = formatVariantDescriptor(row);
        return <Text type="secondary">{descriptor || "-"}</Text>;
      }
    },
    {
      title: "Type",
      key: "type",
      width: 160,
      render: (_value, row) => (
        <Space size={6}>
          {isTemplateItem(row) ? <Tag color="processing">Template</Tag> : null}
          {isVariantItem(row) ? <Tag color="purple">Variant</Tag> : null}
          {row.has_batch_no ? <Tag color="gold">Batch</Tag> : null}
        </Space>
      )
    },
    {
      title: "Status",
      dataIndex: "disabled",
      key: "disabled",
      width: 120,
      render: (value) => <Tag color={value ? "default" : "blue"}>{value ? "Disabled" : "Active"}</Tag>
    }
  ];

  return (
    <div className="page-stack">
      <ItemForm mode="edit" itemCode={itemCode} initialValues={data} />
      {templateCode ? (
        <Card
          title={isTemplateItem(data) ? "Template Variants" : "Template + Sibling Variants"}
          extra={
            <Link href={`/stock/items?variantOf=${encodeURIComponent(templateCode)}&variantMode=variant`}>
              View in Item List
            </Link>
          }
        >
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <Text type="secondary">
              Template: <Text>{templateCode}</Text>
            </Text>
            <Table<ItemRow>
              rowKey={(row) => row.item_code}
              columns={variantColumns}
              dataSource={variants}
              loading={variantsQuery.isLoading || variantsQuery.isFetching}
              pagination={false}
            />
          </Space>
        </Card>
      ) : null}
    </div>
  );
}
