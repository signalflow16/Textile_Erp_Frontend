import { AppShell } from "@/components/app-shell";
import { PosModulePage } from "@/modules/pos/components/PosModulePage";

export default function PosPage() {
  return (
    <AppShell
      section="Sales"
      title="POS Billing"
      breadcrumb="Sales > POS Billing"
      subtitle="Create bill quickly for walk-in or registered customers."
    >
      <PosModulePage />
    </AppShell>
  );
}
