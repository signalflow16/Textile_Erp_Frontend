"use client";

import { useEffect } from "react";
import { DocumentEditorPage } from "@/modules/shared/document/components/document-editor-page";
import { useAppShell } from "@/core/context/app-shell-context";

export default function SalesInvoiceCreateRoute() {
  const { setConfig } = useAppShell();

  useEffect(() => {
    setConfig({
      title: "New Sales Invoice",
      subtitle: "Create sales invoices with pricing defaults and live stock checks."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig]);

  return <DocumentEditorPage doctype="Sales Invoice" name="__draft__sales-invoice" />;
}
