"use client";

import { SellingDocumentList } from "@/modules/selling/components/SellingDocumentList";
import { useSellingMasters } from "@/modules/selling/hooks/useSellingMasters";
import { useListDeliveryNotes } from "@/modules/selling/hooks/useDeliveryNotes";

export function DeliveryNoteList() {
  const masters = useSellingMasters();

  return (
    <SellingDocumentList
      title="Delivery Notes"
      subtitle="Stock-out and dispatch records for customer deliveries."
      routeBase="/selling/delivery-notes"
      companies={masters.data?.companies ?? []}
      customers={masters.data?.customers ?? []}
      useList={useListDeliveryNotes}
    />
  );
}
