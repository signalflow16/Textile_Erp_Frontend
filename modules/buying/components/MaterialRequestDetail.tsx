"use client";

import { BuyingDocumentDetail } from "@/modules/buying/components/BuyingDocumentDetail";
import { useGetMaterialRequest, useSubmitMaterialRequest } from "@/modules/buying/hooks/useMaterialRequests";
import { buildSourceCreateHref } from "@/modules/buying/utils/sourceRouteHelpers";

export function MaterialRequestDetail({ name }: { name: string }) {
  const query = useGetMaterialRequest(name);
  const submit = useSubmitMaterialRequest();

  return (
    <BuyingDocumentDetail
      title="Material Request"
      routeBase="/buying/material-requests"
      document={(query.data ?? null) as unknown as Record<string, unknown> | null}
      loading={query.isFetching}
      error={query.error}
      onSubmitDraft={submit.submit}
      submitLoading={submit.isLoading}
      nextActions={[
        { label: "Create RFQ", href: buildSourceCreateHref("/buying/rfqs/new", { doctype: "Material Request", name }) },
        { label: "Create Purchase Order", href: buildSourceCreateHref("/buying/purchase-orders/new", { doctype: "Material Request", name }) }
      ]}
      stockImpactNote="Planning document: Material Request does not change stock."
    />
  );
}
