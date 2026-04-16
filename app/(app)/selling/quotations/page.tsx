"use client";

import { useEffect } from "react";

import { useAppShell } from "@/core/context/app-shell-context";
import { QuotationList } from "@/modules/selling/components/QuotationList";

export default function QuotationsPage() {
  const { setConfig } = useAppShell();

  useEffect(() => {
    setConfig({
      title: "Quotations",
      subtitle: "Prepare and track customer proposals before order confirmation."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig]);

  return <QuotationList />;
}
