import { AppShell } from "@/components/app-shell";
import { DocumentEditorPage } from "@/modules/shared/document/components/document-editor-page";

export default async function SalesInvoiceDetailRoute({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;

  return (
    <AppShell
      section="Selling"
      title="Sales Invoice"
      breadcrumb="Selling > Sales Invoices > Detail"
      subtitle="Review submitted invoices or continue draft edits."
    >
      <DocumentEditorPage doctype="Sales Invoice" name={name} />
    </AppShell>
  );
}
