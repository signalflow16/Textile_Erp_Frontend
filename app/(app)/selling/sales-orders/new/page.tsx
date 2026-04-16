"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { useAppShell } from "@/core/context/app-shell-context";
import { SalesOrderForm } from "@/modules/selling/components/SalesOrderForm";

export default function NewSalesOrderPage() {
  const { setConfig } = useAppShell();
  const searchParams = useSearchParams();
  const sourceDoctype = searchParams.get("source_doctype") ?? undefined;
  const sourceName = searchParams.get("source_name") ?? undefined;

  useEffect(() => {
    setConfig({
      title: "Create Sales Order",
      subtitle: "Create confirmed customer orders from quotation acceptance."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig]);

  return <SalesOrderForm sourceDoctype={sourceDoctype} sourceName={sourceName} />;
}
