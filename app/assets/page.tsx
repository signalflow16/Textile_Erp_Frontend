import { AppShell } from "@/components/app-shell";
import { UnderDevelopmentPage } from "@/components/under-development-page";

export default function AssetsPage() {
  return (
    <AppShell title="Assets" breadcrumb="Assets">
      <UnderDevelopmentPage />
    </AppShell>
  );
}
