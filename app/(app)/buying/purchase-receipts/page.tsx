"use client";

import { useEffect } from "react";
import { DocumentListPage } from "@/modules/shared/document/components/document-list-page";
import { useAppShell } from "@/core/context/app-shell-context";

export default function PurchaseReceiptListRoute() {
  const { setConfig } = useAppShell();

  useEffect(() => {
    setConfig({
      title: "Purchase Receipts",
      subtitle: "Manage inbound supplier receipts with draft and submit lifecycle controls."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig]);

  return <DocumentListPage doctype="Purchase Receipt" />;
}
