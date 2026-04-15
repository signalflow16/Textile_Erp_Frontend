"use client";

import { createContext, useContext, useMemo, useState } from "react";

export type AppShellConfig = {
  title?: string;
  breadcrumb?: string;
  subtitle?: string;
};

type AppShellContextValue = {
  config: AppShellConfig;
  setConfig: (config: AppShellConfig) => void;
  resetConfig: () => void;
};

const AppShellContext = createContext<AppShellContextValue | null>(null);

const defaultConfig: AppShellConfig = {
  title: "",
  breadcrumb: "",
  subtitle: ""
};

export function AppShellProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfigState] = useState<AppShellConfig>(defaultConfig);

  const setConfig = (next: AppShellConfig) => {
    setConfigState({
      title: next.title ?? "",
      breadcrumb: next.breadcrumb ?? "",
      subtitle: next.subtitle ?? ""
    });
  };

  const resetConfig = () => {
    setConfigState(defaultConfig);
  };

  const value = useMemo(
    () => ({
      config,
      setConfig,
      resetConfig
    }),
    [config]
  );

  return <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>;
}

export function useAppShell() {
  const ctx = useContext(AppShellContext);

  if (!ctx) {
    throw new Error("useAppShell must be used within AppShellProvider");
  }

  return ctx;
}