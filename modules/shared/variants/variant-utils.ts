"use client";

import { isVariantOnlyTransactionsEnabled } from "@/modules/shared/variants/variant-policy";

type VariantLike = {
  item_code?: string;
  item_name?: string | null;
  variant_of?: string | null;
  has_variants?: 0 | 1 | boolean | null;
  color?: string | null;
  size?: string | null;
  design?: string | null;
};

export const isTemplateItem = (item: Pick<VariantLike, "has_variants" | "variant_of"> | null | undefined) =>
  Boolean(item?.has_variants) && !item?.variant_of;

export const isVariantItem = (item: Pick<VariantLike, "variant_of"> | null | undefined) =>
  Boolean(item?.variant_of);

export const formatVariantDescriptor = (item: VariantLike) => {
  const attrs = [item.color, item.size, item.design]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
  if (attrs.length) {
    return attrs.join(" / ");
  }

  if (item.variant_of && item.item_name) {
    const normalizedTemplate = item.variant_of.trim().toLowerCase();
    const normalizedName = item.item_name.trim();
    if (normalizedName.toLowerCase().startsWith(normalizedTemplate)) {
      return normalizedName.slice(item.variant_of.length).replace(/^[-\s/]+/, "").trim() || null;
    }
  }

  return null;
};

export const toVariantItemLabel = (item: VariantLike) => {
  const base = item.item_name?.trim() || item.item_code?.trim() || "";
  const descriptor = formatVariantDescriptor(item);
  if (!descriptor) {
    return base || item.item_code || "";
  }
  return `${base} (${descriptor})`;
};

export const variantSelectionError = (item: Pick<VariantLike, "item_code" | "has_variants" | "variant_of"> | null | undefined) => {
  if (!isVariantOnlyTransactionsEnabled()) {
    return null;
  }
  if (!item?.item_code) {
    return null;
  }
  if (isTemplateItem(item)) {
    return "Template items cannot be transacted. Please select a variant SKU.";
  }
  return null;
};
