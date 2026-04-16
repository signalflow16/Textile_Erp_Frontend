"use client";

import { useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { PurchaseInvoiceDetail } from "@/modules/buying/components/PurchaseInvoiceDetail";
import { PurchaseInvoiceForm } from "@/modules/buying/components/PurchaseInvoiceForm";
import { useAppShell } from "@/core/context/app-shell-context";

export default function PurchaseInvoiceDetailPage() {
  const { setConfig } = useAppShell();
  const params = useParams<{ name: string }>();
  const searchParams = useSearchParams();
  const decoded = decodeURIComponent(params.name);
  const editMode = searchParams.get("edit") === "1";

  useEffect(() => {
    setConfig({
      title: editMode ? `Edit Purchase Invoice ${decoded}` : `Purchase Invoice ${decoded}`,
      subtitle: "Purchase Invoice affects supplier liability and finance books."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [decoded, editMode, setConfig]);

  return editMode ? <PurchaseInvoiceForm name={decoded} /> : <PurchaseInvoiceDetail name={decoded} />;
}
