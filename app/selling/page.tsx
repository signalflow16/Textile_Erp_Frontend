import { AppShell } from "@/components/app-shell";
import { DocumentListPage } from "@/modules/shared/document/components/document-list-page";

export default function SellingPage() {
  return (
    <AppShell
      section="Selling"
      title="Sales Invoices"
      breadcrumb="Selling > Sales Invoices"
      subtitle="Create customer invoices with pricing defaults, stock validation, and document lifecycle controls."
    >
      <DocumentListPage doctype="Sales Invoice" />
    </AppShell>
  );
}
