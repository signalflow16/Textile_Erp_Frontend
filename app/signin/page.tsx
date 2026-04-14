"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Button, Card, Form, Input, Space, Typography } from "antd";

import {
  AUTH_RETRY_DELAY_MS,
  isRetryableAuthError,
  isUnauthorizedAuthError,
  waitFor
} from "@/lib/auth-session";
import { extractApiErrorMessage, extractEnvelopeMessage } from "@/lib/api-errors";
import { useAppDispatch } from "@/store/hooks";
import { useLazyAuthMeQuery, useLoginMutation } from "@/store/api/frappeApi";
import { clearAuth, markAuthenticated, setAuthHydrated, setAuthMe } from "@/store/features/auth/authSlice";

const { Paragraph, Text, Title } = Typography;

type SignInValues = {
  login: string;
  password: string;
};

export default function SignInPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [login, loginState] = useLoginMutation();
  const [triggerAuthMe] = useLazyAuthMeQuery();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const redirectTo = useMemo(
    () => searchParams.get("redirect") || "/stock",
    [searchParams]
  );
  const toMessage = (value: unknown, fallback: string) =>
    typeof value === "string" ? value : fallback;
  const getFailureMessage = (
    response: { message?: unknown; error?: { message?: unknown }; details?: unknown; _server_messages?: unknown },
    fallback: string
  ) =>
    extractEnvelopeMessage(
      response,
      toMessage(response.message, toMessage(response.error?.message, fallback))
    );
  const syncSignedInUser = async () => {
    try {
      const response = await triggerAuthMe().unwrap();
      const userId = typeof response.data?.user_id === "string" ? response.data.user_id : null;

      if (response.ok && userId && userId !== "Guest") {
        dispatch(setAuthMe(response.data));
      }
    } catch (error) {
      if (isUnauthorizedAuthError(error)) {
        dispatch(clearAuth());
        return;
      }

      if (!isRetryableAuthError(error)) {
        return;
      }

      await waitFor(AUTH_RETRY_DELAY_MS);

      try {
        const retryResponse = await triggerAuthMe().unwrap();
        const userId =
          typeof retryResponse.data?.user_id === "string" ? retryResponse.data.user_id : null;

        if (retryResponse.ok && userId && userId !== "Guest") {
          dispatch(setAuthMe(retryResponse.data));
        }
      } catch (retryError) {
        if (isUnauthorizedAuthError(retryError)) {
          dispatch(clearAuth());
        }
      }
    }
  };

  const handleSubmit = async (values: SignInValues) => {
    setErrorMessage(null);

    try {
      const response = await login(values).unwrap();
      if (!response.ok) {
        setErrorMessage(getFailureMessage(response, "Sign in failed."));
        return;
      }

      dispatch(markAuthenticated({ full_name: response.data.full_name }));
      dispatch(setAuthHydrated(true));
      void syncSignedInUser();
      router.replace(redirectTo);
    } catch (error) {
      setErrorMessage(extractApiErrorMessage(error, "Unable to sign in right now."));
    }
  };

  return (
    <div className="auth-screen">
      <Card className="auth-card" variant="borderless">
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <div>
            <Text type="secondary">Textile ERP</Text>
            <Title level={3} style={{ marginTop: 6, marginBottom: 6 }}>
              Sign in
            </Title>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              Use your account credentials to continue.
            </Paragraph>
          </div>

          {errorMessage ? <Alert type="error" message={errorMessage} showIcon /> : null}

          <Form<SignInValues> layout="vertical" onFinish={handleSubmit} requiredMark={false}>
            <Form.Item
              label="Email or Login"
              name="login"
              rules={[
                {
                  required: true,
                  message: "Enter your email or login id."
                }
              ]}
            >
              <Input size="large" placeholder="owner@company.com" autoComplete="username" />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[
                {
                  required: true,
                  message: "Enter your password."
                }
              ]}
            >
              <Input.Password size="large" placeholder="Your password" autoComplete="current-password" />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loginState.isLoading}
            >
              Sign in
            </Button>
          </Form>

          <Text type="secondary">
            First-time setup? <Link href="/signup">Create the Owner account</Link>
          </Text>
        </Space>
      </Card>
    </div>
  );
}
