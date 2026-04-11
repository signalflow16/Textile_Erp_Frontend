"use client";

import { Alert, App, Button, Form, Input, Space } from "antd";

import { companySchema } from "@/modules/initial-setup/schemas/companySchema";
import type { CompanyFormValues, SetupSectionStatus } from "@/modules/initial-setup/types/initialSetup";
import { useSetupCompany } from "@/modules/initial-setup/hooks/useSetupCompany";
import { normalizeSetupApiError, normalizeSetupEnvelopeError } from "@/modules/initial-setup/utils/errorMapper";
import { mapCompanyPayload } from "@/modules/initial-setup/utils/payloadMappers";
import { toUiStatus } from "@/modules/initial-setup/utils/statusMapper";
import { SetupSectionCard } from "@/modules/initial-setup/components/SetupSectionCard";

export function CompanySetupForm({
  initialValues,
  status,
  onValuesChange,
  onSuccess
}: {
  initialValues: CompanyFormValues;
  status?: SetupSectionStatus;
  onValuesChange: (values: CompanyFormValues) => void;
  onSuccess: () => Promise<void>;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<CompanyFormValues>();
  const { submit, isLoading, error } = useSetupCompany();

  const requestError = error ? normalizeSetupApiError(error, "Unable to setup company.") : null;

  const handleSubmit = async (values: CompanyFormValues) => {
    try {
      const response = await submit(mapCompanyPayload(values));
      const setupError = normalizeSetupEnvelopeError(response, "Unable to setup company.");
      if (setupError) {
        message.error(`${setupError.code ? `[${setupError.code}] ` : ""}${setupError.message}`);
        return;
      }

      message.success(response.message || "Company setup completed.");
      await onSuccess();
    } catch (requestErrorValue) {
      const normalized = normalizeSetupApiError(requestErrorValue, "Unable to setup company.");
      message.error(normalized.message);
    }
  };

  return (
    <SetupSectionCard
      title="Company"
      status={toUiStatus(status?.status ?? status?.code)}
      message={status?.message}
    >
      {requestError ? (
        <Alert
          type={requestError.isUnauthorized || requestError.isForbidden ? "warning" : "error"}
          showIcon
          message={requestError.title}
          description={`${requestError.code ? `[${requestError.code}] ` : ""}${requestError.message}`}
        />
      ) : null}

      <Form<CompanyFormValues>
        form={form}
        layout="vertical"
        initialValues={initialValues}
        requiredMark={false}
        onValuesChange={(_, values) => onValuesChange(values)}
        onFinish={handleSubmit}
      >
        <div className="setup-form-grid-2">
          <Form.Item label="Company Name" name="company_name" rules={companySchema.companyNameRules}>
            <Input placeholder="ABC Textiles" />
          </Form.Item>
          <Form.Item label="Abbreviation" name="abbreviation" rules={companySchema.abbreviationRules}>
            <Input placeholder="ABC" maxLength={6} />
          </Form.Item>
          <Form.Item label="Default Currency" name="default_currency" rules={companySchema.currencyRules}>
            <Input placeholder="INR" />
          </Form.Item>
          <Form.Item label="Country" name="country" rules={companySchema.countryRules}>
            <Input placeholder="India" />
          </Form.Item>
        </div>

        <Space>
          <Button type="primary" htmlType="submit" loading={isLoading}>
            Save Company Setup
          </Button>
        </Space>
      </Form>
    </SetupSectionCard>
  );
}
