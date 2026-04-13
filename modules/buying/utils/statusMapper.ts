import type { BuyingDocStatus } from "@/modules/buying/types/buying";

const normalize = (value: unknown) => (typeof value === "string" ? value.trim().toLowerCase() : "");

export const toDisplayStatus = (status: unknown, docstatus?: BuyingDocStatus) => {
  const token = normalize(status);

  if (token) {
    return token.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  }

  if (docstatus === 1) {
    return "Submitted";
  }

  if (docstatus === 2) {
    return "Cancelled";
  }

  return "Draft";
};

export const toStatusColor = (status: unknown, docstatus?: BuyingDocStatus) => {
  const token = normalize(status);

  if (["completed", "received", "billed", "paid", "submitted"].includes(token)) {
    return "green";
  }

  if (["partially received", "partially billed", "open", "pending"].includes(token)) {
    return "blue";
  }

  if (["cancelled", "rejected", "expired", "closed"].includes(token) || docstatus === 2) {
    return "red";
  }

  if (docstatus === 1) {
    return "cyan";
  }

  return "default";
};

export const isDraft = (docstatus?: BuyingDocStatus) => docstatus !== 1 && docstatus !== 2;
