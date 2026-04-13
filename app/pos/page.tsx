import { AppShell } from "@/components/app-shell";
import { PosBillingPage } from "@/modules/pos/components/PosBillingPage";

export default function PosPage() {
  return (
    <AppShell
      section="Sales"
      title="POS Billing"
      breadcrumb="Sales > POS Billing"
      subtitle="Create bill quickly for walk-in or registered customers."
    >
      <PosBillingPage />
    </AppShell>
  );
}
