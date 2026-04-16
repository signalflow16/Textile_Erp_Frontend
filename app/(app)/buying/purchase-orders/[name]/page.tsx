"use client";

import { useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { PurchaseOrderDetail } from "@/modules/buying/components/PurchaseOrderDetail";
import { PurchaseOrderForm } from "@/modules/buying/components/PurchaseOrderForm";
import { useAppShell } from "@/core/context/app-shell-context";

export default function PurchaseOrderDetailPage() {
  const { setConfig } = useAppShell();
  const params = useParams<{ name: string }>();
  const searchParams = useSearchParams();
  const decoded = decodeURIComponent(params.name);
  const editMode = searchParams.get("edit") === "1";

  useEffect(() => {
    setConfig({
      title: editMode ? `Edit Purchase Order ${decoded}` : `Purchase Order ${decoded}`,
      subtitle: "Purchase Order confirms buying commitment."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [decoded, editMode, setConfig]);

  return editMode ? <PurchaseOrderForm name={decoded} /> : <PurchaseOrderDetail name={decoded} />;
}
