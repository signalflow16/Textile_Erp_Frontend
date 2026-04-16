"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type AppShellConfig = {
  title?: string;
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
  subtitle: ""
};

export function AppShellProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfigState] = useState<AppShellConfig>(defaultConfig);

  const setConfig = useCallback((next: AppShellConfig) => {
    setConfigState({
      title: next.title ?? "",
      subtitle: next.subtitle ?? ""
    });
  }, []);

  const resetConfig = useCallback(() => {
    setConfigState(defaultConfig);
  }, []);

  const value = useMemo(
    () => ({
      config,
      setConfig,
      resetConfig
    }),
    [config, resetConfig, setConfig]
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
