type StatusLike = {
  docstatus?: 0 | 1 | 2 | null;
  status?: string | null;
  workflow_state?: string | null;
};

const normalize = (value: unknown) => (typeof value === "string" ? value.trim().toLowerCase() : "");

const toTitleCase = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

export function getStatusLabel(doc: StatusLike): string {
  if (typeof doc.workflow_state === "string" && doc.workflow_state.trim()) {
    return doc.workflow_state.trim();
  }

  const statusToken = normalize(doc.status);
  if (statusToken) {
    return toTitleCase(statusToken);
  }

  if (doc.docstatus === 0) {
    return "Draft";
  }

  if (doc.docstatus === 1) {
    return "Submitted";
  }

  if (doc.docstatus === 2) {
    return "Cancelled";
  }

  return "Unknown";
}

export function getStatusColor(doc: StatusLike): string {
  const token = normalize(doc.workflow_state) || normalize(doc.status);

  if (["cancelled", "rejected"].includes(token) || doc.docstatus === 2) {
    return "red";
  }

  if (["approved", "completed", "paid", "received"].includes(token)) {
    return "green";
  }

  if (["pending", "in progress", "open", "partially billed", "partially received"].includes(token)) {
    return "blue";
  }

  if (doc.docstatus === 0) {
    return "blue";
  }

  if (doc.docstatus === 1) {
    return "green";
  }

  return "default";
}
