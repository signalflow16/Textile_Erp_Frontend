import { AppShell } from "@/components/app-shell";
import { ItemMasterToolbar } from "@/components/stock/item-master-toolbar";
import { ItemTable } from "@/components/stock/item-table";

export default function ItemsPage() {
  return (
    <AppShell
      title="Stock"
      breadcrumb="Stock"
    >
      <div className="page-stack">
        <ItemMasterToolbar />
        <ItemTable />
      </div>
    </AppShell>
  );
}
