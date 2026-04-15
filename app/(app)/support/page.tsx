"use client";

import { useEffect } from "react";
import { UnderDevelopmentPage } from "@/components/under-development-page";
import { useAppShell } from "@/core/context/app-shell-context";

export default function SupportPage() {
  const { setConfig } = useAppShell();

  useEffect(() => {
    setConfig({
      title: "Support"
    });

    return () => {
      setConfig({
        title: ""
      });
    };
  }, [setConfig]);

  return <UnderDevelopmentPage />;
}
