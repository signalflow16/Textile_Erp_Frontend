"use client";

import { useMemo } from "react";
import Link from "next/link";
import { App, Button, Card, Form, Input, InputNumber, Select, Space, Typography } from "antd";
import { useRouter } from "next/navigation";

import { extractApiErrorMessage } from "@/lib/api-errors";
import { useActivePosSession } from "@/modules/pos/hooks/useActivePosSession";
import { usePosOpeningEntry } from "@/modules/pos/hooks/usePosOpeningEntry";
import { createPosOpeningEntry } from "@/modules/pos/utils/posSessionService";

const { Text } = Typography;

type OpeningFormValues = {
  pos_profile?: string;
  company?: string;
  opening_cash?: number;
  remarks?: string;
};

export function PosOpeningEntryPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const [form] = Form.useForm<OpeningFormValues>();
  const activeSession = useActivePosSession();
  const opening = usePosOpeningEntry();
  const openingTimestamp = useMemo(() => new Date().toLocaleString(), []);

  const selectedProfile = Form.useWatch("pos_profile", form);
  const profileOptions = opening.profiles;
  const selectedProfileMeta = useMemo(
    () => profileOptions.find((row) => row.value === selectedProfile),
    [profileOptions, selectedProfile]
  );

  const onStartSession = async () => {
    try {
      const values = await form.validateFields();
      if (!values.pos_profile) {
        message.warning("Select POS Profile.");
        return;
      }
      const posProfile = values.pos_profile;

      await createPosOpeningEntry(() =>
        opening.startSession({
          pos_profile: posProfile,
          company: values.company || selectedProfileMeta?.company,
          opening_cash: Number(values.opening_cash ?? 0),
          remarks: values.remarks
        })
      );
      message.success("Session started. You can begin billing.");
      router.replace("/pos");
    } catch (error) {
      message.error(extractApiErrorMessage(error, "Unable to start POS session."));
    }
  };

  if (activeSession.session) {
    return (
      <Card>
        <Space direction="vertical" size={8}>
          <Text strong>Active POS session already exists</Text>
          <Text type="secondary">
            Profile: {activeSession.session.pos_profile} | Session: {activeSession.session.name}
          </Text>
          <Space>
            <Link href="/pos">
              <Button type="primary">Go to Billing</Button>
            </Link>
            <Link href="/pos/closing">
              <Button>Close Session</Button>
            </Link>
          </Space>
        </Space>
      </Card>
    );
  }

  return (
    <Card title="POS Opening Entry">
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Text type="secondary">Start POS session before billing</Text>
        <Text type="secondary">Start the billing session by entering opening cash</Text>

        <Form<OpeningFormValues> layout="vertical" form={form} initialValues={{ opening_cash: 0 }}>
          <div className="pos-payment-grid">
            <Form.Item label="Opening Time">
              <Input value={openingTimestamp} readOnly />
            </Form.Item>

            <Form.Item
              label="POS Profile"
              name="pos_profile"
              rules={[{ required: true, message: "POS Profile is required." }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                loading={opening.isProfilesLoading}
                options={profileOptions}
                placeholder="Select POS Profile"
                onChange={(value) => {
                  const profile = profileOptions.find((row) => row.value === value);
                  form.setFieldValue("company", profile?.company);
                }}
              />
            </Form.Item>

            <Form.Item label="Company" name="company">
              <Input placeholder="Auto from profile" />
            </Form.Item>

            <Form.Item
              label="Opening Cash"
              name="opening_cash"
              rules={[{ required: true, message: "Opening cash is required." }]}
            >
              <InputNumber min={0} precision={2} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item label="Remarks" name="remarks">
              <Input.TextArea rows={2} placeholder="Optional remarks" />
            </Form.Item>
          </div>
        </Form>

        <Space>
          <Button type="primary" loading={opening.isStarting} onClick={() => void onStartSession()}>
            Start Session
          </Button>
          <Link href="/pos">
            <Button>Back to POS</Button>
          </Link>
        </Space>
      </Space>
    </Card>
  );
}
