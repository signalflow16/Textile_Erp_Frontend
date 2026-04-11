"use client";

import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Alert, App, Button, Form, Input, Select, Space } from "antd";

import { SetupSectionCard } from "@/modules/initial-setup/components/SetupSectionCard";
import { useSetupSuppliers } from "@/modules/initial-setup/hooks/useSetupSuppliers";
import { supplierSchema } from "@/modules/initial-setup/schemas/supplierSchema";
import type { SetupSectionStatus, SupplierFormValues } from "@/modules/initial-setup/types/initialSetup";
import { normalizeSetupApiError, normalizeSetupEnvelopeError } from "@/modules/initial-setup/utils/errorMapper";
import { mapSuppliersPayload } from "@/modules/initial-setup/utils/payloadMappers";
import { toUiStatus } from "@/modules/initial-setup/utils/statusMapper";

const supplierTypeOptions = [
  { label: "Company", value: "Company" },
  { label: "Individual", value: "Individual" }
];

export function SupplierSetupForm({
  initialValues,
  status,
  onValuesChange,
  onSuccess
}: {
  initialValues: SupplierFormValues;
  status?: SetupSectionStatus;
  onValuesChange: (values: SupplierFormValues) => void;
  onSuccess: () => Promise<void>;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<SupplierFormValues>();
  const { submit, isLoading, error } = useSetupSuppliers();

  const requestError = error ? normalizeSetupApiError(error, "Unable to setup suppliers.") : null;

  const handleSubmit = async (values: SupplierFormValues) => {
    try {
      const response = await submit(mapSuppliersPayload(values));
      const setupError = normalizeSetupEnvelopeError(response, "Unable to setup suppliers.");
      if (setupError) {
        message.error(`${setupError.code ? `[${setupError.code}] ` : ""}${setupError.message}`);
        return;
      }

      message.success(response.message || "Supplier setup completed.");
      await onSuccess();
    } catch (requestErrorValue) {
      const normalized = normalizeSetupApiError(requestErrorValue, "Unable to setup suppliers.");
      message.error(normalized.message);
    }
  };

  return (
    <SetupSectionCard title="Suppliers" status={toUiStatus(status?.status ?? status?.code)} message={status?.message}>
      {requestError ? (
        <Alert
          type={requestError.isUnauthorized || requestError.isForbidden ? "warning" : "error"}
          showIcon
          message={requestError.title}
          description={`${requestError.code ? `[${requestError.code}] ` : ""}${requestError.message}`}
        />
      ) : null}

      <Form<SupplierFormValues>
        form={form}
        layout="vertical"
        initialValues={initialValues}
        requiredMark={false}
        onValuesChange={(_, values) => onValuesChange(values)}
        onFinish={handleSubmit}
      >
        <Form.List name="suppliers">
          {(fields, { add, remove }) => (
            <Space direction="vertical" size={14} style={{ width: "100%" }}>
              {fields.map((field) => (
                <div key={field.key} className="setup-form-grid-supplier">
                  <Form.Item
                    label="Supplier Name"
                    name={[field.name, "supplier_name"]}
                    rules={supplierSchema.supplierNameRules}
                  >
                    <Input placeholder="Vendor One" />
                  </Form.Item>
                  <Form.Item
                    label="Supplier Group"
                    name={[field.name, "supplier_group"]}
                    rules={supplierSchema.supplierGroupRules}
                  >
                    <Input placeholder="All Supplier Groups" />
                  </Form.Item>
                  <Form.Item
                    label="Supplier Type"
                    name={[field.name, "supplier_type"]}
                    rules={supplierSchema.supplierTypeRules}
                  >
                    <Select options={supplierTypeOptions} />
                  </Form.Item>
                  <Form.Item label="Mobile No" name={[field.name, "mobile_no"]} rules={supplierSchema.mobileRules}>
                    <Input placeholder="9876543210" />
                  </Form.Item>
                  <Form.Item label="Email ID" name={[field.name, "email_id"]} rules={supplierSchema.emailRules}>
                    <Input placeholder="vendor@example.com" />
                  </Form.Item>
                  <Form.Item label="GSTIN" name={[field.name, "gstin"]} rules={supplierSchema.gstinRules}>
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
                    supplier_name: "",
                    supplier_group: "All Supplier Groups",
                    supplier_type: "Company",
                    mobile_no: "",
                    email_id: "",
                    gstin: ""
                  })
                }
              >
                Add Supplier
              </Button>
            </Space>
          )}
        </Form.List>

        <Space>
          <Button type="primary" htmlType="submit" loading={isLoading}>
            Save Suppliers
          </Button>
        </Space>
      </Form>
    </SetupSectionCard>
  );
}