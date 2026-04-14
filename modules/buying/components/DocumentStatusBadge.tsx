"use client";

import { Tag } from "antd";

import { toDisplayStatus, toStatusColor } from "@/modules/buying/utils/statusMapper";
import type { BuyingDocStatus } from "@/modules/buying/types/buying";

export function DocumentStatusBadge({ status, docstatus }: { status?: string; docstatus?: BuyingDocStatus }) {
  return <Tag color={toStatusColor(status, docstatus)}>{toDisplayStatus(status, docstatus)}</Tag>;
}
