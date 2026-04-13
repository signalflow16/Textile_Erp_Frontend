import { AppShell } from "@/components/app-shell";
import { MaterialRequestList } from "@/modules/buying/components/MaterialRequestList";

export default function MaterialRequestsPage() {
  return (
    <AppShell section="Buying" title="Material Requests" breadcrumb="Buying > Material Requests" subtitle="Plan purchase demand for textile stock replenishment.">
      <MaterialRequestList />
    </AppShell>
  );
}
