"use client";

import { useMemo } from "react";
import { Button, InputNumber, Select, Space, Table, Typography } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";

import type { DocumentEngineConfig, DocumentLineItem, RowStockValidation } from "@/modules/shared/document/types/document-engine";

const { Text } = Typography;

export function ItemsTableEditable({
  config,
  rows,
  validations,
  lookups,
  readonly,
  onRowChange,
  onAddRow,
  onRemoveRow
}: {
  config: DocumentEngineConfig;
  rows: DocumentLineItem[];
  validations: RowStockValidation[];
  lookups: {
    items: Array<{ label: string; value: string }>;
    warehouses: Array<{ label: string; value: string }>;
    uoms: Array<{ label: string; value: string }>;
  };
  readonly?: boolean;
  onRowChange: (rowId: string, patch: Partial<DocumentLineItem>) => void;
  onAddRow: () => void;
  onRemoveRow: (rowId: string) => void;
}) {
  const validationMap = useMemo(
    () => new Map(validations.map((entry) => [entry.rowId, entry])),
    [validations]
  );

  return (
    <div className="document-items-shell">
      <div className="document-items-head">
        <div>
          <div className="stock-entry-section-title">Items</div>
          <div className="stock-entry-section-copy">Use keyboard-first item entry with live qty, pricing, UOM, and stock signals.</div>
        </div>
        {!readonly ? (
          <Button type="dashed" icon={<PlusOutlined />} onClick={onAddRow}>
            Add Row
          </Button>
        ) : null}
      </div>
      <Table
        rowKey="id"
        pagination={false}
        dataSource={rows}
        scroll={{ x: 1200 }}
        columns={[
          {
            title: "Item",
            width: 260,
            render: (_value, row) => (
              <Select
                showSearch
                disabled={readonly}
                optionFilterProp="label"
                options={lookups.items}
                value={row.item_code}
                placeholder="Select item"
                onChange={(value) => onRowChange(row.id, { item_code: value })}
              />
            )
          },
          {
            title: "Qty",
            width: 110,
            render: (_value, row, index) => (
              <InputNumber
                min={0}
                precision={3}
                value={row.qty}
                disabled={readonly}
                style={{ width: "100%" }}
                onPressEnter={() => {
                  if (!readonly && index === rows.length - 1) {
                    onAddRow();
                  }
                }}
                onChange={(value) => onRowChange(row.id, { qty: Number(value ?? 0) })}
              />
            )
          },
          {
            title: "UOM",
            width: 140,
            render: (_value, row) => (
              <Select
                showSearch
                disabled={readonly}
                optionFilterProp="label"
                options={lookups.uoms}
                value={row.uom}
                placeholder="UOM"
                onChange={(value) => onRowChange(row.id, { uom: value })}
              />
            )
          },
          {
            title: config.warehouseMode === "source" ? "Warehouse" : "Target",
            width: 220,
            render: (_value, row) => (
              <Select
                showSearch
                allowClear
                disabled={readonly}
                optionFilterProp="label"
                options={lookups.warehouses}
                value={row.warehouse}
                placeholder="Optional override"
                onChange={(value) => onRowChange(row.id, { warehouse: value })}
              />
            )
          },
          {
            title: "Rate",
            width: 130,
            render: (_value, row) => (
              <InputNumber
                min={0}
                precision={2}
                value={row.rate}
                disabled={readonly}
                style={{ width: "100%" }}
                onChange={(value) => onRowChange(row.id, { rate: Number(value ?? 0), manual_rate: true })}
              />
            )
          },
          {
            title: "Amount",
            width: 120,
            render: (_value, row) => <Text>{row.amount.toFixed(2)}</Text>
          },
          {
            title: "Stock",
            width: 200,
            render: (_value, row) => {
              const validation = validationMap.get(row.id);
              return (
                <Space direction="vertical" size={2}>
                  <Text type="secondary">Required {row.stock_qty.toFixed(2)}</Text>
                  {validation ? (
                    <Text type={validation.ok ? "secondary" : "danger"}>
                      Available {validation.availableQty.toFixed(2)}
                      {!validation.ok ? ` | Short ${validation.shortageQty.toFixed(2)}` : ""}
                    </Text>
                  ) : (
                    <Text type="secondary">Live validation pending</Text>
                  )}
                  {row.warning ? <Text type="warning">{row.warning}</Text> : null}
                </Space>
              );
            }
          },
          {
            title: "",
            width: 72,
            render: (_value, row) =>
              !readonly ? (
                <Button
                  danger
                  type="text"
                  icon={<DeleteOutlined />}
                  onClick={() => onRemoveRow(row.id)}
                  disabled={rows.length === 1}
                />
              ) : null
          }
        ]}
      />
    </div>
  );
}
