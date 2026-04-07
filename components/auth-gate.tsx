"use client";

import { Alert, Button, Result, Spin } from "antd";

import { appEnv } from "@/lib/env";
import { useGetSessionQuery } from "@/store/api/frappeApi";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { data, error, isLoading } = useGetSessionQuery();

  if (isLoading) {
    return (
      <div className="centered-state">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell">
        <Alert
          type="error"
          message="Unable to reach ERPNext"
          description="Check the frontend proxy configuration and confirm the ERPNext site is running."
          showIcon
        />
      </div>
    );
  }

  if (!data?.authenticated) {
    const redirectTarget =
      typeof window !== "undefined"
        ? `${appEnv.loginUrl}?redirect-to=${encodeURIComponent(window.location.href)}`
        : appEnv.loginUrl;

    return (
      <div className="centered-state">
        <Result
          status="403"
          title="ERPNext session required"
          subTitle="Sign in with your existing ERPNext account to continue."
          extra={
            <Button type="primary" href={redirectTarget}>
              Sign in to ERPNext
            </Button>
          }
        />
      </div>
    );
  }

  return <>{children}</>;
}
