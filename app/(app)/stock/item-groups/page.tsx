"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ItemGroupWorkspace } from "@/modules/stock/components/item-groups/workspace";
import { useAppShell } from "@/core/context/app-shell-context";

export default function ItemGroupsPage() {
  const { setConfig } = useAppShell();
  const searchParams = useSearchParams();
  const selected = searchParams.get("selected");

  useEffect(() => {
    setConfig({
      title: "Item Groups",
      subtitle: "Tree-based item group management with inline actions and page-based create/edit flows."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig]);

  return <ItemGroupWorkspace selectedGroup={selected ? decodeURIComponent(selected) : undefined} />;
}
