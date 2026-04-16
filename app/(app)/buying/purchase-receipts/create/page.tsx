"use client";

import { useEffect } from "react";
import { DocumentEditorPage } from "@/modules/shared/document/components/document-editor-page";
import { useAppShell } from "@/core/context/app-shell-context";

export default function PurchaseReceiptCreateRoute() {
  const { setConfig } = useAppShell();

  useEffect(() => {
    setConfig({
      title: "New Purchase Receipt",
      subtitle: "Capture incoming stock from suppliers using the generic document engine."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig]);

  return <DocumentEditorPage doctype="Purchase Receipt" name="__draft__purchase-receipt" />;
}
