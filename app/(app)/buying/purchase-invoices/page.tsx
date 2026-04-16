"use client";

import { useEffect } from "react";
import { PurchaseInvoiceList } from "@/modules/buying/components/PurchaseInvoiceList";
import { useAppShell } from "@/core/context/app-shell-context";

export default function PurchaseInvoicesPage() {
  const { setConfig } = useAppShell();

  useEffect(() => {
    setConfig({
      title: "Purchase Invoices",
      subtitle: "Track supplier bills and payable liabilities."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig]);

  return <PurchaseInvoiceList />;
}
