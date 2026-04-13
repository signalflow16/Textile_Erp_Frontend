import { useCallback } from "react";

import {
  useCreateMaterialRequestMutation,
  useGetMaterialRequestQuery,
  useListMaterialRequestsQuery,
  useSubmitMaterialRequestMutation,
  useUpdateMaterialRequestMutation
} from "@/modules/buying/api/buyingApi";
import type { BuyingListParams, MaterialRequestDoc } from "@/modules/buying/types/buying";

export const useListMaterialRequests = (params: BuyingListParams) => useListMaterialRequestsQuery(params);
export const useGetMaterialRequest = (name?: string) =>
  useGetMaterialRequestQuery(name as string, { skip: !name });

export const useCreateMaterialRequest = () => {
  const [trigger, state] = useCreateMaterialRequestMutation();
  const submit = useCallback((payload: MaterialRequestDoc) => trigger(payload).unwrap(), [trigger]);
  return { submit, ...state };
};

export const useUpdateMaterialRequest = () => {
  const [trigger, state] = useUpdateMaterialRequestMutation();
  const submit = useCallback((name: string, values: MaterialRequestDoc) => trigger({ name, values }).unwrap(), [trigger]);
  return { submit, ...state };
};

export const useSubmitMaterialRequest = () => {
  const [trigger, state] = useSubmitMaterialRequestMutation();
  const submit = useCallback((name: string) => trigger(name).unwrap(), [trigger]);
  return { submit, ...state };
};
