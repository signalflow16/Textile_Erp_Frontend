import { AppShell } from "@/components/app-shell";
import { ItemMasterToolbar } from "@/components/stock/item-master-toolbar";
import { ItemTable } from "@/components/stock/item-table";

export default function ItemsPage() {
  return (
    <AppShell
      title="Item Master"
      breadcrumb="Stock > Item"
      subtitle="Manage stock items, templates, and variants from a single operational screen."
      actions={<ItemMasterToolbar />}
    >
      <div className="page-stack">
        <ItemTable />
      </div>
    </AppShell>
  );
}
