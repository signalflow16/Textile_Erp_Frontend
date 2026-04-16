"use client";

import { useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";

import { useAppShell } from "@/core/context/app-shell-context";
import { SalesOrderDetail } from "@/modules/selling/components/SalesOrderDetail";
import { SalesOrderForm } from "@/modules/selling/components/SalesOrderForm";

export default function SalesOrderDetailPage() {
  const { setConfig } = useAppShell();
  const params = useParams<{ name: string }>();
  const searchParams = useSearchParams();
  const decoded = decodeURIComponent(params.name);
  const editMode = searchParams.get("edit") === "1";

  useEffect(() => {
    setConfig({
      title: editMode ? `Edit Sales Order ${decoded}` : `Sales Order ${decoded}`,
      subtitle: "Sales Order is the confirmed stage before delivery."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [decoded, editMode, setConfig]);

  return editMode ? <SalesOrderForm name={decoded} /> : <SalesOrderDetail name={decoded} />;
}
