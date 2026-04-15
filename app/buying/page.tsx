import { AppShell } from "@/components/app-shell";
import { BuyingDashboard } from "@/modules/buying/components/BuyingDashboard";

export default function BuyingDashboardPage() {
  return (
    <AppShell
      section="Buying"
      title="Buying Dashboard"
      breadcrumb="Buying > Dashboard"
      subtitle="Track textile procurement from demand planning through ordering, receipt, and supplier billing."
    >
      <BuyingDashboard />
    </AppShell>
  );
}
