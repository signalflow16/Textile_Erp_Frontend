import { AppShell } from "@/components/app-shell";
import { CompanySetupPageContent } from "@/modules/initial-setup/components/CompanySetupPageContent";

export default function InitialSetupCompanyPage() {
  return (
    <AppShell
      section="Administration"
      title="Company Setup"
      breadcrumb="Administration > Initial Setup > Company"
      subtitle="Configure company details required for ERP master setup."
    >
      <CompanySetupPageContent />
    </AppShell>
  );
}