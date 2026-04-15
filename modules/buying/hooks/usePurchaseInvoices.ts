import { useCallback } from "react";

import {
  useCreatePurchaseInvoiceMutation,
  useGetPurchaseInvoiceQuery,
  useListPurchaseInvoicesQuery,
  useSubmitPurchaseInvoiceMutation,
  useUpdatePurchaseInvoiceMutation
} from "@/modules/buying/api/buyingApi";
import type { BuyingListParams, PurchaseInvoiceDoc } from "@/modules/buying/types/buying";

export const useListPurchaseInvoices = (params: BuyingListParams) => useListPurchaseInvoicesQuery(params);
export const useGetPurchaseInvoice = (name?: string) => useGetPurchaseInvoiceQuery(name as string, { skip: !name });

export const useCreatePurchaseInvoice = () => {
  const [trigger, state] = useCreatePurchaseInvoiceMutation();
  const submit = useCallback((payload: PurchaseInvoiceDoc) => trigger(payload).unwrap(), [trigger]);
  return { submit, ...state };
};

export const useUpdatePurchaseInvoice = () => {
  const [trigger, state] = useUpdatePurchaseInvoiceMutation();
  const submit = useCallback((name: string, values: PurchaseInvoiceDoc) => trigger({ name, values }).unwrap(), [trigger]);
  return { submit, ...state };
};

export const useSubmitPurchaseInvoice = () => {
  const [trigger, state] = useSubmitPurchaseInvoiceMutation();
  const submit = useCallback((name: string) => trigger(name).unwrap(), [trigger]);
  return { submit, ...state };
};
