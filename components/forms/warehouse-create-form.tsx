"use client";

import { Checkbox, Form, Input, Select } from "antd";

import type { WarehouseCreateValues } from "@/modules/stock/types/master-data";
import type { LookupOption } from "@/modules/stock/types/item";

export function WarehouseCreateForm({
  form,
  warehouseOptions,
  companyOptions
}: {
  form: ReturnType<typeof Form.useForm<WarehouseCreateValues>>[0];
  warehouseOptions: LookupOption[];
  companyOptions: LookupOption[];
}) {
  return (
    <Form<WarehouseCreateValues> form={form} layout="vertical" requiredMark={false}>
      <Form.Item
        label="Warehouse Name"
        name="warehouse_name"
        rules={[{ required: true, message: "Warehouse name is required." }]}
      >
        <Input placeholder="Main Finished Goods" />
      </Form.Item>

      <Form.Item label="Parent Warehouse" name="parent_warehouse">
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          options={warehouseOptions}
          placeholder="Optional parent warehouse"
        />
      </Form.Item>

      <Form.Item label="Company" name="company">
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          options={companyOptions}
          placeholder="Select company if required"
        />
      </Form.Item>

      <Form.Item name="is_group" valuePropName="checked">
        <Checkbox>Create as a group warehouse</Checkbox>
      </Form.Item>
    </Form>
  );
}
