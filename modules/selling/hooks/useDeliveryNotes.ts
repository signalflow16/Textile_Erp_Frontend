import { useCallback } from "react";

import {
  useCancelDeliveryNoteMutation,
  useCreateDeliveryNoteMutation,
  useGetDeliveryNoteQuery,
  useListDeliveryNotesQuery,
  useSubmitDeliveryNoteMutation,
  useUpdateDeliveryNoteMutation
} from "@/modules/selling/api/sellingApi";
import type { DeliveryNoteDoc, SellingListParams } from "@/modules/selling/types/selling";

export const useListDeliveryNotes = (params: SellingListParams) => useListDeliveryNotesQuery(params);
export const useGetDeliveryNote = (name?: string) => useGetDeliveryNoteQuery(name as string, { skip: !name });

export const useCreateDeliveryNote = () => {
  const [trigger, state] = useCreateDeliveryNoteMutation();
  const submit = useCallback((payload: DeliveryNoteDoc) => trigger(payload).unwrap(), [trigger]);
  return { submit, ...state };
};

export const useUpdateDeliveryNote = () => {
  const [trigger, state] = useUpdateDeliveryNoteMutation();
  const submit = useCallback((name: string, values: DeliveryNoteDoc) => trigger({ name, values }).unwrap(), [trigger]);
  return { submit, ...state };
};

export const useSubmitDeliveryNote = () => {
  const [trigger, state] = useSubmitDeliveryNoteMutation();
  const submit = useCallback((name: string) => trigger(name).unwrap(), [trigger]);
  return { submit, ...state };
};

export const useCancelDeliveryNote = () => {
  const [trigger, state] = useCancelDeliveryNoteMutation();
  const submit = useCallback((name: string) => trigger(name).unwrap(), [trigger]);
  return { submit, ...state };
};
