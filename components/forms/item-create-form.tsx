"use client";

import { Alert, Form, Input, InputNumber, Select } from "antd";

import type { ItemCreateValues, ItemFieldAvailability, ItemFormLookups } from "@/types/master-data";

export function ItemCreateForm({
  form,
  lookups,
  fieldAvailability
}: {
  form: ReturnType<typeof Form.useForm<ItemCreateValues>>[0];
  lookups: ItemFormLookups;
  fieldAvailability: ItemFieldAvailability;
}) {
  const unavailableFields = Object.entries(fieldAvailability)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  return (
    <Form<ItemCreateValues> form={form} layout="vertical" requiredMark={false}>
      {unavailableFields.length ? (
        <Alert
          type="info"
          showIcon
          className="form-helper-alert"
          message="Textile helper fields are visible in the UI only."
          description={`The connected backend does not expose: ${unavailableFields.join(", ")}. Those values will be skipped during create.`}
        />
      ) : null}

      <Form.Item label="Item Name" name="item_name" rules={[{ required: true, message: "Item Name is required." }]}>
        <Input placeholder="Dyed Cotton Shirting" />
      </Form.Item>

      <Form.Item label="Item Group" name="item_group" rules={[{ required: true, message: "Item Group is required." }]}>
        <Select showSearch optionFilterProp="label" options={lookups.itemGroups} placeholder="Select item group" />
      </Form.Item>

      <Form.Item label="Unit" name="stock_uom" rules={[{ required: true, message: "Unit is required." }]}>
        <Select showSearch optionFilterProp="label" options={lookups.uoms} placeholder="Select UOM" />
      </Form.Item>

      <div className="master-form-grid">
        <Form.Item label="Fabric Type" name="fabric_type">
          <Input placeholder="Cotton" />
        </Form.Item>
        <Form.Item label="Color" name="color">
          <Input placeholder="Indigo Blue" />
        </Form.Item>
        <Form.Item label="GSM" name="gsm">
          <InputNumber min={1} style={{ width: "100%" }} placeholder="120" />
        </Form.Item>
      </div>
    </Form>
  );
}
