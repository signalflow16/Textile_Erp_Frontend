import { AppShell } from "@/components/app-shell";
import { ItemGroupWorkspace } from "@/components/stock/item-group-workspace";

export default function ItemGroupsPage() {
  return (
    <AppShell
      title="Item Group"
      breadcrumb="Stock > Item Group"
      subtitle="Manage stock hierarchy, browse dependencies, and keep item categorization clean."
    >
      <ItemGroupWorkspace />
    </AppShell>
  );
}
