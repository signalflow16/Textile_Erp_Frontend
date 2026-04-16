"use client";

import { Card, Space, Typography } from "antd";

import type { DocumentRecord } from "@/modules/shared/document/types/document-engine";
import { StatusBadge } from "./status-badge";

const { Text } = Typography;

export function SummarySidebar({
  document,
  partyLabel,
  total,
  taxTotal,
  grandTotal
}: {
  document?: DocumentRecord;
  partyLabel: string;
  total: number;
  taxTotal: number;
  grandTotal: number;
}) {
  return (
    <Card title="Summary">
      <Space direction="vertical" size={14} style={{ width: "100%" }}>
        <div><Text type="secondary">{partyLabel}</Text><div>{document?.party || "-"}</div></div>
        <div>
          <Text type="secondary">Status</Text>
          <div>
            <StatusBadge
              docstatus={document?.docstatus}
              status={document?.status}
              workflowState={document?.workflow_state}
            />
          </div>
        </div>
        <div><Text type="secondary">Warehouse</Text><div>{document?.set_warehouse || "-"}</div></div>
        <div><Text type="secondary">Subtotal</Text><div>{total.toFixed(2)}</div></div>
        <div><Text type="secondary">Taxes</Text><div>{taxTotal.toFixed(2)}</div></div>
        <div><Text type="secondary">Grand Total</Text><div>{grandTotal.toFixed(2)}</div></div>
      </Space>
    </Card>
  );
}
