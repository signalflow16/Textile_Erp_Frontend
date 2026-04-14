import { useCallback } from "react";

import {
  useCreatePurchaseOrderMutation,
  useGetPurchaseOrderQuery,
  useListPurchaseOrdersQuery,
  useSubmitPurchaseOrderMutation,
  useUpdatePurchaseOrderMutation
} from "@/modules/buying/api/buyingApi";
import type { BuyingListParams, PurchaseOrderDoc } from "@/modules/buying/types/buying";

export const useListPurchaseOrders = (params: BuyingListParams) => useListPurchaseOrdersQuery(params);
export const useGetPurchaseOrder = (name?: string) => useGetPurchaseOrderQuery(name as string, { skip: !name });

export const useCreatePurchaseOrder = () => {
  const [trigger, state] = useCreatePurchaseOrderMutation();
  const submit = useCallback((payload: PurchaseOrderDoc) => trigger(payload).unwrap(), [trigger]);
  return { submit, ...state };
};

export const useUpdatePurchaseOrder = () => {
  const [trigger, state] = useUpdatePurchaseOrderMutation();
  const submit = useCallback((name: string, values: PurchaseOrderDoc) => trigger({ name, values }).unwrap(), [trigger]);
  return { submit, ...state };
};

export const useSubmitPurchaseOrder = () => {
  const [trigger, state] = useSubmitPurchaseOrderMutation();
  const submit = useCallback((name: string) => trigger(name).unwrap(), [trigger]);
  return { submit, ...state };
};
