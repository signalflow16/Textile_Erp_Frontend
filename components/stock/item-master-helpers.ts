"use client";

import type { ItemDocument } from "@/types/item";

export type ItemFormValues = {
  item_code: string;
  item_name?: string;
  item_group: string;
  stock_uom: string;
  disabled: boolean;
  is_stock_item: boolean;
  has_variants: boolean;
  variant_of?: string;
  standard_rate?: number;
  description?: string;
  brand?: string;
  style_code?: string;
  collection?: string;
  season?: string;
  fabric_type?: string;
  display_category?: string;
  shelf_rack_code?: string;
  primary_store?: string;
  barcodes?: { barcode: string; uom?: string }[];
};

const clean = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export const normalizeItemPayload = (values: ItemFormValues): ItemDocument => {
  const payload: ItemDocument = {
    item_code: values.item_code.trim(),
    item_name: clean(values.item_name),
    item_group: values.item_group,
    stock_uom: values.stock_uom,
    disabled: values.disabled ? 1 : 0,
    is_stock_item: values.is_stock_item ? 1 : 0,
    has_variants: values.has_variants ? 1 : 0,
    variant_of: clean(values.variant_of),
    standard_rate: values.standard_rate,
    description: clean(values.description),
    brand: clean(values.brand),
    style_code: clean(values.style_code),
    collection: clean(values.collection),
    season: clean(values.season),
    fabric_type: clean(values.fabric_type),
    display_category: clean(values.display_category),
    shelf_rack_code: clean(values.shelf_rack_code),
    primary_store: clean(values.primary_store),
    barcodes:
      values.barcodes
        ?.filter((barcode) => barcode.barcode?.trim())
        .map((barcode) => ({
          barcode: barcode.barcode.trim(),
          uom: clean(barcode.uom)
        })) ?? []
  };

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => {
      if (value === undefined || value === null || value === "") {
        return false;
      }

      if (Array.isArray(value)) {
        return value.length > 0;
      }

      return true;
    })
  ) as ItemDocument;
};

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

export const formatRelativeTime = (value: string) => {
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
