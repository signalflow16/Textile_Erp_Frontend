import { AppShell } from "@/components/app-shell";
import { DocumentEditorPage } from "@/components/documents/document-editor-page";

export default async function PurchaseReceiptDetailRoute({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;

  return (
    <AppShell
      section="Buying"
      title="Purchase Receipt"
      breadcrumb="Buying > Purchase Receipts > Detail"
      subtitle="Review or continue a purchase receipt draft."
    >
      <DocumentEditorPage doctype="Purchase Receipt" name={name} />
    </AppShell>
  );
}
