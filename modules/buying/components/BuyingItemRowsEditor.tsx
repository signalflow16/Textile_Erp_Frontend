"use client";

import { Button, Col, Form, Input, InputNumber, Row, Select, Space } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";

import type { LookupOption } from "@/modules/buying/types/buying";

export function BuyingItemRowsEditor({
  itemOptions,
  uomOptions,
  warehouseOptions,
  withRate = false,
  withWarehouse = true,
  withScheduleDate = false,
  withBatch = false,
  withRejectedQty = false
}: {
  itemOptions: LookupOption[];
  uomOptions: LookupOption[];
  warehouseOptions: LookupOption[];
  withRate?: boolean;
  withWarehouse?: boolean;
  withScheduleDate?: boolean;
  withBatch?: boolean;
  withRejectedQty?: boolean;
}) {
  return (
    <Form.List name="items">
      {(fields, { add, remove }) => (
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          {fields.map((field) => {
            const { key: _key, ...fieldProps } = field;

            return (
              <div key={field.key} className="buying-item-row">
              <Row gutter={12}>
                <Col xs={24} md={8}>
                  <Form.Item
                    {...fieldProps}
                    label={field.name === 0 ? "Item" : ""}
                    name={[field.name, "item_code"]}
                    rules={[{ required: true, message: "Item is required." }]}
                  >
                    <Select showSearch optionFilterProp="label" options={itemOptions} />
                  </Form.Item>
                </Col>
                <Col xs={12} md={4}>
                  <Form.Item
                    {...fieldProps}
                    label={field.name === 0 ? "Qty" : ""}
                    name={[field.name, "qty"]}
                    rules={[{ required: true, message: "Qty is required." }]}
                  >
                    <InputNumber min={0.001} precision={3} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={12} md={4}>
                  <Form.Item
                    {...fieldProps}
                    label={field.name === 0 ? "UOM" : ""}
                    name={[field.name, "uom"]}
                    rules={[{ required: true, message: "UOM is required." }]}
                  >
                    <Select showSearch optionFilterProp="label" options={uomOptions} />
                  </Form.Item>
                </Col>
                {withWarehouse ? (
                  <Col xs={24} md={6}>
                    <Form.Item {...fieldProps} label={field.name === 0 ? "Warehouse" : ""} name={[field.name, "warehouse"]}>
                      <Select allowClear showSearch optionFilterProp="label" options={warehouseOptions} />
                    </Form.Item>
                  </Col>
                ) : null}
                <Col xs={24} md={withWarehouse ? 2 : 8}>
                  <Button
                    danger
                    type="text"
                    icon={<DeleteOutlined />}
                    style={{ marginTop: field.name === 0 ? 30 : 2 }}
                    onClick={() => remove(field.name)}
                  />
                </Col>
              </Row>

              <Row gutter={12}>
                {withScheduleDate ? (
                  <Col xs={24} md={6}>
                    <Form.Item {...fieldProps} label="Schedule Date" name={[field.name, "schedule_date"]}>
                      <Input type="date" />
                    </Form.Item>
                  </Col>
                ) : null}
                {withRate ? (
                  <>
                    <Col xs={12} md={4}>
                      <Form.Item {...fieldProps} label="Rate" name={[field.name, "rate"]}>
                        <InputNumber min={0} precision={2} style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                    <Col xs={12} md={4}>
                      <Form.Item {...fieldProps} label="Amount" name={[field.name, "amount"]}>
                        <InputNumber min={0} precision={2} style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                  </>
                ) : null}
                {withRejectedQty ? (
                  <Col xs={12} md={4}>
                    <Form.Item {...fieldProps} label="Rejected Qty" name={[field.name, "rejected_qty"]}>
                      <InputNumber min={0} precision={3} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                ) : null}
                {withBatch ? (
                  <Col xs={24} md={6}>
                    <Form.Item {...fieldProps} label="Batch No" name={[field.name, "batch_no"]}>
                      <Input />
                    </Form.Item>
                  </Col>
                ) : null}
                <Col xs={24} md={withRate || withScheduleDate || withBatch || withRejectedQty ? 6 : 24}>
                  <Form.Item {...fieldProps} label="Description" name={[field.name, "description"]}>
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              </div>
            );
          })}

          <Button
            icon={<PlusOutlined />}
            onClick={() =>
              add({
                item_code: undefined,
                qty: 1,
                uom: undefined
              })
            }
          >
            Add Item
          </Button>
        </Space>
      )}
    </Form.List>
  );
}
