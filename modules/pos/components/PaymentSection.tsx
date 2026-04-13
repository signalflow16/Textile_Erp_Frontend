"use client";

import { Card, Input, InputNumber, Select, Space, Tag, Typography } from "antd";

import type { PosPaymentMode } from "@/modules/pos/types/pos";

const { Text } = Typography;

export function PaymentSection({
  modeOfPayment,
  paymentModes,
  paidAmount,
  balanceAmount,
  remarks,
  onChangeMode,
  onChangePaidAmount,
  onChangeRemarks
}: {
  modeOfPayment?: string;
  paymentModes: PosPaymentMode[];
  paidAmount: number;
  balanceAmount: number;
  remarks?: string;
  onChangeMode: (value?: string) => void;
  onChangePaidAmount: (value?: number) => void;
  onChangeRemarks: (value?: string) => void;
}) {
  return (
    <Card size="small" title="Payment">
      <div className="pos-payment-grid">
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Select payment mode"
          value={modeOfPayment}
          options={paymentModes}
          onChange={(value) => onChangeMode(value)}
        />
        <InputNumber
          min={0}
          precision={2}
          value={paidAmount}
          placeholder="Paid amount"
          style={{ width: "100%" }}
          onChange={(value) => onChangePaidAmount(typeof value === "number" ? value : undefined)}
        />
        <Space align="center">
          <Text type="secondary">Balance / Return:</Text>
          <Tag color={balanceAmount < 0 ? "red" : "green"}>{balanceAmount.toFixed(2)}</Tag>
        </Space>
        <Input.TextArea
          rows={2}
          value={remarks}
          placeholder="Remarks (optional)"
          onChange={(event) => onChangeRemarks(event.target.value || undefined)}
        />
      </div>
    </Card>
  );
}
