"use client";

import { useEffect } from "react";
import { DocumentListPage } from "@/modules/shared/document/components/document-list-page";
import { useAppShell } from "@/core/context/app-shell-context";

export default function SellingPage() {
  const { setConfig } = useAppShell();

  useEffect(() => {
    setConfig({
      title: "Sales Invoices",
      subtitle: "Create customer invoices with pricing defaults, stock validation, and document lifecycle controls."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig]);

  return <DocumentListPage doctype="Sales Invoice" />;
}
