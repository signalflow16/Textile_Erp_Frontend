"use client";

import Link from "next/link";
import { Card, Select, Space, Tag, Typography } from "antd";

import type { PosCustomerLookup } from "@/modules/pos/types/pos";

const { Text } = Typography;

export function CustomerSelector({
  customer,
  customerOptions,
  loading,
  onCustomerChange
}: {
  customer: string;
  customerOptions: PosCustomerLookup[];
  loading?: boolean;
  onCustomerChange: (value: string) => void;
}) {
  const selectedCustomerLabel = customerOptions.find((entry) => entry.value === customer)?.label ?? customer;

  return (
    <Card size="small" title="Customer">
      <div className="pos-customer-grid">
        <Select
          showSearch
          optionFilterProp="label"
          placeholder="Select customer"
          value={customer}
          options={customerOptions}
          loading={loading}
          onChange={onCustomerChange}
        />
        <Space size={12}>
          <Text type="secondary">Selected:</Text>
          <Tag color="blue">{selectedCustomerLabel || "Walk-in Customer"}</Tag>
          <Link href="/initial-setup/customers">Manage Customers</Link>
        </Space>
      </div>
    </Card>
  );
}
