"use client";

import { Tag } from "antd";

import type { DocumentStatus } from "@/modules/shared/document/types/document-engine";
import { getStatusColor, getStatusLabel } from "@/core/utils/status";

export function StatusBadge({
  docstatus,
  status,
  workflowState
}: {
  docstatus?: DocumentStatus | null;
  status?: string | null;
  workflowState?: string | null;
}) {
  return (
    <Tag color={getStatusColor({ docstatus, status, workflow_state: workflowState })} bordered={false}>
      {getStatusLabel({ docstatus, status, workflow_state: workflowState })}
    </Tag>
  );
}
