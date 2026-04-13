import type { PosCartItem, PosFormState, PosInvoiceDoc } from "@/modules/pos/types/pos";
import { calcPosTotals } from "@/modules/pos/utils/posCalculations";

const clean = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export const toPosInvoicePayload = (form: PosFormState, items: PosCartItem[]): PosInvoiceDoc => {
  const totals = calcPosTotals(items);
  const paidAmount = typeof form.paid_amount === "number" && form.paid_amount >= 0
    ? form.paid_amount
    : totals.grandTotal;

  return {
    customer: clean(form.customer) ?? "Walk-in Customer",
    posting_date: form.posting_date,
    due_date: form.posting_date,
    is_pos: 1,
    update_stock: 1,
    set_warehouse: clean(form.set_warehouse),
    remarks: clean(form.remarks),
    mode_of_payment: clean(form.mode_of_payment),
    paid_amount: paidAmount,
    items: items.map((row) => ({
      item_code: row.item_code,
      qty: row.qty,
      uom: clean(row.uom),
      rate: row.rate,
      gst_hsn_code: clean(row.hs_code),
      discount_percentage: row.discount_percentage > 0 ? row.discount_percentage : undefined,
      discount_amount: row.discount_amount > 0 ? row.discount_amount : undefined,
      warehouse: clean(row.warehouse) ?? clean(form.set_warehouse)
    })),
    payments: form.mode_of_payment
      ? [
          {
            mode_of_payment: form.mode_of_payment,
            amount: paidAmount
          }
        ]
      : undefined
  };
};
