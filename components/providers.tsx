"use client";

import "@ant-design/v5-patch-for-react-19";

import { PropsWithChildren } from "react";
import { ConfigProvider, App as AntdApp, theme } from "antd";
import { Provider } from "react-redux";

import { store } from "@/store";

export function Providers({ children }: PropsWithChildren) {
  return (
    <Provider store={store}>
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
