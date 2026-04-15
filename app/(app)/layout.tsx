import { AppShell } from "@/components/app-shell";
import { AppShellProvider } from "@/core/context/app-shell-context";

export default function AppLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShellProvider>
      <AppShell>{children}</AppShell>
    </AppShellProvider>
  );
}