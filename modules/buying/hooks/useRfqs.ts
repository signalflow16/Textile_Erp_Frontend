import { useCallback } from "react";

import {
  useCreateRfqMutation,
  useGetRfqQuery,
  useListRfqsQuery,
  useSubmitRfqMutation,
  useUpdateRfqMutation
} from "@/modules/buying/api/buyingApi";
import type { BuyingListParams, RequestForQuotationDoc } from "@/modules/buying/types/buying";

export const useListRfqs = (params: BuyingListParams) => useListRfqsQuery(params);
export const useGetRfq = (name?: string) => useGetRfqQuery(name as string, { skip: !name });

export const useCreateRfq = () => {
  const [trigger, state] = useCreateRfqMutation();
  const submit = useCallback((payload: RequestForQuotationDoc) => trigger(payload).unwrap(), [trigger]);
  return { submit, ...state };
};

export const useUpdateRfq = () => {
  const [trigger, state] = useUpdateRfqMutation();
  const submit = useCallback((name: string, values: RequestForQuotationDoc) => trigger({ name, values }).unwrap(), [trigger]);
  return { submit, ...state };
};

export const useSubmitRfq = () => {
  const [trigger, state] = useSubmitRfqMutation();
  const submit = useCallback((name: string) => trigger(name).unwrap(), [trigger]);
  return { submit, ...state };
};
