import type { SectionOutcome, SetupSectionKey, SetupUiStatus } from "@/modules/initial-setup/types/initialSetup";

export const setupSections: Array<{ key: SetupSectionKey; label: string }> = [
  { key: "company", label: "Company" },
  { key: "warehouses", label: "Warehouses" },
  { key: "uoms", label: "UOMs" },
  { key: "item_groups", label: "Item Groups" },
  { key: "suppliers", label: "Suppliers" },
  { key: "customers", label: "Customers" }
];

const normalizeToken = (value: unknown) => (typeof value === "string" ? value.trim().toLowerCase() : "");

export const toUiStatus = (value: unknown): SetupUiStatus => {
  const token = normalizeToken(value);

  if (["complete", "completed", "done", "success", "ready"].includes(token)) {
    return "completed";
  }

  if (["running", "in_progress", "processing", "partial", "started"].includes(token)) {
    return "in_progress";
  }

  if (["failed", "error", "invalid"].includes(token)) {
    return "failed";
  }

  return "not_started";
};

export const toOutcome = (value: unknown): SectionOutcome => {
  const token = normalizeToken(value);

  if (["created", "created_new"].includes(token)) {
    return "created";
  }

  if (["skip", "skipped", "already_exists", "exists"].includes(token)) {
    return "skipped";
  }

  if (["failed", "error", "invalid"].includes(token)) {
    return "failed";
  }

  if (["complete", "completed", "done", "success"].includes(token)) {
    return "completed";
  }

  return "not_started";
};

export const statusColor = (status: SetupUiStatus) => {
  if (status === "completed") {
    return "green";
  }

  if (status === "in_progress") {
    return "blue";
  }

  if (status === "failed") {
    return "red";
  }

  return "default";
};

export const outcomeColor = (outcome: SectionOutcome) => {
  if (outcome === "created" || outcome === "completed") {
    return "green";
  }

  if (outcome === "skipped") {
    return "gold";
  }

  if (outcome === "failed") {
    return "red";
  }

  return "default";
};

export const toReadiness = (data: Record<string, unknown> | null | undefined) => {
  if (!data) {
    return false;
  }

  if (typeof data.ready === "boolean") {
    return data.ready;
  }

  if (typeof data.is_ready === "boolean") {
    return data.is_ready;
  }

  if (typeof data.can_create_items === "boolean") {
    return data.can_create_items;
  }

  return false;
};