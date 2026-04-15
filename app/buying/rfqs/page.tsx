import { AppShell } from "@/components/app-shell";
import { RfqList } from "@/modules/buying/components/RfqList";

export default function RfqsPage() {
  return (
    <AppShell section="Buying" title="Request for Quotations" breadcrumb="Buying > RFQs" subtitle="Collect supplier quotations for demand items.">
      <RfqList />
    </AppShell>
  );
}
