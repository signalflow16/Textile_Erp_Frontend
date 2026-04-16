"use client";

import { Tag } from "antd";

import { toDisplayStatus, toStatusColor } from "@/modules/buying/utils/statusMapper";
import type { BuyingDocStatus } from "@/modules/buying/types/buying";

export function DocumentStatusBadge({
  status,
  docstatus,
  workflowState
}: {
  status?: string;
  docstatus?: BuyingDocStatus;
  workflowState?: string;
}) {
  return <Tag color={toStatusColor(status, docstatus, workflowState)}>{toDisplayStatus(status, docstatus, workflowState)}</Tag>;
}
