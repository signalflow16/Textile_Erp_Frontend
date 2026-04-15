import { AppShell } from "@/components/app-shell";
import { DocumentEditorPage } from "@/modules/shared/document/components/document-editor-page";

export default function PurchaseReceiptCreateRoute() {
  return (
    <AppShell
      section="Buying"
      title="New Purchase Receipt"
      breadcrumb="Buying > Purchase Receipts > Create"
      subtitle="Capture incoming stock from suppliers using the generic document engine."
    >
      <DocumentEditorPage doctype="Purchase Receipt" name="__draft__purchase-receipt" />
    </AppShell>
  );
}
