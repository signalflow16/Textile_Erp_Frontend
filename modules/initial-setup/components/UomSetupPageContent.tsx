"use client";

import { Alert, Button, Card } from "antd";
import { ReloadOutlined } from "@ant-design/icons";

import { UomSetupForm } from "@/modules/initial-setup/components/UomSetupForm";
import { defaultUomValues } from "@/modules/initial-setup/constants/defaultValues";
import { useInitialSetupDraft } from "@/modules/initial-setup/hooks/useInitialSetupDraft";
import { useInitialSetupStatus } from "@/modules/initial-setup/hooks/useInitialSetupStatus";
import { useMasterCounts } from "@/modules/initial-setup/hooks/useMasterCounts";
import { useSetupReadiness } from "@/modules/initial-setup/hooks/useSetupReadiness";
import { normalizeSetupApiError } from "@/modules/initial-setup/utils/errorMapper";

export function UomSetupPageContent() {
  const statusQuery = useInitialSetupStatus();
  const countsQuery = useMasterCounts();
  const readinessQuery = useSetupReadiness();
  const [values, setValues] = useInitialSetupDraft("initial-setup-uoms", defaultUomValues);

  const refreshAll = async () => {
    await Promise.all([statusQuery.refetch(), countsQuery.refetch(), readinessQuery.refetch()]);
  };

  const statusError = statusQuery.error
    ? normalizeSetupApiError(statusQuery.error, "Unable to fetch setup status.").message
    : null;

  return (
    <div className="page-stack">
      <Card
        title="UOM Setup"
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => void refreshAll()}>
            Refresh
          </Button>
        }
      />

      {statusError ? <Alert type="error" showIcon message="Sync failed" description={statusError} /> : null}

      <UomSetupForm
        initialValues={values}
        status={statusQuery.status?.sections?.uoms}
        onValuesChange={setValues}
        onSuccess={refreshAll}
      />
    </div>
  );
}