"use client";

import { useRouter } from "next/navigation";
import { App } from "antd";

import { SellingDocumentForm } from "@/modules/selling/components/SellingDocumentForm";
import { useDocumentSaveSubmit } from "@/modules/selling/hooks/useDocumentSaveSubmit";
import { useCreateQuotation, useGetQuotation, useSubmitQuotation, useUpdateQuotation } from "@/modules/selling/hooks/useQuotations";
import type { QuotationDoc } from "@/modules/selling/types/selling";

export function QuotationForm({ name }: { name?: string }) {
  const { message } = App.useApp();
  const router = useRouter();
  const detail = useGetQuotation(name);
  const create = useCreateQuotation();
  const update = useUpdateQuotation();
  const submit = useSubmitQuotation();
  const initialDoc = detail.data as QuotationDoc | undefined;
  const formActions = useDocumentSaveSubmit<Record<string, unknown>, QuotationDoc, QuotationDoc>({
    doctype: "Quotation",
    initialDocName: name ?? initialDoc?.name,
    initialSubmitted: initialDoc?.docstatus === 1,
    createPayloadMapper: (values) => values as unknown as QuotationDoc,
    updatePayloadMapper: (values) => values as unknown as QuotationDoc,
    createDraft: (payload) => create.submit(payload),
    updateDraft: (docName, payload) => update.submit(docName, payload),
    submitDraft: (docName) => submit.submit(docName),
    onSaved: (doc) => {
      message.success("Quotation saved as draft.");
      if (!name && doc.name) {
        router.replace(`/selling/quotations/${encodeURIComponent(doc.name)}?edit=1`);
      } else {
        router.refresh();
      }
    },
    onSubmitted: (doc) => {
      message.success("Quotation submitted.");
      const finalName = doc.name ?? name;
      if (finalName) {
        router.replace(`/selling/quotations/${encodeURIComponent(finalName)}`);
      } else {
        router.refresh();
      }
    }
  });

  return (
    <SellingDocumentForm
      title={name ? `Edit Quotation ${name}` : "Create Quotation"}
      flowHint="Quotation is the proposal stage in the ERPNext selling workflow."
      kind="quotation"
      initialValues={detail.data as unknown as Record<string, unknown>}
      loading={detail.isFetching}
      error={detail.error}
      isSavingDraft={formActions.isSaving}
      isSubmittingDoc={formActions.isSubmitting}
      onSaveDraft={formActions.handleSaveDraft}
      onSaveSubmit={formActions.handleSaveSubmit}
    />
  );
}
