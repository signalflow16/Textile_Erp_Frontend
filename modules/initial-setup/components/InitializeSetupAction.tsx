"use client";

import { Alert, App, Button, Card, Divider, Space, Tag, Typography } from "antd";

import { useInitializeInitialSetup } from "@/modules/initial-setup/hooks/useInitializeInitialSetup";
import type { InitialSetupPayload, SetupActionResponseData } from "@/modules/initial-setup/types/initialSetup";
import { normalizeSetupApiError, normalizeSetupEnvelopeError } from "@/modules/initial-setup/utils/errorMapper";
import { outcomeColor, setupSections, toOutcome } from "@/modules/initial-setup/utils/statusMapper";

const { Text } = Typography;

const sectionResultStatus = (sectionData: unknown) => {
  if (!sectionData || typeof sectionData !== "object") {
    return "not_started";
  }

  const data = sectionData as { status?: unknown; result?: unknown; code?: unknown };
  return data.status ?? data.result ?? data.code ?? "not_started";
};

export function InitializeSetupAction({
  payload,
  onCompleted,
  onSuccess
}: {
  payload: InitialSetupPayload;
  onCompleted: (data: SetupActionResponseData | null) => void;
  onSuccess: () => Promise<void>;
}) {
  const { message } = App.useApp();
  const { submit, isLoading, error } = useInitializeInitialSetup();

  const requestError = error ? normalizeSetupApiError(error, "Unable to run initial setup.") : null;

  const handleRun = async () => {
    try {
      const response = await submit(payload);
      const envelopeError = normalizeSetupEnvelopeError(response, "Unable to run initial setup.");
      if (envelopeError) {
        message.error(`${envelopeError.code ? `[${envelopeError.code}] ` : ""}${envelopeError.message}`);
        return;
      }

      onCompleted(response.data ?? null);
      message.success(response.message || "Initial setup completed.");
      await onSuccess();
    } catch (requestErrorValue) {
      const normalized = normalizeSetupApiError(requestErrorValue, "Unable to run initial setup.");
      message.error(normalized.message);
    }
  };

  return (
    <Card title="Run Initial Setup">
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <Text type="secondary">
          This action runs all setup sections sequentially against standard ERPNext resources and keeps the flow idempotent.
        </Text>

        {requestError ? (
          <Alert
            type={requestError.isUnauthorized || requestError.isForbidden ? "warning" : "error"}
            showIcon
            message={requestError.title}
            description={`${requestError.code ? `[${requestError.code}] ` : ""}${requestError.message}`}
          />
        ) : null}

        <Button type="primary" onClick={handleRun} loading={isLoading}>
          Run Initial Setup
        </Button>
      </Space>
    </Card>
  );
}

export function InitializeSetupResult({ data }: { data: SetupActionResponseData | null }) {
  if (!data?.sections) {
    return null;
  }

  return (
    <Card title="Last Initialization Result">
      <Space direction="vertical" size={10} style={{ width: "100%" }}>
        {setupSections.map((section) => {
          const entry = data.sections?.[section.key];
          const outcome = toOutcome(sectionResultStatus(entry));
          const sectionMessage =
            entry && typeof entry === "object" && typeof (entry as { message?: unknown }).message === "string"
              ? (entry as { message: string }).message
              : null;

          return (
            <Space key={section.key} style={{ justifyContent: "space-between", width: "100%" }}>
              <Text>{section.label}</Text>
              <Space>
                {sectionMessage ? <Text type="secondary">{sectionMessage}</Text> : null}
                <Tag color={outcomeColor(outcome)}>{outcome.replace("_", " ").toUpperCase()}</Tag>
              </Space>
            </Space>
          );
        })}
        <Divider style={{ margin: "8px 0" }} />
        {data.summary ? (
          <pre className="setup-json-preview">{JSON.stringify(data.summary, null, 2)}</pre>
        ) : (
          <Text type="secondary">No summary payload returned by backend.</Text>
        )}
      </Space>
    </Card>
  );
}
