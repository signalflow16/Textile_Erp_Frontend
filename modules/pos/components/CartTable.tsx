"use client";

import { useEffect } from "react";
import { DeleteOutlined } from "@ant-design/icons";
import { Button, Input, InputNumber, Select, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";

import { useProductSearch } from "@/modules/pos/hooks/useProductSearch";
import type { PosCartItem } from "@/modules/pos/types/pos";
import { calcLineAmount } from "@/modules/pos/utils/posCalculations";
import { isPosRowEmpty } from "@/modules/pos/utils/rowCompletion";
import { formatVariantDescriptor } from "@/modules/shared/variants/variant-utils";

const { Text } = Typography;

export function CartTable({
  rows,
  discountEnabled,
  onChangeRow,
  onRemoveRow,
  onApplyItem,
  onApplyBarcode,
  focusSequence
}: {
  rows: PosCartItem[];
  discountEnabled: boolean;
  onChangeRow: (rowId: string, patch: Partial<PosCartItem>) => void;
  onRemoveRow: (rowId: string) => void;
  onApplyItem: (rowId: string, itemCode: string) => Promise<void>;
  onApplyBarcode: (rowId: string, barcode: string) => Promise<boolean>;
  focusSequence?: number;
}) {
  const products = useProductSearch();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const firstBarcode = document.querySelector<HTMLInputElement>('[data-pos-barcode="true"]');
      firstBarcode?.focus();
      firstBarcode?.select();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [focusSequence]);

  const resolveProductOptions = (row: PosCartItem) => {
    const current = row.item_code && row.item_name ? [{ label: row.item_name, value: row.item_code }] : [];
    const merged = [
      ...current,
      ...products.options
        .filter((item) => typeof item.item_name === "string" && item.item_name.trim().length > 0)
        .map((item) => ({
          label: item.item_name!.trim(),
          value: item.value
        }))
    ];

    const seen = new Set<string>();
    return merged.filter((entry) => {
      if (seen.has(entry.value)) {
        return false;
      }
      seen.add(entry.value);
      return true;
    });
  };

  const columns: ColumnsType<PosCartItem> = [
    {
      title: "Barcode",
      key: "barcode",
      width: 190,
      render: (_value, row, index) => (
        <Input
          value={row.barcode}
          placeholder="Scan barcode"
          className="pos-table-input"
          style={{ width: "100%" }}
          data-pos-barcode="true"
          autoFocus={index === 0}
          onChange={(event) => onChangeRow(row.rowId, { barcode: event.target.value })}
          onPressEnter={async (event) => {
            const value = event.currentTarget.value.trim();
            if (!value) {
              return;
            }

            const found = await onApplyBarcode(row.rowId, value);
            if (!found) {
              onChangeRow(row.rowId, { barcode: value });
            }
          }}
        />
      )
    },
    {
      title: "HSN",
      key: "item_code",
      width: 160,
      render: (_value, row) => (
        <Input
          value={row.item_code}
          placeholder="Item code"
          className="pos-table-input"
          style={{ width: "100%" }}
          onChange={(event) =>
            onChangeRow(row.rowId, {
              item_code: event.target.value,
              hs_code: event.target.value
            })
          }
          onBlur={(event) => {
            const value = event.target.value.trim();
            if (value) {
              void onApplyItem(row.rowId, value);
            }
          }}
          onPressEnter={(event) => {
            const value = event.currentTarget.value.trim();
            if (value) {
              void onApplyItem(row.rowId, value);
            }
          }}
        />
      )
    },
    {
      title: "Item Name",
      dataIndex: "item_name",
      key: "item_name",
      width: 320,
      render: (_value, row) => {
        const hasLowStock = typeof row.available_qty === "number" && row.qty > row.available_qty;
        const hasNoStock = typeof row.available_qty === "number" && row.available_qty <= 0;

        return (
          <Space direction="vertical" size={4} style={{ width: "100%" }}>
            <Select
              allowClear
              showSearch
              value={row.item_code || undefined}
              placeholder="Search item"
              style={{ width: "100%" }}
              className="pos-table-select"
              options={resolveProductOptions(row)}
              loading={products.isLoading}
              optionFilterProp="label"
              filterOption
              listHeight={240}
              onSearch={products.setSearchText}
              onChange={(itemCode) => {
                if (!itemCode) {
                  onChangeRow(row.rowId, {
                    item_code: "",
                    item_name: undefined,
                    hs_code: undefined,
                    rate: 0,
                    barcode: undefined
                  });
                  return;
                }
                void onApplyItem(row.rowId, itemCode);
              }}
            />
            <Space size={8} wrap>
              {row.variant_of ? (
              <Text type="secondary">
                Variant: {row.variant_of}
                {formatVariantDescriptor({ color: row.color, size: row.size, design: row.design }) ? ` (${formatVariantDescriptor({ color: row.color, size: row.size, design: row.design })})` : ""}
              </Text>
            ) : null}
              {typeof row.available_qty === "number" ? (
                <Tag color={hasNoStock || hasLowStock ? "red" : "green"}>
                  Stock: {row.available_qty}
                </Tag>
              ) : null}
              {row.item_code ? (
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => onRemoveRow(row.rowId)}
                >
                  Remove
                </Button>
              ) : null}
            </Space>
          </Space>
        );
      }
    },
    {
      title: "Quantity",
      key: "qty",
      width: 120,
      render: (_value, row) => (
        <InputNumber
          min={0}
          precision={2}
          value={row.qty}
          style={{ width: "100%" }}
          onChange={(value) => onChangeRow(row.rowId, { qty: Number(value ?? 0) })}
        />
      )
    },
    {
      title: "UOM",
      dataIndex: "uom",
      key: "uom",
      width: 100,
      render: (_value, row) => (
        <Input
          value={row.uom}
          className="pos-table-input"
          style={{ width: "100%" }}
          onChange={(event) => onChangeRow(row.rowId, { uom: event.target.value || "Nos" })}
        />
      )
    },
    {
      title: "Rate",
      key: "rate",
      width: 140,
      render: (_value, row) => (
        <InputNumber
          min={0}
          precision={2}
          value={row.rate}
          style={{ width: "100%" }}
          onChange={(value) => onChangeRow(row.rowId, { rate: Number(value ?? 0) })}
        />
      )
    },
    ...(discountEnabled
      ? [{
          title: "Discount",
          key: "discount_percentage",
          width: 140,
          render: (_value: unknown, row: PosCartItem) => (
            <Space.Compact style={{ width: "100%" }}>
              <InputNumber
                min={0}
                max={100}
                precision={2}
                value={row.discount_percentage}
                style={{ width: "calc(100% - 40px)" }}
                onChange={(value) =>
                  onChangeRow(row.rowId, {
                    discount_percentage: Number(value ?? 0),
                    discount_amount: 0
                  })
                }
              />
              <Input value="%" readOnly tabIndex={-1} style={{ width: 40, textAlign: "center" }} />
            </Space.Compact>
          )
        }] satisfies ColumnsType<PosCartItem>
      : []),
    {
      title: "Amount",
      key: "amount",
      width: 140,
      render: (_value, row) => <Text strong>{calcLineAmount(row, { includeItemDiscount: discountEnabled }).toFixed(2)}</Text>
    }
  ];

  return (
    <Table<PosCartItem>
      size="small"
      rowKey={(row) => row.rowId}
      dataSource={rows}
      columns={columns}
      pagination={false}
      scroll={{ x: discountEnabled ? 1310 : 1170 }}
      locale={{ emptyText: "Enter rows to start billing." }}
      className="pos-entry-table"
      bordered={false}
    />
  );
}
