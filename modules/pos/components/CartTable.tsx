"use client";

import { DeleteOutlined } from "@ant-design/icons";
import { Button, Input, InputNumber, Select, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";

import { useHsCodeSearch } from "@/modules/pos/hooks/useHsCodeSearch";
import { useProductSearch } from "@/modules/pos/hooks/useProductSearch";
import type { PosCartItem } from "@/modules/pos/types/pos";
import { calcLineAmount } from "@/modules/pos/utils/posCalculations";
import { isPosRowEmpty } from "@/modules/pos/utils/rowCompletion";
import { formatVariantDescriptor } from "@/modules/shared/variants/variant-utils";

const { Text } = Typography;

export function CartTable({
  rows,
  onChangeRow,
  onRemoveRow,
  onApplyItem,
  onApplyBarcode
}: {
  rows: PosCartItem[];
  onChangeRow: (rowId: string, patch: Partial<PosCartItem>) => void;
  onRemoveRow: (rowId: string) => void;
  onApplyItem: (rowId: string, itemCode: string) => Promise<void>;
  onApplyBarcode: (rowId: string, barcode: string) => Promise<boolean>;
}) {
  const products = useProductSearch();
  const hsCodes = useHsCodeSearch();

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

  const resolveHsOptions = (row: PosCartItem) => {
    const current = row.hs_code ? [{ label: row.hs_code, value: row.hs_code }] : [];
    const merged = [...current, ...hsCodes.options];
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
      title: "#",
      key: "index",
      width: 56,
      render: (_value, _row, index) => index + 1
    },
    {
      title: "Barcode",
      key: "barcode",
      width: 180,
      render: (_value, row) => (
        <Input
          value={row.barcode}
          placeholder="Scan barcode"
          className="pos-table-input"
          style={{ width: "100%" }}
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
      title: "Item Name",
      dataIndex: "item_name",
      key: "item_name",
      width: 300,
      render: (_value, row) => {
        const hasLowStock = typeof row.available_qty === "number" && row.qty > row.available_qty;
        const hasNoStock = typeof row.available_qty === "number" && row.available_qty <= 0;

        return (
          <Space direction="vertical" size={0}>
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
                    rate: 0
                  });
                  return;
                }
                void onApplyItem(row.rowId, itemCode);
              }}
            />
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
          </Space>
        );
      }
    },
    {
      title: "HS Code",
      key: "hs_code",
      width: 170,
      render: (_value, row) => (
        <Select
          allowClear
          showSearch
          value={row.hs_code}
          placeholder="Select HS Code"
          style={{ width: "100%" }}
          className="pos-table-select"
          options={resolveHsOptions(row)}
          loading={hsCodes.isLoading}
          optionFilterProp="label"
          filterOption
          listHeight={240}
          onSearch={hsCodes.setSearchText}
          onChange={(value) => onChangeRow(row.rowId, { hs_code: value })}
        />
      )
    },
    {
      title: "Qty",
      key: "qty",
      width: 110,
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
    {
      title: "Discount %",
      key: "discount_percentage",
      width: 140,
      render: (_value, row) => (
        <InputNumber
          min={0}
          max={100}
          precision={2}
          value={row.discount_percentage}
          style={{ width: "100%" }}
          onChange={(value) =>
            onChangeRow(row.rowId, {
              discount_percentage: Number(value ?? 0),
              discount_amount: 0
            })
          }
        />
      )
    },
    {
      title: "Batch",
      key: "batch_no",
      width: 140,
      render: (_value, row) => (
        <Input
          value={row.batch_no}
          disabled={!row.has_batch_no}
          placeholder={row.has_batch_no ? "Batch required" : "Not required"}
          className="pos-table-input"
          style={{ width: "100%" }}
          onChange={(event) => onChangeRow(row.rowId, { batch_no: event.target.value })}
        />
      )
    },
    {
      title: "Amount",
      key: "amount",
      width: 130,
      render: (_value, row) => <Text strong>{calcLineAmount(row).toFixed(2)}</Text>
    },
    {
      title: "",
      key: "remove",
      width: 56,
      render: (_value, row) => (
        <Button
          danger
          type="text"
          icon={<DeleteOutlined />}
          disabled={rows.length === 1 && isPosRowEmpty(row)}
          onClick={() => onRemoveRow(row.rowId)}
        />
      )
    }
  ];

  return (
    <Table<PosCartItem>
      size="small"
      rowKey={(row) => row.rowId}
      dataSource={rows}
      columns={columns}
      pagination={false}
      scroll={{ x: 1600 }}
      locale={{ emptyText: "Enter rows to start billing." }}
      className="pos-entry-table"
      bordered={false}
    />
  );
}
