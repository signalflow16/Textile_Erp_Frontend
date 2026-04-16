"use client";

import { SellingDocumentDetail } from "@/modules/selling/components/SellingDocumentDetail";
import { useCancelDeliveryNote, useGetDeliveryNote, useSubmitDeliveryNote } from "@/modules/selling/hooks/useDeliveryNotes";

export function DeliveryNoteDetail({ name }: { name: string }) {
  const query = useGetDeliveryNote(name);
  const submit = useSubmitDeliveryNote();
  const cancel = useCancelDeliveryNote();

  return (
    <SellingDocumentDetail
      title="Delivery Note"
      routeBase="/selling/delivery-notes"
      document={(query.data ?? null) as unknown as Record<string, unknown> | null}
      loading={query.isFetching}
      error={query.error}
      onSubmitDraft={submit.submit}
      onCancelSubmitted={cancel.submit}
      submitLoading={submit.isLoading}
      cancelLoading={cancel.isLoading}
      stockImpactNote="Delivery Note posts the fulfillment stage and should align with the warehouse dispatch."
    />
  );
}
