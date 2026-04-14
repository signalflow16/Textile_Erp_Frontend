"use client";

import { Button, Checkbox, Form, InputNumber, Select, Space, Table } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";

import type { StockEntryCreateValues, StockEntryLookups } from "@/types/stock";

type StockEntryFormValues = {
  stock_entry_type: string;
  posting_date: unknown;
  posting_time: unknown;
  items: StockEntryCreateValues["items"];
};

export function StockEntryItemsTable({
  lookups
}: {
  lookups: StockEntryLookups;
}) {
  return (
    <Form.List name="items">
      {(fields, { add, remove }) => {
        const dataSource = fields.map((field) => ({ key: field.key, name: field.name }));

        return (
          <div className="stock-entry-items-shell">
            <div className="stock-entry-items-head">
              <div>
                <div className="stock-entry-section-title">Items</div>
                <div className="stock-entry-section-copy">Add one or more stock movement lines with source and target warehouses.</div>
              </div>
              <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ qty: 1 })}>
                Add Row
              </Button>
            </div>

            <Table
              className="stock-entry-items-table"
              rowKey="key"
              pagination={false}
              dataSource={dataSource}
              columns={[
                {
                  title: "Item Code",
                  dataIndex: "item_code",
                  width: 260,
                  render: (_value, record) => (
                    <Form.Item<StockEntryFormValues>
                      name={[record.name, "item_code"]}
                      rules={[{ required: true, message: "Item is required." }]}
                      style={{ marginBottom: 0 }}
                    >
                      <Select
                        showSearch
                        optionFilterProp="label"
                        options={lookups.items}
                        placeholder="Select item"
                      />
                    </Form.Item>
                  )
                },
                {
                  title: "Source Warehouse",
                  width: 220,
                  render: (_value, record) => (
                    <Form.Item<StockEntryFormValues> name={[record.name, "source_warehouse"]} style={{ marginBottom: 0 }}>
                      <Select
                        showSearch
                        allowClear
                        optionFilterProp="label"
                        options={lookups.warehouses}
                        placeholder="Optional"
                      />
                    </Form.Item>
                  )
                },
                {
                  title: "Target Warehouse",
                  width: 220,
                  render: (_value, record) => (
                    <Form.Item<StockEntryFormValues> name={[record.name, "target_warehouse"]} style={{ marginBottom: 0 }}>
                      <Select
                        showSearch
                        allowClear
                        optionFilterProp="label"
                        options={lookups.warehouses}
                        placeholder="Optional"
                      />
                    </Form.Item>
                  )
                },
                {
                  title: "Qty",
                  width: 120,
                  render: (_value, record) => (
                    <Form.Item<StockEntryFormValues>
                      name={[record.name, "qty"]}
                      rules={[{ required: true, message: "Qty is required." }]}
                      style={{ marginBottom: 0 }}
                    >
                      <InputNumber min={0.001} precision={3} style={{ width: "100%" }} />
                    </Form.Item>
                  )
                },
                {
                  title: "Basic Rate",
                  width: 140,
                  render: (_value, record) => (
                    <Form.Item<StockEntryFormValues> name={[record.name, "basic_rate"]} style={{ marginBottom: 0 }}>
                      <InputNumber min={0} precision={2} style={{ width: "100%" }} placeholder="Optional" />
                    </Form.Item>
                  )
                },
                {
                  title: "Allow Zero Valuation",
                  width: 170,
                  render: (_value, record) => (
                    <Form.Item<StockEntryFormValues>
                      name={[record.name, "allow_zero_valuation_rate"]}
                      valuePropName="checked"
                      style={{ marginBottom: 0 }}
                    >
                      <Checkbox />
                    </Form.Item>
                  )
                },
                {
                  title: "",
                  width: 72,
                  fixed: "right",
                  render: (_value, record) => (
                    <Space>
                      <Button
                        danger
                        type="text"
                        icon={<DeleteOutlined />}
                        onClick={() => remove(record.name)}
                        disabled={fields.length === 1}
                      />
                    </Space>
                  )
                }
              ]}
            />
          </div>
        );
      }}
    </Form.List>
  );
}
