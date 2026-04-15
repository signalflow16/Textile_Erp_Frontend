"use client";

import "@ant-design/v5-patch-for-react-19";

import { PropsWithChildren, useEffect } from "react";
import { ConfigProvider, App as AntdApp, theme } from "antd";
import { Provider } from "react-redux";

import { configureAuthRuntime } from "@/core/auth/auth-runtime";
import { useSessionKeepAlive } from "@/lib/useSessionKeepAlive";
import { store } from "@/store";
import { frappeApi } from "@/core/api/frappeApi";
import { clearAuth } from "@/core/store/authSlice";
import { setCsrfToken } from "@/core/store/sessionSlice";

function AuthRuntimeBridge() {
  useSessionKeepAlive();

  useEffect(() => {
    configureAuthRuntime({
      onUnauthorized: () => {
        store.dispatch(clearAuth());
        store.dispatch(setCsrfToken(null));
        store.dispatch(frappeApi.util.resetApiState());

        if (typeof window === "undefined") {
          return;
        }

        const pathname = window.location.pathname;
        if (pathname.startsWith("/signin") || pathname.startsWith("/signup")) {
          return;
        }

        const redirectTo = `${pathname}${window.location.search}`;
        window.location.replace(`/signin?redirect=${encodeURIComponent(redirectTo || "/stock")}`);
      }
    });
  }, []);

  return null;
}

export function Providers({ children }: PropsWithChildren) {
  return (
    <Provider store={store}>
      <AuthRuntimeBridge />
      <ConfigProvider
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: {
            colorPrimary: "#2563eb",
            colorInfo: "#2563eb",
            borderRadius: 10,
            fontFamily: "\"Aptos\", \"Bahnschrift\", \"Trebuchet MS\", sans-serif"
          }
        }}
      >
        <AntdApp>{children}</AntdApp>
      </ConfigProvider>
    </Provider>
  );
}
