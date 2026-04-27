"use client";

import { useMemo } from "react";
import { App, Form, Input, InputNumber, Modal, Select } from "antd";

import { useAppSelector } from "@/core/store/hooks";
import { extractApiErrorMessage } from "@/lib/api-errors";
import { usePosOpeningEntry } from "@/modules/pos/hooks/usePosOpeningEntry";
import { createPosOpeningEntry } from "@/modules/pos/utils/posSessionService";

type OpeningFormValues = {
  pos_profile?: string;
  opening_cash?: number;
  remarks?: string;
};

export function PosOpeningEntryModal({
  open,
  onSuccess,
  onCancel
}: {
  open: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<OpeningFormValues>();
  const opening = usePosOpeningEntry();
  const me = useAppSelector((state) => state.auth.me);
  const openingTimestamp = useMemo(() => new Date().toLocaleString(), [open]);
  const userId = useMemo(
    () => (typeof me?.user_id === "string" && me.user_id ? me.user_id : (typeof me?.email === "string" ? me.email : undefined)),
    [me?.email, me?.user_id]
  );

  const selectedProfile = Form.useWatch("pos_profile", form);
  const profileOptions = opening.profiles;
  const selectedProfileMeta = useMemo(
    () => profileOptions.find((row) => row.value === selectedProfile),
    [profileOptions, selectedProfile]
  );

  const handleStartSession = async () => {
    try {
      const values = await form.validateFields();
      if (!values.pos_profile) {
        message.warning("Select POS Profile.");
        return;
      }
      if (!userId) {
        message.warning("Unable to detect the logged-in cashier. Please sign in again and retry.");
        return;
      }

      await createPosOpeningEntry(() =>
        opening.startSession({
          pos_profile: values.pos_profile!,
          company: selectedProfileMeta?.company,
          user: userId,
          opening_cash: Number(values.opening_cash ?? 0),
          remarks: values.remarks
        })
      );

      message.success("Session started. You can begin billing.");
      form.resetFields();
      onSuccess?.();
    } catch (error) {
      message.error(extractApiErrorMessage(error, "Unable to start POS session."));
    }
  };

  return (
    <Modal
      title="POS Opening Entry"
      open={open}
      onCancel={onCancel}
      onOk={() => {
        void handleStartSession();
      }}
      okText="Start Session"
      confirmLoading={opening.isStarting}
      destroyOnHidden
      maskClosable={false}
    >
      <Form<OpeningFormValues> layout="vertical" form={form} initialValues={{ opening_cash: 0 }} preserve={false}>
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
            />
          </Form.Item>

          <Form.Item label="Company">
            <Input value={selectedProfileMeta?.company ?? ""} placeholder="Auto from profile" readOnly />
          </Form.Item>

          <Form.Item
            label="Opening Cash"
            name="opening_cash"
            rules={[{ required: true, message: "Opening cash is required." }]}
          >
            <InputNumber min={0} precision={2} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item label="Remarks" name="remarks">
            <Input.TextArea rows={3} placeholder="Optional remarks" />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}
