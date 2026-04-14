"use client";

import { Tag } from "antd";

import type { DocumentStatus } from "@/types/document-engine";

export function StatusBadge({ status }: { status?: DocumentStatus | null }) {
  if (status === 1) {
    return <Tag color="success" bordered={false}>Submitted</Tag>;
  }

  if (status === 2) {
    return <Tag color="default" bordered={false}>Cancelled</Tag>;
  }

  return <Tag color="warning" bordered={false}>Draft</Tag>;
}
