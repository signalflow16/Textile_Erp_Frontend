"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { DocumentEditorPage } from "@/modules/shared/document/components/document-editor-page";
import { useAppShell } from "@/core/context/app-shell-context";

export default function SalesInvoiceDetailRoute() {
  const { setConfig } = useAppShell();
  const params = useParams<{ name: string }>();

  useEffect(() => {
    setConfig({
      title: "Sales Invoice",
      subtitle: "Review submitted invoices or continue draft edits."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig]);

  return <DocumentEditorPage doctype="Sales Invoice" name={params.name} />;
}
