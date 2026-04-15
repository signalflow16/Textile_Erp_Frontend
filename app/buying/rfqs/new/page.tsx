import { AppShell } from "@/components/app-shell";
import { RfqForm } from "@/modules/buying/components/RfqForm";

export default async function NewRfqPage({
  searchParams
}: {
  searchParams: Promise<{ source_doctype?: string; source_name?: string }>;
}) {
  const params = await searchParams;
  return (
    <AppShell section="Buying" title="Create RFQ" breadcrumb="Buying > RFQs > New" subtitle="Request quotations from one or multiple suppliers.">
      <RfqForm sourceDoctype={params.source_doctype} sourceName={params.source_name} />
    </AppShell>
  );
}
