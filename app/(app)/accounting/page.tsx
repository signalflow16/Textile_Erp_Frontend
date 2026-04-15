import { AppShell } from "@/components/app-shell";
import { UnderDevelopmentPage } from "@/components/under-development-page";

export default function AccountingPage() {
  return (
    <AppShell title="Accounting" breadcrumb="Accounting">
      <UnderDevelopmentPage />
    </AppShell>
  );
}
