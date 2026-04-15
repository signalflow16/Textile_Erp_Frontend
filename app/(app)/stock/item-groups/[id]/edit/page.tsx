"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { ItemGroupEditor } from "@/modules/stock/components/item-groups/editor";
import { useAppShell } from "@/core/context/app-shell-context";

export default function EditItemGroupPage() {
  const { setConfig } = useAppShell();
  const params = useParams<{ id: string }>();
  const itemGroupName = decodeURIComponent(params.id);

  useEffect(() => {
    setConfig({
      title: itemGroupName,
      subtitle: "Review item group information, update hierarchy settings, and add children from the document page."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [itemGroupName, setConfig]);

  return <ItemGroupEditor mode="edit" itemGroupName={itemGroupName} />;
}
