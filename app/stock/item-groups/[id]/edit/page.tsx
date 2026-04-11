import { AppShell } from "@/components/app-shell";
import { ItemGroupEditor } from "@/components/stock/item-groups/editor";

export default async function EditItemGroupPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const routeParams = await params;
  const itemGroupName = decodeURIComponent(routeParams.id);

  return (
    <AppShell
      title={itemGroupName}
      breadcrumb={`Stock > Item Groups > ${itemGroupName}`}
      subtitle="Review item group information, update hierarchy settings, and add children from the document page."
    >
      <ItemGroupEditor mode="edit" itemGroupName={itemGroupName} />
    </AppShell>
  );
}
