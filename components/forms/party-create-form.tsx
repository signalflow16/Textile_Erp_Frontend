"use client";

import { Form, Input, Select } from "antd";

import type { CustomerCreateValues, SupplierCreateValues } from "@/modules/stock/types/master-data";
import type { LookupOption } from "@/modules/stock/types/item";

const supplierTypeOptions = [
  { label: "Company", value: "Company" },
  { label: "Individual", value: "Individual" }
];

export function SupplierCreateForm({
  form,
  supplierGroups
}: {
  form: ReturnType<typeof Form.useForm<SupplierCreateValues>>[0];
  supplierGroups: LookupOption[];
}) {
  return (
    <Form<SupplierCreateValues> form={form} layout="vertical" requiredMark={false}>
      <div className="master-form-grid">
        <Form.Item label="Supplier Name" name="supplier_name" rules={[{ required: true, message: "Supplier name is required." }]}>
          <Input placeholder="TexFab Traders" />
        </Form.Item>
        <Form.Item label="Supplier Group" name="supplier_group" rules={[{ required: true, message: "Supplier group is required." }]}>
          <Select
            showSearch
            optionFilterProp="label"
            options={supplierGroups}
            placeholder="Select supplier group"
            notFoundContent="No supplier groups available"
          />
        </Form.Item>
        <Form.Item label="Supplier Type" name="supplier_type" rules={[{ required: true, message: "Supplier type is required." }]}>
          <Select options={supplierTypeOptions} />
        </Form.Item>
        <Form.Item label="Mobile No" name="mobile_no">
          <Input placeholder="9876543210" />
        </Form.Item>
        <Form.Item label="Email ID" name="email_id">
          <Input placeholder="vendor@example.com" />
        </Form.Item>
        <Form.Item label="GSTIN" name="gstin">
          <Input placeholder="Optional" />
        </Form.Item>
      </div>
    </Form>
  );
}

export function CustomerCreateForm({
  form,
  customerGroups,
  territories
}: {
  form: ReturnType<typeof Form.useForm<CustomerCreateValues>>[0];
  customerGroups: LookupOption[];
  territories: LookupOption[];
}) {
  return (
    <Form<CustomerCreateValues> form={form} layout="vertical" requiredMark={false}>
      <div className="master-form-grid">
        <Form.Item label="Customer Name" name="customer_name" rules={[{ required: true, message: "Customer name is required." }]}>
          <Input placeholder="Metro Retail" />
        </Form.Item>
        <Form.Item label="Customer Group" name="customer_group" rules={[{ required: true, message: "Customer group is required." }]}>
          <Select
            showSearch
            optionFilterProp="label"
            options={customerGroups}
            placeholder="Select customer group"
            notFoundContent="No customer groups available"
          />
        </Form.Item>
        <Form.Item label="Territory" name="territory" rules={[{ required: true, message: "Territory is required." }]}>
          <Select
            showSearch
            optionFilterProp="label"
            options={territories}
            placeholder="Select territory"
            notFoundContent="No territories available"
          />
        </Form.Item>
        <Form.Item label="Mobile No" name="mobile_no">
          <Input placeholder="Optional" />
        </Form.Item>
        <Form.Item label="Email ID" name="email_id">
          <Input placeholder="Optional" />
        </Form.Item>
        <Form.Item label="GSTIN" name="gstin">
          <Input placeholder="Optional" />
        </Form.Item>
      </div>
    </Form>
  );
}
