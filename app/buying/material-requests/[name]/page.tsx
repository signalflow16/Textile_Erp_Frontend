import { AppShell } from "@/components/app-shell";
import { MaterialRequestDetail } from "@/modules/buying/components/MaterialRequestDetail";
import { MaterialRequestForm } from "@/modules/buying/components/MaterialRequestForm";

export default async function MaterialRequestDetailPage({
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
      title={editMode ? `Edit Material Request ${decoded}` : `Material Request ${decoded}`}
      breadcrumb={`Buying > Material Requests > ${decoded}`}
      subtitle="Material Request is planning-stage procurement demand."
    >
      {editMode ? <MaterialRequestForm name={decoded} /> : <MaterialRequestDetail name={decoded} />}
    </AppShell>
  );
}
