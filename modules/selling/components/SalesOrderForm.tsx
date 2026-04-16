"use client";

import { useRouter } from "next/navigation";
import { App } from "antd";

import { SellingDocumentForm } from "@/modules/selling/components/SellingDocumentForm";
import { useDocumentSaveSubmit } from "@/modules/selling/hooks/useDocumentSaveSubmit";
import { useCreateSalesOrder, useGetSalesOrder, useSubmitSalesOrder, useUpdateSalesOrder } from "@/modules/selling/hooks/useSalesOrders";
import { useGetQuotation } from "@/modules/selling/hooks/useQuotations";
import type { QuotationDoc, SalesOrderDoc } from "@/modules/selling/types/selling";
import { quotationToSalesOrder } from "@/modules/selling/utils/sourcePrefillMappers";
import type { SourceReference } from "@/modules/selling/utils/sourceRouteHelpers";

export function SalesOrderForm({ name, sourceDoctype, sourceName }: { name?: string; sourceDoctype?: string; sourceName?: string }) {
  const { message } = App.useApp();
  const router = useRouter();
  const detail = useGetSalesOrder(name);
  const sourceQuotation = useGetQuotation(!name && sourceDoctype === "Quotation" ? sourceName : undefined);
  const create = useCreateSalesOrder();
  const update = useUpdateSalesOrder();
  const submit = useSubmitSalesOrder();
  const sourceDoc = sourceQuotation.data as QuotationDoc | undefined;
  const initialDoc = detail.data as SalesOrderDoc | undefined;
  const sourceReference: SourceReference | null =
    !name && sourceDoctype === "Quotation" && sourceName ? { doctype: "Quotation", name: sourceName } : null;
  const initialValues = name
    ? (detail.data as unknown as Record<string, unknown>)
    : sourceDoc
      ? (quotationToSalesOrder(sourceDoc) as unknown as Record<string, unknown>)
      : undefined;

  const formActions = useDocumentSaveSubmit<Record<string, unknown>, SalesOrderDoc, SalesOrderDoc>({
    doctype: "Sales Order",
    initialDocName: name ?? initialDoc?.name,
    initialSubmitted: initialDoc?.docstatus === 1,
    createPayloadMapper: (values) => values as unknown as SalesOrderDoc,
    updatePayloadMapper: (values) => values as unknown as SalesOrderDoc,
    createDraft: (payload) => create.submit(payload),
    updateDraft: (docName, payload) => update.submit(docName, payload),
    submitDraft: (docName) => submit.submit(docName),
    onSaved: (doc) => {
      message.success("Sales Order saved as draft.");
      if (!name && doc.name) {
        router.replace(`/selling/sales-orders/${encodeURIComponent(doc.name)}?edit=1`);
      } else {
        router.refresh();
      }
    },
    onSubmitted: (doc) => {
      message.success("Sales Order submitted.");
      const finalName = doc.name ?? name;
      if (finalName) {
        router.replace(`/selling/sales-orders/${encodeURIComponent(finalName)}`);
      } else {
        router.refresh();
      }
    }
  });

  return (
    <SellingDocumentForm
      title={name ? `Edit Sales Order ${name}` : "Create Sales Order"}
      flowHint="Sales Order confirms customer acceptance before fulfillment."
      kind="sales-order"
      initialValues={initialValues}
      loading={Boolean(name) ? detail.isFetching : sourceQuotation.isFetching}
      error={detail.error}
      isSavingDraft={formActions.isSaving}
      isSubmittingDoc={formActions.isSubmitting}
      onSaveDraft={formActions.handleSaveDraft}
      onSaveSubmit={formActions.handleSaveSubmit}
      sourceReference={sourceReference}
      stockImpactHint="Sales Order reserves the commercial commitment but does not post stock-out."
    />
  );
}
