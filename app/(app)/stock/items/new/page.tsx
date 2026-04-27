"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ItemForm } from "@/modules/stock/components/item-form";
import { useAppShell } from "@/core/context/app-shell-context";
import type { ItemDocument } from "@/modules/stock/types/item";

export default function NewItemPage() {
  const { setConfig } = useAppShell();
  const searchParams = useSearchParams();
  const createMode = searchParams.get("mode");
  const templateCode = searchParams.get("template");

  const initialValues: Partial<ItemDocument> | undefined =
    createMode === "template"
      ? { has_variants: 1 }
      : createMode === "variant"
        ? { has_variants: 0, variant_of: templateCode ?? "" }
        : undefined;

  useEffect(() => {
    setConfig({
      title: "Create Item",
      subtitle: "Create a stock item master with textile attributes, pricing, and barcode definitions."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig]);

  return (
    <div className="page-stack">
      <ItemForm mode="create" initialValues={initialValues} />
    </div>
  );
}
