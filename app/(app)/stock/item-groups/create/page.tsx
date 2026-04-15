"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ItemGroupEditor } from "@/modules/stock/components/item-groups/editor";
import { useAppShell } from "@/core/context/app-shell-context";

export default function CreateItemGroupPage() {
  const { setConfig } = useAppShell();
  const searchParams = useSearchParams();
  const parent = searchParams.get("parent");

  useEffect(() => {
    setConfig({
      title: "Create Item Group",
      subtitle: "Create a new stock hierarchy node with a page-based workflow."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig]);

  return <ItemGroupEditor mode="create" parentItemGroup={parent ? decodeURIComponent(parent) : undefined} />;
}
