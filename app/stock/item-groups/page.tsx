import { AppShell } from "@/components/app-shell";
import { ItemGroupWorkspace } from "@/components/stock/item-groups/workspace";

export default async function ItemGroupsPage({
  searchParams
}: {
  searchParams: Promise<{ selected?: string }>;
}) {
  const params = await searchParams;

  return (
    <AppShell
      title="Item Groups"
      breadcrumb="Stock > Item Groups"
      subtitle="Tree-based item group management with inline actions and page-based create/edit flows."
    >
      <ItemGroupWorkspace selectedGroup={params.selected ? decodeURIComponent(params.selected) : undefined} />
    </AppShell>
  );
}
