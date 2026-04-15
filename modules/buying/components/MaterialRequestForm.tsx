"use client";

import { useRouter } from "next/navigation";
import { App } from "antd";

import { BuyingDocumentForm } from "@/modules/buying/components/BuyingDocumentForm";
import { useDocumentSaveSubmit } from "@/modules/buying/hooks/useDocumentSaveSubmit";
import { useCreateMaterialRequest, useGetMaterialRequest, useUpdateMaterialRequest } from "@/modules/buying/hooks/useMaterialRequests";
import type { MaterialRequestDoc } from "@/modules/buying/types/buying";
import { useSubmitMaterialRequest } from "@/modules/buying/hooks/useMaterialRequests";

export function MaterialRequestForm({ name }: { name?: string }) {
  const { message } = App.useApp();
  const router = useRouter();
  const detail = useGetMaterialRequest(name);
  const create = useCreateMaterialRequest();
  const update = useUpdateMaterialRequest();
  const submit = useSubmitMaterialRequest();
  const initialDoc = detail.data as MaterialRequestDoc | undefined;
  const formActions = useDocumentSaveSubmit<Record<string, unknown>, MaterialRequestDoc, MaterialRequestDoc>({
    doctype: "Material Request",
    initialDocName: name ?? initialDoc?.name,
    initialSubmitted: initialDoc?.docstatus === 1,
    createPayloadMapper: (values) => values as unknown as MaterialRequestDoc,
    updatePayloadMapper: (values) => values as unknown as MaterialRequestDoc,
    createDraft: (payload) => create.submit(payload),
    updateDraft: (docName, payload) => update.submit(docName, payload),
    submitDraft: (docName) => submit.submit(docName),
    onSaved: (doc) => {
      message.success("Material Request saved as draft.");
      if (!name && doc.name) {
        router.replace(`/buying/material-requests/${encodeURIComponent(doc.name)}?edit=1`);
      } else {
        router.refresh();
      }
    },
    onSubmitted: (doc) => {
      message.success("Material Request submitted.");
      const finalName = doc.name ?? name;
      if (finalName) {
        router.replace(`/buying/material-requests/${encodeURIComponent(finalName)}`);
      } else {
        router.refresh();
      }
    }
  });

  return (
    <BuyingDocumentForm
      title={name ? `Edit Material Request ${name}` : "Create Material Request"}
      flowHint="Material Request means what we need to buy. It is only for planning and does not increase stock."
      kind="material-request"
      initialValues={detail.data as unknown as Record<string, unknown>}
      loading={Boolean(name) && detail.isFetching}
      error={detail.error}
      isSavingDraft={formActions.isSaving}
      isSubmittingDoc={formActions.isSubmitting}
      onSaveDraft={formActions.handleSaveDraft}
      onSaveSubmit={formActions.handleSaveSubmit}
    />
  );
}
