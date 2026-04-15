import { AppShell } from "@/components/app-shell";
import { PosClosingEntryPage } from "@/modules/pos/components/PosClosingEntryPage";

export default function PosClosingPage() {
  return (
    <AppShell
      section="Sales"
      title="POS Closing Entry"
      breadcrumb="Sales > POS Closing Entry"
      subtitle="End POS session and verify collected amount."
    >
      <PosClosingEntryPage />
    </AppShell>
  );
}
