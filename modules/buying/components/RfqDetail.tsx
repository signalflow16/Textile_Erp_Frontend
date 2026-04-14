"use client";

import { BuyingDocumentDetail } from "@/modules/buying/components/BuyingDocumentDetail";
import { useGetRfq, useSubmitRfq } from "@/modules/buying/hooks/useRfqs";
import { buildSourceCreateHref } from "@/modules/buying/utils/sourceRouteHelpers";

export function RfqDetail({ name }: { name: string }) {
  const query = useGetRfq(name);
  const submit = useSubmitRfq();

  return (
    <BuyingDocumentDetail
      title="Request for Quotation"
      routeBase="/buying/rfqs"
      document={(query.data ?? null) as unknown as Record<string, unknown> | null}
      loading={query.isFetching}
      error={query.error}
      onSubmitDraft={submit.submit}
      submitLoading={submit.isLoading}
      nextActions={[
        { label: "Create Supplier Quotation", href: buildSourceCreateHref("/buying/supplier-quotations/new", { doctype: "Request for Quotation", name }) }
      ]}
      stockImpactNote="Quotation document: RFQ does not change stock."
    />
  );
}
