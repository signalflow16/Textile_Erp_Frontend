"use client";

import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Col, Form, Input, InputNumber, Row, Select, Space } from "antd";

import type { LookupOption } from "@/modules/selling/types/selling";

export function SellingItemRowsEditor({
  itemOptions,
  uomOptions,
  warehouseOptions,
  withRate = false,
  withWarehouse = true,
  withDeliveryDate = false
}: {
  itemOptions: LookupOption[];
  uomOptions: LookupOption[];
  warehouseOptions: LookupOption[];
  withRate?: boolean;
  withWarehouse?: boolean;
  withDeliveryDate?: boolean;
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
                  {withDeliveryDate ? (
                    <Col xs={24} md={6}>
                      <Form.Item {...fieldProps} label="Delivery Date" name={[field.name, "delivery_date"]}>
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
                          <InputNumber min={0} precision={2} style={{ width: "100%" }} disabled />
                        </Form.Item>
                      </Col>
                    </>
                  ) : null}
                  <Col xs={24} md={withRate || withDeliveryDate ? 10 : 24}>
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
                uom: undefined,
                conversion_factor: 1
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
