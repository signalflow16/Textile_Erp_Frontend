import { useCallback } from "react";

import {
  useCancelQuotationMutation,
  useCreateQuotationMutation,
  useGetQuotationQuery,
  useListQuotationsQuery,
  useSubmitQuotationMutation,
  useUpdateQuotationMutation
} from "@/modules/selling/api/sellingApi";
import type { QuotationDoc, SellingListParams } from "@/modules/selling/types/selling";

export const useListQuotations = (params: SellingListParams) => useListQuotationsQuery(params);
export const useGetQuotation = (name?: string) => useGetQuotationQuery(name as string, { skip: !name });

export const useCreateQuotation = () => {
  const [trigger, state] = useCreateQuotationMutation();
  const submit = useCallback((payload: QuotationDoc) => trigger(payload).unwrap(), [trigger]);
  return { submit, ...state };
};

export const useUpdateQuotation = () => {
  const [trigger, state] = useUpdateQuotationMutation();
  const submit = useCallback((name: string, values: QuotationDoc) => trigger({ name, values }).unwrap(), [trigger]);
  return { submit, ...state };
};

export const useSubmitQuotation = () => {
  const [trigger, state] = useSubmitQuotationMutation();
  const submit = useCallback((name: string) => trigger(name).unwrap(), [trigger]);
  return { submit, ...state };
};

export const useCancelQuotation = () => {
  const [trigger, state] = useCancelQuotationMutation();
  const submit = useCallback((name: string) => trigger(name).unwrap(), [trigger]);
  return { submit, ...state };
};
