"use client";

import { useRouter } from "next/navigation";
import { App } from "antd";

import { BuyingDocumentForm } from "@/modules/buying/components/BuyingDocumentForm";
import { useDocumentSaveSubmit } from "@/modules/buying/hooks/useDocumentSaveSubmit";
import { useGetPurchaseOrder } from "@/modules/buying/hooks/usePurchaseOrders";
import { useCreatePurchaseReceipt, useGetPurchaseReceipt, useSubmitPurchaseReceipt, useUpdatePurchaseReceipt } from "@/modules/buying/hooks/usePurchaseReceipts";
import type { PurchaseOrderDoc, PurchaseReceiptDoc } from "@/modules/buying/types/buying";
import { purchaseOrderToPurchaseReceipt } from "@/modules/buying/utils/sourcePrefillMappers";
import type { SourceReference } from "@/modules/buying/utils/sourceRouteHelpers";

export function PurchaseReceiptForm({ name, sourceDoctype, sourceName }: { name?: string; sourceDoctype?: string; sourceName?: string }) {
  const { message } = App.useApp();
  const router = useRouter();
  const detail = useGetPurchaseReceipt(name);
  const sourcePo = useGetPurchaseOrder(!name && sourceDoctype === "Purchase Order" ? sourceName : undefined);
  const create = useCreatePurchaseReceipt();
  const update = useUpdatePurchaseReceipt();
  const submit = useSubmitPurchaseReceipt();
  const sourceDoc = sourcePo.data as PurchaseOrderDoc | undefined;
  const initialDoc = detail.data as PurchaseReceiptDoc | undefined;
  const sourceReference: SourceReference | null =
    !name && sourceDoctype === "Purchase Order" && sourceName
      ? { doctype: "Purchase Order", name: sourceName }
      : null;
  const initialValues = name
    ? (detail.data as unknown as Record<string, unknown>)
    : sourceDoc
      ? (purchaseOrderToPurchaseReceipt(sourceDoc) as unknown as Record<string, unknown>)
      : undefined;
  const formActions = useDocumentSaveSubmit<Record<string, unknown>, PurchaseReceiptDoc, PurchaseReceiptDoc>({
    doctype: "Purchase Receipt",
    initialDocName: name ?? initialDoc?.name,
    initialSubmitted: initialDoc?.docstatus === 1,
    createPayloadMapper: (values) => values as unknown as PurchaseReceiptDoc,
    updatePayloadMapper: (values) => values as unknown as PurchaseReceiptDoc,
    createDraft: (payload) => create.submit(payload),
    updateDraft: (docName, payload) => update.submit(docName, payload),
    submitDraft: (docName) => submit.submit(docName),
    onSaved: (doc) => {
      message.success("Purchase Receipt saved as draft.");
      if (!name && doc.name) {
        router.replace(`/buying/purchase-receipts/${encodeURIComponent(doc.name)}?edit=1`);
      } else {
        router.refresh();
      }
    },
    onSubmitted: (doc) => {
      message.success("Purchase Receipt submitted.");
      const finalName = doc.name ?? name;
      if (finalName) {
        router.replace(`/buying/purchase-receipts/${encodeURIComponent(finalName)}`);
      } else {
        router.refresh();
      }
    }
  });

  return (
    <BuyingDocumentForm
      title={name ? `Edit Purchase Receipt ${name}` : "Create Purchase Receipt"}
      flowHint="Purchase Receipt means goods are received into stock."
      kind="purchase-receipt"
      initialValues={initialValues}
      loading={Boolean(name) ? detail.isFetching : sourcePo.isFetching}
      error={detail.error}
      isSavingDraft={formActions.isSaving}
      isSubmittingDoc={formActions.isSubmitting}
      onSaveDraft={formActions.handleSaveDraft}
      onSaveSubmit={formActions.handleSaveSubmit}
      sourceReference={sourceReference}
      stockImpactHint="Stock impact: Purchase Receipt updates item stock balances."
    />
  );
}
