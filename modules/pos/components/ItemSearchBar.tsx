"use client";

import { SearchOutlined } from "@ant-design/icons";
import { Button, Card, Input, InputNumber, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";

import type { PosItemLookup } from "@/modules/pos/types/pos";

const { Text } = Typography;

type ItemSearchBarProps = {
  searchText: string;
  barcodeText: string;
  items: PosItemLookup[];
  loading?: boolean;
  barcodeLoading?: boolean;
  onSearchChange: (value: string) => void;
  onBarcodeChange: (value: string) => void;
  onAddFirst: () => void;
  onScanBarcode: () => void;
  onAddItem: (item: PosItemLookup) => void;
};

export function ItemSearchBar({
  searchText,
  barcodeText,
  items,
  loading,
  barcodeLoading,
  onSearchChange,
  onBarcodeChange,
  onAddFirst,
  onScanBarcode,
  onAddItem
}: ItemSearchBarProps) {
  const columns: ColumnsType<PosItemLookup> = [
    {
      title: "Item",
      dataIndex: "item_name",
      key: "item_name",
      render: (_value, row) => (
        <Space direction="vertical" size={0}>
          <Text strong>{row.item_name ?? row.label}</Text>
          <Text type="secondary">{row.value}</Text>
          {row.variant_of ? <Text type="secondary">Variant of: {row.variant_of}</Text> : null}
        </Space>
      )
    },
    {
      title: "Rate",
      key: "rate",
      width: 140,
      render: (_value, row) => (
        <InputNumber
          value={row.standard_rate ?? 0}
          controls={false}
          precision={2}
          readOnly
          style={{ width: "100%" }}
          formatter={(value) => `${value ?? 0}`}
        />
      )
    },
    {
      title: "Barcode",
      key: "barcode",
      width: 180,
      render: (_value, row) => (row.barcode ? <Tag>{row.barcode}</Tag> : <Text type="secondary">NA</Text>)
    },
    {
      title: "Action",
      key: "action",
      width: 120,
      render: (_value, row) => (
        <Button size="small" type="primary" onClick={() => onAddItem(row)}>
          Add
        </Button>
      )
    }
  ];

  return (
    <Card size="small" title="Add Item">
      <div className="pos-item-search-grid">
        <Input
          allowClear
          prefix={<SearchOutlined />}
          value={searchText}
          placeholder="Search by item name or code"
          onChange={(event) => onSearchChange(event.target.value)}
          onPressEnter={onAddFirst}
        />

        <Space.Compact block>
          <Input
            allowClear
            value={barcodeText}
            placeholder="Scan or enter barcode"
            onChange={(event) => onBarcodeChange(event.target.value)}
            onPressEnter={onScanBarcode}
          />
          <Button type="primary" loading={barcodeLoading} onClick={onScanBarcode}>
            Scan
          </Button>
        </Space.Compact>
      </div>
      <div style={{ marginTop: 10 }}>
        <Table<PosItemLookup>
          size="small"
          rowKey={(row) => row.value}
          dataSource={items}
          columns={columns}
          loading={loading}
          pagination={false}
          locale={{ emptyText: searchText ? "No matching items found." : "Search item and add quickly." }}
          scroll={{ y: 240 }}
          onRow={(row) => ({
            onDoubleClick: () => onAddItem(row)
          })}
        />
      </div>
    </Card>
  );
}
