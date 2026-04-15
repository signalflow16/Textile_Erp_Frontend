import { AppShell } from "@/components/app-shell";
import { DocumentListPage } from "@/modules/shared/document/components/document-list-page";

export default function PurchaseReceiptListRoute() {
  return (
    <AppShell
      section="Buying"
      title="Purchase Receipts"
      breadcrumb="Buying > Purchase Receipts"
      subtitle="Manage inbound supplier receipts with draft and submit lifecycle controls."
    >
      <DocumentListPage doctype="Purchase Receipt" />
    </AppShell>
  );
}
