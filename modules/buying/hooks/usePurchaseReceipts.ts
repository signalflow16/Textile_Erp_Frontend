import { useCallback } from "react";

import {
  useCreatePurchaseReceiptMutation,
  useGetPurchaseReceiptQuery,
  useListPurchaseReceiptsQuery,
  useSubmitPurchaseReceiptMutation,
  useUpdatePurchaseReceiptMutation
} from "@/modules/buying/api/buyingApi";
import type { BuyingListParams, PurchaseReceiptDoc } from "@/modules/buying/types/buying";

export const useListPurchaseReceipts = (params: BuyingListParams) => useListPurchaseReceiptsQuery(params);
export const useGetPurchaseReceipt = (name?: string) => useGetPurchaseReceiptQuery(name as string, { skip: !name });

export const useCreatePurchaseReceipt = () => {
  const [trigger, state] = useCreatePurchaseReceiptMutation();
  const submit = useCallback((payload: PurchaseReceiptDoc) => trigger(payload).unwrap(), [trigger]);
  return { submit, ...state };
};

export const useUpdatePurchaseReceipt = () => {
  const [trigger, state] = useUpdatePurchaseReceiptMutation();
  const submit = useCallback((name: string, values: PurchaseReceiptDoc) => trigger({ name, values }).unwrap(), [trigger]);
  return { submit, ...state };
};

export const useSubmitPurchaseReceipt = () => {
  const [trigger, state] = useSubmitPurchaseReceiptMutation();
  const submit = useCallback((name: string) => trigger(name).unwrap(), [trigger]);
  return { submit, ...state };
};
