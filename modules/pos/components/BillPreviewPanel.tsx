"use client";

import { Card, Divider, List, Space, Tag, Typography } from "antd";

import type { PosCartItem, PosTotals } from "@/modules/pos/types/pos";
import { calcLineAmount } from "@/modules/pos/utils/posCalculations";

const { Text } = Typography;

export function BillPreviewPanel({
  customer,
  rows,
  totals,
  invoiceName
}: {
  customer: string;
  rows: PosCartItem[];
  totals: PosTotals;
  invoiceName?: string | null;
}) {
  return (
    <Card size="small" title="Bill Preview" extra={invoiceName ? <Tag color="blue">{invoiceName}</Tag> : null}>
      <Space direction="vertical" size={8} style={{ width: "100%" }}>
        <Text type="secondary">Customer</Text>
        <Text strong>{customer || "Walk-in Customer"}</Text>
        <Divider style={{ margin: "8px 0" }} />
        <List
          size="small"
          dataSource={rows}
          locale={{ emptyText: "No items yet." }}
          renderItem={(row) => (
            <List.Item>
              <div style={{ width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <Text strong>{row.item_name || row.item_code}</Text>
                  <Text strong>{calcLineAmount(row).toFixed(2)}</Text>
                </div>
                <Text type="secondary">
                  {row.qty} x {row.rate.toFixed(2)} {row.hs_code ? `| HS ${row.hs_code}` : ""}
                </Text>
              </div>
            </List.Item>
          )}
        />
        <Divider style={{ margin: "8px 0" }} />
        <div style={{ display: "grid", gap: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Text type="secondary">Subtotal</Text>
            <Text>{totals.subtotal.toFixed(2)}</Text>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Text type="secondary">Item Discount</Text>
            <Text>{totals.itemDiscountTotal.toFixed(2)}</Text>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Text type="secondary">Net Subtotal</Text>
            <Text>{totals.netSubtotal.toFixed(2)}</Text>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Text type="secondary">Overall Discount</Text>
            <Text>{totals.overallDiscountTotal.toFixed(2)}</Text>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Text type="secondary">Discount Total</Text>
            <Text>{totals.discountTotal.toFixed(2)}</Text>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Text strong>Grand Total</Text>
            <Text strong>{totals.grandTotal.toFixed(2)}</Text>
          </div>
        </div>
      </Space>
    </Card>
  );
}
