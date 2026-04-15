import { useCallback } from "react";

import {
  useCreateSupplierQuotationMutation,
  useGetSupplierQuotationQuery,
  useListSupplierQuotationsQuery,
  useSubmitSupplierQuotationMutation,
  useUpdateSupplierQuotationMutation
} from "@/modules/buying/api/buyingApi";
import type { BuyingListParams, SupplierQuotationDoc } from "@/modules/buying/types/buying";

export const useListSupplierQuotations = (params: BuyingListParams) => useListSupplierQuotationsQuery(params);
export const useGetSupplierQuotation = (name?: string) =>
  useGetSupplierQuotationQuery(name as string, { skip: !name });

export const useCreateSupplierQuotation = () => {
  const [trigger, state] = useCreateSupplierQuotationMutation();
  const submit = useCallback((payload: SupplierQuotationDoc) => trigger(payload).unwrap(), [trigger]);
  return { submit, ...state };
};

export const useUpdateSupplierQuotation = () => {
  const [trigger, state] = useUpdateSupplierQuotationMutation();
  const submit = useCallback((name: string, values: SupplierQuotationDoc) => trigger({ name, values }).unwrap(), [trigger]);
  return { submit, ...state };
};

export const useSubmitSupplierQuotation = () => {
  const [trigger, state] = useSubmitSupplierQuotationMutation();
  const submit = useCallback((name: string) => trigger(name).unwrap(), [trigger]);
  return { submit, ...state };
};
