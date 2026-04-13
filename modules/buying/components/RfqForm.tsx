"use client";

import { useRouter } from "next/navigation";
import { App } from "antd";

import { BuyingDocumentForm } from "@/modules/buying/components/BuyingDocumentForm";
import { useDocumentSaveSubmit } from "@/modules/buying/hooks/useDocumentSaveSubmit";
import { useGetMaterialRequest } from "@/modules/buying/hooks/useMaterialRequests";
import { useCreateRfq, useGetRfq, useSubmitRfq, useUpdateRfq } from "@/modules/buying/hooks/useRfqs";
import type { MaterialRequestDoc, RequestForQuotationDoc } from "@/modules/buying/types/buying";
import { materialRequestToRfq } from "@/modules/buying/utils/sourcePrefillMappers";
import type { SourceReference } from "@/modules/buying/utils/sourceRouteHelpers";

export function RfqForm({ name, sourceDoctype, sourceName }: { name?: string; sourceDoctype?: string; sourceName?: string }) {
  const { message } = App.useApp();
  const router = useRouter();
  const detail = useGetRfq(name);
  const sourceMaterialRequest = useGetMaterialRequest(!name && sourceDoctype === "Material Request" ? sourceName : undefined);
  const create = useCreateRfq();
  const update = useUpdateRfq();
  const submit = useSubmitRfq();
  const sourceDoc = sourceMaterialRequest.data as MaterialRequestDoc | undefined;
  const initialDoc = detail.data as RequestForQuotationDoc | undefined;
  const sourceReference: SourceReference | null =
    !name && sourceDoctype === "Material Request" && sourceName
      ? { doctype: "Material Request", name: sourceName }
      : null;
  const initialValues = name
    ? (detail.data as unknown as Record<string, unknown>)
    : sourceDoc
      ? (materialRequestToRfq(sourceDoc) as unknown as Record<string, unknown>)
      : undefined;
  const formActions = useDocumentSaveSubmit<Record<string, unknown>, RequestForQuotationDoc, RequestForQuotationDoc>({
    doctype: "Request for Quotation",
    initialDocName: name ?? initialDoc?.name,
    initialSubmitted: initialDoc?.docstatus === 1,
    createPayloadMapper: (values) => values as unknown as RequestForQuotationDoc,
    updatePayloadMapper: (values) => values as unknown as RequestForQuotationDoc,
    createDraft: (payload) => create.submit(payload),
    updateDraft: (docName, payload) => update.submit(docName, payload),
    submitDraft: (docName) => submit.submit(docName),
    onSaved: (doc) => {
      message.success("RFQ saved as draft.");
      if (!name && doc.name) {
        router.replace(`/buying/rfqs/${encodeURIComponent(doc.name)}?edit=1`);
      } else {
        router.refresh();
      }
    },
    onSubmitted: (doc) => {
      message.success("RFQ submitted.");
      const finalName = doc.name ?? name;
      if (finalName) {
        router.replace(`/buying/rfqs/${encodeURIComponent(finalName)}`);
      } else {
        router.refresh();
      }
    }
  });

  return (
    <BuyingDocumentForm
      title={name ? `Edit RFQ ${name}` : "Create RFQ"}
      flowHint="RFQ means asking suppliers for prices. Use it when you want to compare offers before ordering."
      kind="rfq"
      initialValues={initialValues}
      loading={Boolean(name) ? detail.isFetching : sourceMaterialRequest.isFetching}
      error={detail.error}
      isSavingDraft={formActions.isSaving}
      isSubmittingDoc={formActions.isSubmitting}
      onSaveDraft={formActions.handleSaveDraft}
      onSaveSubmit={formActions.handleSaveSubmit}
      sourceReference={sourceReference}
    />
  );
}
