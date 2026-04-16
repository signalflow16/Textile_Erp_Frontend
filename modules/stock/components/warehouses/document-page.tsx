"use client";

import { Button, Card, Checkbox, Form, Input, Select, Space, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";

import type { LookupOption } from "@/modules/stock/types/item";
import type { WarehouseCreateValues, WarehouseRow } from "@/modules/stock/types/master-data";

const { Text } = Typography;

export function WarehouseDocumentPage({
  mode,
  form,
  warehouse,
  parentOptions,
  companyOptions,
  loading,
  onSubmit,
  onCancel,
  onAddChild
}: {
  mode: "create" | "edit";
  form: ReturnType<typeof Form.useForm<WarehouseCreateValues>>[0];
  warehouse?: WarehouseRow;
  parentOptions: LookupOption[];
  companyOptions: LookupOption[];
  loading: boolean;
  onSubmit: (values: WarehouseCreateValues) => Promise<void>;
  onCancel: () => void;
  onAddChild: (warehouse: string) => void;
}) {
  return (
    <div className="warehouse-document-shell">
      <div className="item-group-document-main">
        <Card className="item-group-document-card">
          <div className="item-group-document-header">
            <div>
              <Text className="item-group-content-title">
                {mode === "create" ? "Create Warehouse" : warehouse?.warehouse_name || "Edit Warehouse"}
              </Text>
              <Text className="item-group-content-subtitle">
                {mode === "create"
                  ? "Create a new warehouse using the standard Frappe Warehouse resource."
                  : "Review the saved warehouse information and update it from a document-style page."}
              </Text>
            </div>
            <Space wrap>
              {mode === "edit" && warehouse && warehouse.is_group ? (
                <Button
                  icon={<PlusOutlined />}
                  onClick={() => onAddChild(warehouse.name)}
                >
                  Add Child
                </Button>
              ) : null}
              <Button type="primary" loading={loading} onClick={() => form.submit()}>
                {mode === "create" ? "Create" : "Save"}
              </Button>
              <Button onClick={onCancel}>Cancel</Button>
            </Space>
          </div>

          <Form<WarehouseCreateValues> form={form} layout="vertical" requiredMark={false} onFinish={onSubmit}>
            <div className="item-group-document-section">
              <Text className="item-group-document-section-title">General Settings</Text>

              <div className="item-group-document-form-grid item-group-document-form-grid-2">
                <Form.Item
                  label="Warehouse Name"
                  name="warehouse_name"
                  rules={[{ required: true, message: "Warehouse name is required." }]}
                >
                  <Input placeholder="Enter warehouse name" />
                </Form.Item>

                <Form.Item label="Company" name="company">
                  <Select
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    options={companyOptions}
                    placeholder="Select company"
                  />
                </Form.Item>
              </div>

              <div className="item-group-document-form-grid item-group-document-form-grid-2">
                <Form.Item label="Parent Warehouse" name="parent_warehouse">
                  <Select
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    options={parentOptions}
                    placeholder="Select parent warehouse"
                  />
                </Form.Item>

                <Form.Item name="is_group" valuePropName="checked" className="warehouse-checkbox-field">
                  <Checkbox>Is Group Warehouse</Checkbox>
                </Form.Item>
              </div>

              <Text type="secondary" className="item-group-document-help">
                Only group warehouses can contain child warehouses. Leaf warehouses stay as transaction endpoints.
              </Text>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
}
