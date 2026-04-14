"use client";

import { useRouter } from "next/navigation";
import { App } from "antd";

import { BuyingDocumentForm } from "@/modules/buying/components/BuyingDocumentForm";
import { useDocumentSaveSubmit } from "@/modules/buying/hooks/useDocumentSaveSubmit";
import { useGetPurchaseOrder } from "@/modules/buying/hooks/usePurchaseOrders";
import { useGetPurchaseReceipt } from "@/modules/buying/hooks/usePurchaseReceipts";
import { useCreatePurchaseInvoice, useGetPurchaseInvoice, useSubmitPurchaseInvoice, useUpdatePurchaseInvoice } from "@/modules/buying/hooks/usePurchaseInvoices";
import type { PurchaseInvoiceDoc, PurchaseOrderDoc, PurchaseReceiptDoc } from "@/modules/buying/types/buying";
import { purchaseOrderToPurchaseInvoice, purchaseReceiptToPurchaseInvoice } from "@/modules/buying/utils/sourcePrefillMappers";
import type { SourceReference } from "@/modules/buying/utils/sourceRouteHelpers";

export function PurchaseInvoiceForm({ name, sourceDoctype, sourceName }: { name?: string; sourceDoctype?: string; sourceName?: string }) {
  const { message } = App.useApp();
  const router = useRouter();
  const detail = useGetPurchaseInvoice(name);
  const sourcePr = useGetPurchaseReceipt(!name && sourceDoctype === "Purchase Receipt" ? sourceName : undefined);
  const sourcePo = useGetPurchaseOrder(!name && sourceDoctype === "Purchase Order" ? sourceName : undefined);
  const create = useCreatePurchaseInvoice();
  const update = useUpdatePurchaseInvoice();
  const submit = useSubmitPurchaseInvoice();
  const sourcePrDoc = sourcePr.data as PurchaseReceiptDoc | undefined;
  const sourcePoDoc = sourcePo.data as PurchaseOrderDoc | undefined;
  const initialDoc = detail.data as PurchaseInvoiceDoc | undefined;
  const sourceReference: SourceReference | null =
    !name && sourceDoctype === "Purchase Receipt" && sourceName
      ? { doctype: "Purchase Receipt", name: sourceName }
      : !name && sourceDoctype === "Purchase Order" && sourceName
        ? { doctype: "Purchase Order", name: sourceName }
        : null;
  const initialValues = name
    ? (detail.data as unknown as Record<string, unknown>)
    : sourcePrDoc
      ? (purchaseReceiptToPurchaseInvoice(sourcePrDoc) as unknown as Record<string, unknown>)
      : sourcePoDoc
        ? (purchaseOrderToPurchaseInvoice(sourcePoDoc) as unknown as Record<string, unknown>)
      : undefined;
  const formActions = useDocumentSaveSubmit<Record<string, unknown>, PurchaseInvoiceDoc, PurchaseInvoiceDoc>({
    doctype: "Purchase Invoice",
    initialDocName: name ?? initialDoc?.name,
    initialSubmitted: initialDoc?.docstatus === 1,
    createPayloadMapper: (values) => values as unknown as PurchaseInvoiceDoc,
    updatePayloadMapper: (values) => values as unknown as PurchaseInvoiceDoc,
    createDraft: (payload) => create.submit(payload),
    updateDraft: (docName, payload) => update.submit(docName, payload),
    submitDraft: (docName) => submit.submit(docName),
    onSaved: (doc) => {
      message.success("Purchase Invoice saved as draft.");
      if (!name && doc.name) {
        router.replace(`/buying/purchase-invoices/${encodeURIComponent(doc.name)}?edit=1`);
      } else {
        router.refresh();
      }
    },
    onSubmitted: (doc) => {
      message.success("Purchase Invoice submitted.");
      const finalName = doc.name ?? name;
      if (finalName) {
        router.replace(`/buying/purchase-invoices/${encodeURIComponent(finalName)}`);
      } else {
        router.refresh();
      }
    }
  });

  return (
    <BuyingDocumentForm
      title={name ? `Edit Purchase Invoice ${name}` : "Create Purchase Invoice"}
      flowHint="Purchase Invoice means the supplier bill and payable amount."
      kind="purchase-invoice"
      initialValues={initialValues}
      loading={Boolean(name) ? detail.isFetching : sourcePr.isFetching || sourcePo.isFetching}
      error={detail.error}
      isSavingDraft={formActions.isSaving}
      isSubmittingDoc={formActions.isSubmitting}
      onSaveDraft={formActions.handleSaveDraft}
      onSaveSubmit={formActions.handleSaveSubmit}
      sourceReference={sourceReference}
      financeImpactHint="Finance impact: Purchase Invoice updates supplier payable ledger."
    />
  );
}
