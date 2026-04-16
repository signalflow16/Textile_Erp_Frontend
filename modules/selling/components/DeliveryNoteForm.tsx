"use client";

import { useRouter } from "next/navigation";
import { App } from "antd";

import { SellingDocumentForm } from "@/modules/selling/components/SellingDocumentForm";
import { useDocumentSaveSubmit } from "@/modules/selling/hooks/useDocumentSaveSubmit";
import { useCreateDeliveryNote, useGetDeliveryNote, useSubmitDeliveryNote, useUpdateDeliveryNote } from "@/modules/selling/hooks/useDeliveryNotes";
import { useGetSalesOrder } from "@/modules/selling/hooks/useSalesOrders";
import type { DeliveryNoteDoc, SalesOrderDoc } from "@/modules/selling/types/selling";
import { salesOrderToDeliveryNote } from "@/modules/selling/utils/sourcePrefillMappers";
import type { SourceReference } from "@/modules/selling/utils/sourceRouteHelpers";

export function DeliveryNoteForm({ name, sourceDoctype, sourceName }: { name?: string; sourceDoctype?: string; sourceName?: string }) {
  const { message } = App.useApp();
  const router = useRouter();
  const detail = useGetDeliveryNote(name);
  const sourceSalesOrder = useGetSalesOrder(!name && sourceDoctype === "Sales Order" ? sourceName : undefined);
  const create = useCreateDeliveryNote();
  const update = useUpdateDeliveryNote();
  const submit = useSubmitDeliveryNote();
  const sourceDoc = sourceSalesOrder.data as SalesOrderDoc | undefined;
  const initialDoc = detail.data as DeliveryNoteDoc | undefined;
  const sourceReference: SourceReference | null =
    !name && sourceDoctype === "Sales Order" && sourceName ? { doctype: "Sales Order", name: sourceName } : null;
  const initialValues = name
    ? (detail.data as unknown as Record<string, unknown>)
    : sourceDoc
      ? (salesOrderToDeliveryNote(sourceDoc) as unknown as Record<string, unknown>)
      : undefined;

  const formActions = useDocumentSaveSubmit<Record<string, unknown>, DeliveryNoteDoc, DeliveryNoteDoc>({
    doctype: "Delivery Note",
    initialDocName: name ?? initialDoc?.name,
    initialSubmitted: initialDoc?.docstatus === 1,
    createPayloadMapper: (values) => values as unknown as DeliveryNoteDoc,
    updatePayloadMapper: (values) => values as unknown as DeliveryNoteDoc,
    createDraft: (payload) => create.submit(payload),
    updateDraft: (docName, payload) => update.submit(docName, payload),
    submitDraft: (docName) => submit.submit(docName),
    onSaved: (doc) => {
      message.success("Delivery Note saved as draft.");
      if (!name && doc.name) {
        router.replace(`/selling/delivery-notes/${encodeURIComponent(doc.name)}?edit=1`);
      } else {
        router.refresh();
      }
    },
    onSubmitted: (doc) => {
      message.success("Delivery Note submitted.");
      const finalName = doc.name ?? name;
      if (finalName) {
        router.replace(`/selling/delivery-notes/${encodeURIComponent(finalName)}`);
      } else {
        router.refresh();
      }
    }
  });

  return (
    <SellingDocumentForm
      title={name ? `Edit Delivery Note ${name}` : "Create Delivery Note"}
      flowHint="Delivery Note records dispatch and stock-out for fulfilled sales."
      kind="delivery-note"
      initialValues={initialValues}
      loading={Boolean(name) ? detail.isFetching : sourceSalesOrder.isFetching}
      error={detail.error}
      isSavingDraft={formActions.isSaving}
      isSubmittingDoc={formActions.isSubmitting}
      onSaveDraft={formActions.handleSaveDraft}
      onSaveSubmit={formActions.handleSaveSubmit}
      sourceReference={sourceReference}
      stockImpactHint="Delivery Note posts fulfillment and should match the warehouse stock being dispatched."
    />
  );
}
