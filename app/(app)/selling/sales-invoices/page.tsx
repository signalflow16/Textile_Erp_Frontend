"use client";

import { useEffect } from "react";
import { DocumentListPage } from "@/modules/shared/document/components/document-list-page";
import { useAppShell } from "@/core/context/app-shell-context";

export default function SalesInvoiceListRoute() {
  const { setConfig } = useAppShell();

  useEffect(() => {
    setConfig({
      title: "Sales Invoices",
      subtitle: "Manage customer billing documents with realtime stock validation."
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
