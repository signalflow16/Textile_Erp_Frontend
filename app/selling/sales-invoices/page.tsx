import { AppShell } from "@/components/app-shell";
import { DocumentListPage } from "@/modules/shared/document/components/document-list-page";

export default function SalesInvoiceListRoute() {
  return (
    <AppShell
      section="Selling"
      title="Sales Invoices"
      breadcrumb="Selling > Sales Invoices"
      subtitle="Manage customer billing documents with realtime stock validation."
    >
      <DocumentListPage doctype="Sales Invoice" />
    </AppShell>
  );
}
