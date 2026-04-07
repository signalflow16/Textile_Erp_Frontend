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
  allow_alternative_item: boolean;
  is_fixed_asset: boolean;
  valuation_rate?: number;
  over_delivery_receipt_allowance?: number;
  over_billing_allowance?: number;
  shelf_life_in_days?: number;
  end_of_life?: string;
  warranty_period?: number;
  weight_per_unit?: number;
  weight_uom?: string;
  default_material_request_type?: string;
  valuation_method?: string;
  allow_negative_stock: boolean;
  allow_purchase: boolean;
  min_order_qty?: number;
  safety_stock?: number;
  lead_time_days?: number;
  last_purchase_rate?: number;
  customer_provided_item: boolean;
  grant_commission: boolean;
  allow_sales: boolean;
  max_discount?: number;
  inspection_required_before_purchase: boolean;
  inspection_required_before_delivery: boolean;
  quality_inspection_template?: string;
  barcodes?: { barcode: string; uom?: string }[];
  item_defaults?: { company: string; default_warehouse?: string; default_price_list?: string }[];
  taxes?: {
    item_tax_template: string;
    tax_category?: string;
    valid_from?: string;
    minimum_net_rate?: number;
    maximum_net_rate?: number;
  }[];
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
    allow_alternative_item: values.allow_alternative_item ? 1 : 0,
    is_fixed_asset: values.is_fixed_asset ? 1 : 0,
    valuation_rate: values.valuation_rate,
    over_delivery_receipt_allowance: values.over_delivery_receipt_allowance,
    over_billing_allowance: values.over_billing_allowance,
    shelf_life_in_days: values.shelf_life_in_days,
    end_of_life: clean(values.end_of_life),
    warranty_period: values.warranty_period,
    weight_per_unit: values.weight_per_unit,
    weight_uom: clean(values.weight_uom),
    default_material_request_type: clean(values.default_material_request_type),
    valuation_method: clean(values.valuation_method),
    allow_negative_stock: values.allow_negative_stock ? 1 : 0,
    allow_purchase: values.allow_purchase ? 1 : 0,
    min_order_qty: values.min_order_qty,
    safety_stock: values.safety_stock,
    lead_time_days: values.lead_time_days,
    last_purchase_rate: values.last_purchase_rate,
    customer_provided_item: values.customer_provided_item ? 1 : 0,
    grant_commission: values.grant_commission ? 1 : 0,
    allow_sales: values.allow_sales ? 1 : 0,
    max_discount: values.max_discount,
    inspection_required_before_purchase: values.inspection_required_before_purchase ? 1 : 0,
    inspection_required_before_delivery: values.inspection_required_before_delivery ? 1 : 0,
    quality_inspection_template: clean(values.quality_inspection_template),
    barcodes:
      values.barcodes
        ?.filter((barcode) => barcode.barcode?.trim())
        .map((barcode) => ({
          barcode: barcode.barcode.trim(),
          uom: clean(barcode.uom)
        })) ?? [],
    item_defaults:
      values.item_defaults
        ?.filter((row) => row.company?.trim())
        .map((row) => ({
          company: row.company.trim(),
          default_warehouse: clean(row.default_warehouse),
          default_price_list: clean(row.default_price_list)
        })) ?? [],
    taxes:
      values.taxes
        ?.filter((row) => row.item_tax_template?.trim())
        .map((row) => ({
          item_tax_template: row.item_tax_template.trim(),
          tax_category: clean(row.tax_category),
          valid_from: clean(row.valid_from),
          minimum_net_rate: row.minimum_net_rate,
          maximum_net_rate: row.maximum_net_rate
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
