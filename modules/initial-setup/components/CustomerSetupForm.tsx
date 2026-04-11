"use client";

import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Alert, App, Button, Form, Input, Space } from "antd";

import { SetupSectionCard } from "@/modules/initial-setup/components/SetupSectionCard";
import { useSetupCustomers } from "@/modules/initial-setup/hooks/useSetupCustomers";
import { customerSchema } from "@/modules/initial-setup/schemas/customerSchema";
import type { CustomerFormValues, SetupSectionStatus } from "@/modules/initial-setup/types/initialSetup";
import { normalizeSetupApiError, normalizeSetupEnvelopeError } from "@/modules/initial-setup/utils/errorMapper";
import { mapCustomersPayload } from "@/modules/initial-setup/utils/payloadMappers";
import { toUiStatus } from "@/modules/initial-setup/utils/statusMapper";

export function CustomerSetupForm({
  initialValues,
  status,
  onValuesChange,
  onSuccess
}: {
  initialValues: CustomerFormValues;
  status?: SetupSectionStatus;
  onValuesChange: (values: CustomerFormValues) => void;
  onSuccess: () => Promise<void>;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<CustomerFormValues>();
  const { submit, isLoading, error } = useSetupCustomers();

  const requestError = error ? normalizeSetupApiError(error, "Unable to setup customers.") : null;

  const handleSubmit = async (values: CustomerFormValues) => {
    try {
      const response = await submit(mapCustomersPayload(values));
      const setupError = normalizeSetupEnvelopeError(response, "Unable to setup customers.");
      if (setupError) {
        message.error(`${setupError.code ? `[${setupError.code}] ` : ""}${setupError.message}`);
        return;
      }

      message.success(response.message || "Customer setup completed.");
      await onSuccess();
    } catch (requestErrorValue) {
      const normalized = normalizeSetupApiError(requestErrorValue, "Unable to setup customers.");
      message.error(normalized.message);
    }
  };

  return (
    <SetupSectionCard title="Customers" status={toUiStatus(status?.status ?? status?.code)} message={status?.message}>
      {requestError ? (
        <Alert
          type={requestError.isUnauthorized || requestError.isForbidden ? "warning" : "error"}
          showIcon
          message={requestError.title}
          description={`${requestError.code ? `[${requestError.code}] ` : ""}${requestError.message}`}
        />
      ) : null}

      <Form<CustomerFormValues>
        form={form}
        layout="vertical"
        initialValues={initialValues}
        requiredMark={false}
        onValuesChange={(_, values) => onValuesChange(values)}
        onFinish={handleSubmit}
      >
        <Form.List name="customers">
          {(fields, { add, remove }) => (
            <Space direction="vertical" size={14} style={{ width: "100%" }}>
              {fields.map((field) => (
                <div key={field.key} className="setup-form-grid-supplier">
                  <Form.Item
                    label="Customer Name"
                    name={[field.name, "customer_name"]}
                    rules={customerSchema.customerNameRules}
                  >
                    <Input placeholder="Walk-in Customer" />
                  </Form.Item>
                  <Form.Item
                    label="Customer Group"
                    name={[field.name, "customer_group"]}
                    rules={customerSchema.customerGroupRules}
                  >
                    <Input placeholder="All Customer Groups" />
                  </Form.Item>
                  <Form.Item label="Territory" name={[field.name, "territory"]} rules={customerSchema.territoryRules}>
                    <Input placeholder="India" />
                  </Form.Item>
                  <Form.Item label="Mobile No" name={[field.name, "mobile_no"]} rules={customerSchema.mobileRules}>
                    <Input placeholder="Optional" />
                  </Form.Item>
                  <Form.Item label="Email ID" name={[field.name, "email_id"]} rules={customerSchema.emailRules}>
                    <Input placeholder="Optional" />
                  </Form.Item>
                  <Form.Item label="GSTIN" name={[field.name, "gstin"]} rules={customerSchema.gstinRules}>
                    <Input placeholder="Optional" />
                  </Form.Item>
                  <Button danger icon={<DeleteOutlined />} onClick={() => remove(field.name)}>
                    Remove
                  </Button>
                </div>
              ))}

              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() =>
                  add({
                    customer_name: "",
                    customer_group: "All Customer Groups",
                    territory: "India",
                    mobile_no: "",
                    email_id: "",
                    gstin: ""
                  })
                }
              >
                Add Customer
              </Button>
            </Space>
          )}
        </Form.List>

        <Space>
          <Button type="primary" htmlType="submit" loading={isLoading}>
            Save Customers
          </Button>
        </Space>
      </Form>
    </SetupSectionCard>
  );
}