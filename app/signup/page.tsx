"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Card, Form, Input, Space, Typography } from "antd";

import { extractApiErrorMessage, extractEnvelopeMessage } from "@/lib/api-errors";
import { useAppDispatch } from "@/store/hooks";
import {
  useLazyAuthMeQuery,
  useLoginMutation,
  useSignupOwnerMutation
} from "@/store/api/frappeApi";
import { clearAuth, setAuthMe } from "@/store/features/auth/authSlice";

const { Paragraph, Text, Title } = Typography;

type SignUpValues = {
  email: string;
  first_name: string;
  last_name?: string;
  company: string;
  branch_name: string;
  password: string;
  confirm_password: string;
};

export default function SignUpPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [signupOwner, signupState] = useSignupOwnerMutation();
  const [login] = useLoginMutation();
  const [triggerAuthMe] = useLazyAuthMeQuery();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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

  const handleSubmit = async (values: SignUpValues) => {
    setErrorMessage(null);

    try {
      const signupResponse = await signupOwner({
        email: values.email,
        password: values.password,
        first_name: values.first_name,
        last_name: values.last_name,
        company: values.company,
        branch_name: values.branch_name
      }).unwrap();

      if (!signupResponse.ok) {
        setErrorMessage(getFailureMessage(signupResponse, "Owner signup failed."));
        return;
      }

      const loginResponse = await login({
        login: values.email,
        password: values.password
      }).unwrap();

      if (!loginResponse.ok) {
        setErrorMessage(getFailureMessage(loginResponse, "Owner created, but login failed."));
        return;
      }

      const meResponse = await triggerAuthMe().unwrap();
      if (meResponse.ok) {
        dispatch(setAuthMe(meResponse.data));
      } else {
        // Fallback for sites where the profile method is restricted/non-whitelisted.
        dispatch(
          setAuthMe({
            user_id: values.email,
            email: values.email
          })
        );
      }
      router.replace("/stock/items");
    } catch (error) {
      setErrorMessage(extractApiErrorMessage(error, "Unable to complete owner signup."));
    }
  };

  return (
    <div className="auth-screen">
      <Card className="auth-card" variant="borderless">
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <div>
            <Text type="secondary">Textile ERP</Text>
            <Title level={3} style={{ marginTop: 6, marginBottom: 6 }}>
              Create Owner Account
            </Title>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              This is a one-time bootstrap for the first Owner user.
            </Paragraph>
          </div>

          {errorMessage ? <Alert type="error" message={errorMessage} showIcon /> : null}

          <Form<SignUpValues> layout="vertical" onFinish={handleSubmit} requiredMark={false}>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Enter owner email." },
                { type: "email", message: "Enter a valid email address." }
              ]}
            >
              <Input size="large" placeholder="owner@company.com" autoComplete="email" />
            </Form.Item>

            <Form.Item
              label="First Name"
              name="first_name"
              rules={[{ required: true, message: "Enter first name." }]}
            >
              <Input size="large" placeholder="Main" autoComplete="given-name" />
            </Form.Item>

            <Form.Item label="Last Name" name="last_name">
              <Input size="large" placeholder="Owner" autoComplete="family-name" />
            </Form.Item>

            <Form.Item
              label="Company"
              name="company"
              rules={[{ required: true, message: "Enter company name." }]}
            >
              <Input size="large" placeholder="Acme Textiles Pvt Ltd" autoComplete="organization" />
            </Form.Item>

            <Form.Item
              label="Branch Name"
              name="branch_name"
              rules={[{ required: true, message: "Enter branch name." }]}
            >
              <Input size="large" placeholder="Main Branch" />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: "Enter password." },
                { min: 8, message: "Use at least 8 characters." }
              ]}
            >
              <Input.Password size="large" placeholder="StrongPass@123" autoComplete="new-password" />
            </Form.Item>

            <Form.Item
              label="Confirm Password"
              name="confirm_password"
              dependencies={["password"]}
              rules={[
                { required: true, message: "Confirm password." },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Passwords do not match."));
                  }
                })
              ]}
            >
              <Input.Password size="large" placeholder="Re-enter password" autoComplete="new-password" />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={signupState.isLoading}
            >
              Create Owner
            </Button>
          </Form>

          <Text type="secondary">
            Already have an account? <Link href="/signin">Sign in</Link>
          </Text>
        </Space>
      </Card>
    </div>
  );
}
