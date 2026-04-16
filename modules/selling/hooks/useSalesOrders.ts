import { useCallback } from "react";

import {
  useCancelSalesOrderMutation,
  useCreateSalesOrderMutation,
  useGetSalesOrderQuery,
  useListSalesOrdersQuery,
  useSubmitSalesOrderMutation,
  useUpdateSalesOrderMutation
} from "@/modules/selling/api/sellingApi";
import type { SalesOrderDoc, SellingListParams } from "@/modules/selling/types/selling";

export const useListSalesOrders = (params: SellingListParams) => useListSalesOrdersQuery(params);
export const useGetSalesOrder = (name?: string) => useGetSalesOrderQuery(name as string, { skip: !name });

export const useCreateSalesOrder = () => {
  const [trigger, state] = useCreateSalesOrderMutation();
  const submit = useCallback((payload: SalesOrderDoc) => trigger(payload).unwrap(), [trigger]);
  return { submit, ...state };
};

export const useUpdateSalesOrder = () => {
  const [trigger, state] = useUpdateSalesOrderMutation();
  const submit = useCallback((name: string, values: SalesOrderDoc) => trigger({ name, values }).unwrap(), [trigger]);
  return { submit, ...state };
};

export const useSubmitSalesOrder = () => {
  const [trigger, state] = useSubmitSalesOrderMutation();
  const submit = useCallback((name: string) => trigger(name).unwrap(), [trigger]);
  return { submit, ...state };
};

export const useCancelSalesOrder = () => {
  const [trigger, state] = useCancelSalesOrderMutation();
  const submit = useCallback((name: string) => trigger(name).unwrap(), [trigger]);
  return { submit, ...state };
};
