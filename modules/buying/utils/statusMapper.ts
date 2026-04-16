import type { BuyingDocStatus } from "@/modules/buying/types/buying";
import { getStatusColor, getStatusLabel } from "@/core/utils/status";

export const toDisplayStatus = (status: unknown, docstatus?: BuyingDocStatus, workflow_state?: unknown) =>
  getStatusLabel({
    status: typeof status === "string" ? status : null,
    workflow_state: typeof workflow_state === "string" ? workflow_state : null,
    docstatus
  });

export const toStatusColor = (status: unknown, docstatus?: BuyingDocStatus, workflow_state?: unknown) =>
  getStatusColor({
    status: typeof status === "string" ? status : null,
    workflow_state: typeof workflow_state === "string" ? workflow_state : null,
    docstatus
  });

export const isDraft = (docstatus?: BuyingDocStatus) => docstatus !== 1 && docstatus !== 2;
