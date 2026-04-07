import { AppShell } from "@/components/app-shell";
import { ItemForm } from "@/components/stock/item-form";

export default function NewItemPage() {
  return (
    <AppShell
      title="Create Item"
      breadcrumb="Stock > Item > New"
      subtitle="Create a stock item master with textile attributes, pricing, and barcode definitions."
    >
      <div className="page-stack">
        <ItemForm mode="create" />
      </div>
    </AppShell>
  );
}
