import { AppShell } from "@/components/app-shell";
import { UnderDevelopmentPage } from "@/components/under-development-page";

export default function UsersPage() {
  return (
    <AppShell title="Users" breadcrumb="Users">
      <UnderDevelopmentPage />
    </AppShell>
  );
}
