import { AppShell } from "@/components/app-shell";
import { MaterialRequestForm } from "@/modules/buying/components/MaterialRequestForm";

export default function NewMaterialRequestPage() {
  return (
    <AppShell section="Buying" title="Create Material Request" breadcrumb="Buying > Material Requests > New" subtitle="Capture demand before vendor procurement.">
      <MaterialRequestForm />
    </AppShell>
  );
}
