"use client";

import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Alert, App, Button, Form, Input, Space, Switch } from "antd";

import { SetupSectionCard } from "@/modules/initial-setup/components/SetupSectionCard";
import { useSetupUoms } from "@/modules/initial-setup/hooks/useSetupUoms";
import { uomSchema } from "@/modules/initial-setup/schemas/uomSchema";
import type { SetupSectionStatus, UomFormValues } from "@/modules/initial-setup/types/initialSetup";
import { normalizeSetupApiError, normalizeSetupEnvelopeError } from "@/modules/initial-setup/utils/errorMapper";
import { mapUomPayload } from "@/modules/initial-setup/utils/payloadMappers";
import { toUiStatus } from "@/modules/initial-setup/utils/statusMapper";

export function UomSetupForm({
  initialValues,
  status,
  onValuesChange,
  onSuccess
}: {
  initialValues: UomFormValues;
  status?: SetupSectionStatus;
  onValuesChange: (values: UomFormValues) => void;
  onSuccess: () => Promise<void>;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<UomFormValues>();
  const { submit, isLoading, error } = useSetupUoms();

  const requestError = error ? normalizeSetupApiError(error, "Unable to setup UOMs.") : null;

  const handleSubmit = async (values: UomFormValues) => {
    try {
      const response = await submit(mapUomPayload(values));
      const setupError = normalizeSetupEnvelopeError(response, "Unable to setup UOMs.");
      if (setupError) {
        message.error(`${setupError.code ? `[${setupError.code}] ` : ""}${setupError.message}`);
        return;
      }

      message.success(response.message || "UOM setup completed.");
      await onSuccess();
    } catch (requestErrorValue) {
      const normalized = normalizeSetupApiError(requestErrorValue, "Unable to setup UOMs.");
      message.error(normalized.message);
    }
  };

  return (
    <SetupSectionCard title="UOMs" status={toUiStatus(status?.status ?? status?.code)} message={status?.message}>
      {requestError ? (
        <Alert
          type={requestError.isUnauthorized || requestError.isForbidden ? "warning" : "error"}
          showIcon
          message={requestError.title}
          description={`${requestError.code ? `[${requestError.code}] ` : ""}${requestError.message}`}
        />
      ) : null}

      <Form<UomFormValues>
        form={form}
        layout="vertical"
        initialValues={initialValues}
        requiredMark={false}
        onValuesChange={(_, values) => onValuesChange(values)}
        onFinish={handleSubmit}
      >
        <Form.List name="uoms">
          {(fields, { add, remove }) => (
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              {fields.map((field) => (
                <div key={field.key} className="setup-form-grid-uom">
                  <Form.Item
                    label="UOM Name"
                    name={[field.name, "uom_name"]}
                    rules={uomSchema.uomNameRules}
                    style={{ marginBottom: 0 }}
                  >
                    <Input placeholder="Nos" />
                  </Form.Item>
                  <Form.Item
                    label="Must Be Whole Number"
                    name={[field.name, "must_be_whole_number"]}
                    valuePropName="checked"
                    style={{ marginBottom: 0 }}
                  >
                    <Switch />
                  </Form.Item>
                  <Button danger icon={<DeleteOutlined />} onClick={() => remove(field.name)}>
                    Remove
                  </Button>
                </div>
              ))}

              <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ uom_name: "", must_be_whole_number: false })}>
                Add UOM
              </Button>
            </Space>
          )}
        </Form.List>

        <Space>
          <Button type="primary" htmlType="submit" loading={isLoading}>
            Save UOMs
          </Button>
        </Space>
      </Form>
    </SetupSectionCard>
  );
}