"use client";

import { useRouter } from "next/navigation";
import { App } from "antd";

import { BuyingDocumentForm } from "@/modules/buying/components/BuyingDocumentForm";
import { useDocumentSaveSubmit } from "@/modules/buying/hooks/useDocumentSaveSubmit";
import { useGetRfq } from "@/modules/buying/hooks/useRfqs";
import { useCreateSupplierQuotation, useGetSupplierQuotation, useSubmitSupplierQuotation, useUpdateSupplierQuotation } from "@/modules/buying/hooks/useSupplierQuotations";
import type { RequestForQuotationDoc, SupplierQuotationDoc } from "@/modules/buying/types/buying";
import { rfqToSupplierQuotation } from "@/modules/buying/utils/sourcePrefillMappers";
import type { SourceReference } from "@/modules/buying/utils/sourceRouteHelpers";

export function SupplierQuotationForm({ name, sourceDoctype, sourceName }: { name?: string; sourceDoctype?: string; sourceName?: string }) {
  const { message } = App.useApp();
  const router = useRouter();
  const detail = useGetSupplierQuotation(name);
  const sourceRfq = useGetRfq(!name && sourceDoctype === "Request for Quotation" ? sourceName : undefined);
  const create = useCreateSupplierQuotation();
  const update = useUpdateSupplierQuotation();
  const submit = useSubmitSupplierQuotation();
  const sourceDoc = sourceRfq.data as RequestForQuotationDoc | undefined;
  const initialDoc = detail.data as SupplierQuotationDoc | undefined;
  const sourceReference: SourceReference | null =
    !name && sourceDoctype === "Request for Quotation" && sourceName
      ? { doctype: "Request for Quotation", name: sourceName }
      : null;
  const initialValues = name
    ? (detail.data as unknown as Record<string, unknown>)
    : sourceDoc
      ? (rfqToSupplierQuotation(sourceDoc) as unknown as Record<string, unknown>)
      : undefined;
  const formActions = useDocumentSaveSubmit<Record<string, unknown>, SupplierQuotationDoc, SupplierQuotationDoc>({
    doctype: "Supplier Quotation",
    initialDocName: name ?? initialDoc?.name,
    initialSubmitted: initialDoc?.docstatus === 1,
    createPayloadMapper: (values) => values as unknown as SupplierQuotationDoc,
    updatePayloadMapper: (values) => values as unknown as SupplierQuotationDoc,
    createDraft: (payload) => create.submit(payload),
    updateDraft: (docName, payload) => update.submit(docName, payload),
    submitDraft: (docName) => submit.submit(docName),
    onSaved: (doc) => {
      message.success("Supplier Quotation saved as draft.");
      if (!name && doc.name) {
        router.replace(`/buying/supplier-quotations/${encodeURIComponent(doc.name)}?edit=1`);
      } else {
        router.refresh();
      }
    },
    onSubmitted: (doc) => {
      message.success("Supplier Quotation submitted.");
      const finalName = doc.name ?? name;
      if (finalName) {
        router.replace(`/buying/supplier-quotations/${encodeURIComponent(finalName)}`);
      } else {
        router.refresh();
      }
    }
  });

  return (
    <BuyingDocumentForm
      title={name ? `Edit Supplier Quotation ${name}` : "Create Supplier Quotation"}
      flowHint="Supplier Quotation means the supplier's offer. Review rates here before confirming a purchase order."
      kind="supplier-quotation"
      initialValues={initialValues}
      loading={Boolean(name) ? detail.isFetching : sourceRfq.isFetching}
      error={detail.error}
      isSavingDraft={formActions.isSaving}
      isSubmittingDoc={formActions.isSubmitting}
      onSaveDraft={formActions.handleSaveDraft}
      onSaveSubmit={formActions.handleSaveSubmit}
      sourceReference={sourceReference}
    />
  );
}
