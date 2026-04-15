import { AppShell } from "@/components/app-shell";
import { DocumentEditorPage } from "@/modules/shared/document/components/document-editor-page";

export default function SalesInvoiceCreateRoute() {
  return (
    <AppShell
      section="Selling"
      title="New Sales Invoice"
      breadcrumb="Selling > Sales Invoices > Create"
      subtitle="Create sales invoices with pricing defaults and live stock checks."
    >
      <DocumentEditorPage doctype="Sales Invoice" name="__draft__sales-invoice" />
    </AppShell>
  );
}
