"use client";

import { useEffect } from "react";

import { useAppShell } from "@/core/context/app-shell-context";
import { SalesOrderList } from "@/modules/selling/components/SalesOrderList";

export default function SalesOrdersPage() {
  const { setConfig } = useAppShell();

  useEffect(() => {
    setConfig({
      title: "Sales Orders",
      subtitle: "Review confirmed customer orders before dispatch."
    });

    return () => {
      setConfig({
        title: "",
        subtitle: ""
      });
    };
  }, [setConfig]);

  return <SalesOrderList />;
}
