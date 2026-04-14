import { AppShell } from "@/components/app-shell";
import { DocumentListPage } from "@/components/documents/document-list-page";

export default function BuyingDashboardPage() {
  return (
    <AppShell
      section="Buying"
      title="Purchase Receipts"
      breadcrumb="Buying > Purchase Receipts"
      subtitle="Receive supplier stock into warehouses with draft, submit, and cancel lifecycle support."
    >
      <DocumentListPage doctype="Purchase Receipt" />
    </AppShell>
  );
}
