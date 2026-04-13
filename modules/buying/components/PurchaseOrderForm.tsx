"use client";

import { useRouter } from "next/navigation";
import { App } from "antd";

import { BuyingDocumentForm } from "@/modules/buying/components/BuyingDocumentForm";
import { useDocumentSaveSubmit } from "@/modules/buying/hooks/useDocumentSaveSubmit";
import { useGetMaterialRequest } from "@/modules/buying/hooks/useMaterialRequests";
import { useGetSupplierQuotation } from "@/modules/buying/hooks/useSupplierQuotations";
import { useCreatePurchaseOrder, useGetPurchaseOrder, useSubmitPurchaseOrder, useUpdatePurchaseOrder } from "@/modules/buying/hooks/usePurchaseOrders";
import type { MaterialRequestDoc, PurchaseOrderDoc, SupplierQuotationDoc } from "@/modules/buying/types/buying";
import { materialRequestToPurchaseOrder, supplierQuotationToPurchaseOrder } from "@/modules/buying/utils/sourcePrefillMappers";
import type { SourceReference } from "@/modules/buying/utils/sourceRouteHelpers";

export function PurchaseOrderForm({ name, sourceDoctype, sourceName }: { name?: string; sourceDoctype?: string; sourceName?: string }) {
  const { message } = App.useApp();
  const router = useRouter();
  const detail = useGetPurchaseOrder(name);
  const sourceSq = useGetSupplierQuotation(!name && sourceDoctype === "Supplier Quotation" ? sourceName : undefined);
  const sourceMr = useGetMaterialRequest(!name && sourceDoctype === "Material Request" ? sourceName : undefined);
  const create = useCreatePurchaseOrder();
  const update = useUpdatePurchaseOrder();
  const submit = useSubmitPurchaseOrder();
  const sourceSqDoc = sourceSq.data as SupplierQuotationDoc | undefined;
  const sourceMrDoc = sourceMr.data as MaterialRequestDoc | undefined;
  const initialDoc = detail.data as PurchaseOrderDoc | undefined;
  const sourceReference: SourceReference | null =
    !name && sourceDoctype === "Supplier Quotation" && sourceName
      ? { doctype: "Supplier Quotation", name: sourceName }
      : !name && sourceDoctype === "Material Request" && sourceName
        ? { doctype: "Material Request", name: sourceName }
        : null;
  const initialValues = name
    ? (detail.data as unknown as Record<string, unknown>)
    : sourceSqDoc
      ? (supplierQuotationToPurchaseOrder(sourceSqDoc) as unknown as Record<string, unknown>)
      : sourceMrDoc
        ? (materialRequestToPurchaseOrder(sourceMrDoc) as unknown as Record<string, unknown>)
      : undefined;
  const formActions = useDocumentSaveSubmit<Record<string, unknown>, PurchaseOrderDoc, PurchaseOrderDoc>({
    doctype: "Purchase Order",
    initialDocName: name ?? initialDoc?.name,
    initialSubmitted: initialDoc?.docstatus === 1,
    createPayloadMapper: (values) => values as unknown as PurchaseOrderDoc,
    updatePayloadMapper: (values) => values as unknown as PurchaseOrderDoc,
    createDraft: (payload) => create.submit(payload),
    updateDraft: (docName, payload) => update.submit(docName, payload),
    submitDraft: (docName) => submit.submit(docName),
    onSaved: (doc) => {
      message.success("Purchase Order saved as draft.");
      if (!name && doc.name) {
        router.replace(`/buying/purchase-orders/${encodeURIComponent(doc.name)}?edit=1`);
      } else {
        router.refresh();
      }
    },
    onSubmitted: (doc) => {
      message.success("Purchase Order submitted.");
      const finalName = doc.name ?? name;
      if (finalName) {
        router.replace(`/buying/purchase-orders/${encodeURIComponent(finalName)}`);
      } else {
        router.refresh();
      }
    }
  });

  return (
    <BuyingDocumentForm
      title={name ? `Edit Purchase Order ${name}` : "Create Purchase Order"}
      flowHint="Purchase Order means the purchase is confirmed with the supplier."
      kind="purchase-order"
      initialValues={initialValues}
      loading={Boolean(name) ? detail.isFetching : sourceSq.isFetching || sourceMr.isFetching}
      error={detail.error}
      isSavingDraft={formActions.isSaving}
      isSubmittingDoc={formActions.isSubmitting}
      onSaveDraft={formActions.handleSaveDraft}
      onSaveSubmit={formActions.handleSaveSubmit}
      sourceReference={sourceReference}
    />
  );
}
