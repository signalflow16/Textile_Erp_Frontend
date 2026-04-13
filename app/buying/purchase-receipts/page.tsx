import { AppShell } from "@/components/app-shell";
import { PurchaseReceiptList } from "@/modules/buying/components/PurchaseReceiptList";

export default function PurchaseReceiptsPage() {
  return (
    <AppShell section="Buying" title="Purchase Receipts" breadcrumb="Buying > Purchase Receipts" subtitle="Record stock received from suppliers.">
      <PurchaseReceiptList />
    </AppShell>
  );
}
