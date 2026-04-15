"use client";

import { useEffect } from "react";
import { UnderDevelopmentPage } from "@/components/under-development-page";
import { useAppShell } from "@/core/context/app-shell-context";

export default function HomePage() {
  const { setConfig } = useAppShell();

  useEffect(() => {
    setConfig({
      title: "Home"
    });

    return () => {
      setConfig({
        title: ""
      });
    };
  }, [setConfig]);

  return <UnderDevelopmentPage />;
}
