"use client";

import { Card, Typography } from "antd";

import type { DocumentRecord } from "@/modules/shared/document/types/document-engine";

const { Text } = Typography;

export function AuditTimeline({ document }: { document?: DocumentRecord }) {
  return (
    <Card title="Audit Trail">
      <div className="document-audit-list">
        <div><Text type="secondary">Created By</Text><div>{document?.owner || "-"}</div></div>
        <div><Text type="secondary">Created At</Text><div>{document?.creation || "-"}</div></div>
        <div><Text type="secondary">Modified By</Text><div>{document?.modified_by || "-"}</div></div>
        <div><Text type="secondary">Modified At</Text><div>{document?.modified || "-"}</div></div>
      </div>
    </Card>
  );
}
