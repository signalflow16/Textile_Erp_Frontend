"use client";

import { useEffect } from "react";

import { useAppShell } from "@/core/context/app-shell-context";
import { QuotationForm } from "@/modules/selling/components/QuotationForm";

export default function NewQuotationPage() {
  const { setConfig } = useAppShell();

  useEffect(() => {
    setConfig({
      title: "Create Quotation",
      subtitle: "Create customer quotations following the ERPNext selling flow."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig]);

  return <QuotationForm />;
}
