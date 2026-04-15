"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { DocumentEditorPage } from "@/modules/shared/document/components/document-editor-page";
import { useAppShell } from "@/core/context/app-shell-context";

export default function PurchaseReceiptDetailRoute() {
  const { setConfig } = useAppShell();
  const params = useParams<{ name: string }>();

  useEffect(() => {
    setConfig({
      title: "Purchase Receipt",
      subtitle: "Review or continue a purchase receipt draft."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig]);

  return <DocumentEditorPage doctype="Purchase Receipt" name={params.name} />;
}
