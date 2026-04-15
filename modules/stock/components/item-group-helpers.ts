"use client";

import type {
  ItemGroupDependencyCounts,
  ItemGroupDocument,
  ItemGroupMutationPayload
} from "@/modules/stock/types/item-group";

export type ItemGroupFormValues = {
  item_group_name: string;
  parent_item_group?: string;
  is_group: boolean;
  disabled: boolean;
  image?: string;
  description?: string;
};

const clean = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export const normalizeItemGroupPayload = (values: ItemGroupFormValues): ItemGroupMutationPayload => {
  // MIGRATION NOTE: Standard ERPNext Item Group resource portability is limited to core hierarchy fields.
  const payload: ItemGroupMutationPayload = {
    item_group_name: clean(values.item_group_name),
    parent_item_group: clean(values.parent_item_group) ?? null,
    is_group: values.is_group ? 1 : 0
  };

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  ) as ItemGroupMutationPayload;
};

export const toItemGroupFormValues = (itemGroup?: Partial<ItemGroupDocument>): Partial<ItemGroupFormValues> => ({
  item_group_name: itemGroup?.item_group_name ?? "",
  parent_item_group: itemGroup?.parent_item_group ?? undefined,
  is_group: Boolean(itemGroup?.is_group),
  disabled: Boolean(itemGroup?.disabled),
  image: itemGroup?.image ?? "",
  description: itemGroup?.description ?? ""
});

export const getErrorMessage = (error: unknown, fallback: string) => {
  if (!error || typeof error !== "object" || !("data" in error)) {
    return fallback;
  }

  const data = error.data as {
    message?: string;
    exception?: string;
    _server_messages?: string;
    details?: string;
  };

  if (data._server_messages) {
    try {
      const messages = JSON.parse(data._server_messages) as string[];
      const first = messages[0];
      if (first) {
        const parsed = JSON.parse(first) as { message?: string };
        if (parsed.message) {
          return parsed.message;
        }
      }
    } catch {
      return data.message || data.exception || data.details || fallback;
    }
  }

  return data.message || data.exception || data.details || fallback;
};

export const formatRelativeTime = (value?: string | null) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (Number.isNaN(diffMs)) {
    return value;
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) {
    const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    return `${diffMinutes} min`;
  }

  if (diffHours < 24) {
    return `${diffHours} h`;
  }

  return `${Math.floor(diffHours / 24)} d`;
};

export const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
};

export const formatDependencySummary = (counts?: ItemGroupDependencyCounts) => {
  const childGroups = counts?.child_groups ?? 0;
  const linkedItems = counts?.linked_items ?? 0;
  return `${childGroups} child groups, ${linkedItems} linked items`;
};
