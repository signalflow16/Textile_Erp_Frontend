import type { PosCartItem, PosFormState } from "@/modules/pos/types/pos";
import { variantSelectionError } from "@/modules/shared/variants/variant-utils";

export const validatePosBeforeSave = (form: PosFormState, items: PosCartItem[]) => {
  if (!form.pos_opening_entry || !form.pos_profile) {
    return "Start POS session before billing.";
  }

  if (!form.customer) {
    return "Select a customer before saving.";
  }

  if (!items.length) {
    return "Add at least one item to save the bill.";
  }

  const invalid = items.find((row) => !row.item_code || row.qty <= 0 || row.rate < 0);
  if (invalid) {
    return "Check item quantity and rate. Quantity must be greater than zero.";
  }

  const templateRow = items.find((row) =>
    variantSelectionError({
      item_code: row.item_code,
      variant_of: row.variant_of,
      has_variants: row.has_variants
    })
  );
  if (templateRow) {
    return "Template items cannot be billed. Select a variant SKU.";
  }

  const batchMissingRow = items.find((row) => row.has_batch_no && !row.batch_no?.trim());
  if (batchMissingRow) {
    return `Batch No is required for ${batchMissingRow.item_code}.`;
  }

  return null;
};

export const validatePosBeforeSubmit = (form: PosFormState, items: PosCartItem[]) => {
  const baseError = validatePosBeforeSave(form, items);
  if (baseError) {
    return baseError;
  }

  if (!form.mode_of_payment) {
    return "Choose a payment mode before submitting.";
  }

  if (typeof form.paid_amount !== "number" || !Number.isFinite(form.paid_amount) || form.paid_amount < 0) {
    return "Enter a valid paid amount before submitting.";
  }

  return null;
};

