import { AppShell } from "@/components/app-shell";
import { UnderDevelopmentPage } from "@/components/under-development-page";

export default function StockPage() {
  return (
    <AppShell title="Stock" breadcrumb="Stock">
      <UnderDevelopmentPage />
    </AppShell>
  );
}
