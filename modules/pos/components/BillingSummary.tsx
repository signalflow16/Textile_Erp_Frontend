"use client";

import { Card, Descriptions, Typography } from "antd";

import type { PosTotals } from "@/modules/pos/types/pos";

const { Text } = Typography;

export function BillingSummary({ totals }: { totals: PosTotals }) {
  return (
    <Card size="small" title="Summary">
      <Descriptions column={1} size="small">
        <Descriptions.Item label="Total Items">{totals.totalItems}</Descriptions.Item>
        <Descriptions.Item label="Subtotal">{totals.subtotal.toFixed(2)}</Descriptions.Item>
        <Descriptions.Item label="Discount Total">{totals.discountTotal.toFixed(2)}</Descriptions.Item>
        <Descriptions.Item label={<Text strong>Grand Total</Text>}>
          <Text strong>{totals.grandTotal.toFixed(2)}</Text>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
}
