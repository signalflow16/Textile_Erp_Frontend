import { AppShell } from "@/components/app-shell";
import { PosOpeningEntryPage } from "@/modules/pos/components/PosOpeningEntryPage";

export default function PosOpeningPage() {
  return (
    <AppShell
      section="Sales"
      title="POS Opening Entry"
      breadcrumb="Sales > POS Opening Entry"
      subtitle="Start POS session before billing."
    >
      <PosOpeningEntryPage />
    </AppShell>
  );
}
