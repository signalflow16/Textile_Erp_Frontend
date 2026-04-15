import { AppShell } from "@/components/app-shell";
import { RfqDetail } from "@/modules/buying/components/RfqDetail";
import { RfqForm } from "@/modules/buying/components/RfqForm";

export default async function RfqDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { name } = await params;
  const query = await searchParams;
  const decoded = decodeURIComponent(name);
  const editMode = query.edit === "1";

  return (
    <AppShell
      section="Buying"
      title={editMode ? `Edit RFQ ${decoded}` : `RFQ ${decoded}`}
      breadcrumb={`Buying > RFQs > ${decoded}`}
      subtitle="RFQ is optional and used for supplier comparison."
    >
      {editMode ? <RfqForm name={decoded} /> : <RfqDetail name={decoded} />}
    </AppShell>
  );
}
