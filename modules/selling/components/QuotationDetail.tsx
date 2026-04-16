"use client";

import { SellingDocumentDetail } from "@/modules/selling/components/SellingDocumentDetail";
import { useCancelQuotation, useGetQuotation, useSubmitQuotation } from "@/modules/selling/hooks/useQuotations";
import { buildSourceCreateHref } from "@/modules/selling/utils/sourceRouteHelpers";

export function QuotationDetail({ name }: { name: string }) {
  const query = useGetQuotation(name);
  const submit = useSubmitQuotation();
  const cancel = useCancelQuotation();

  return (
    <SellingDocumentDetail
      title="Quotation"
      routeBase="/selling/quotations"
      document={(query.data ?? null) as unknown as Record<string, unknown> | null}
      loading={query.isFetching}
      error={query.error}
      onSubmitDraft={submit.submit}
      onCancelSubmitted={cancel.submit}
      submitLoading={submit.isLoading}
      cancelLoading={cancel.isLoading}
      nextActions={[
        { label: "Create Sales Order", href: buildSourceCreateHref("/selling/sales-orders/new", { doctype: "Quotation", name }) }
      ]}
    />
  );
}
