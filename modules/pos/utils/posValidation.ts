import type { PosCartItem, PosFormState } from "@/modules/pos/types/pos";

export const validatePosBeforeSave = (form: PosFormState, items: PosCartItem[]) => {
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

  return null;
};

