"use client";

import { Alert, Button, Card } from "antd";
import { ReloadOutlined } from "@ant-design/icons";

import { SupplierSetupForm } from "@/modules/initial-setup/components/SupplierSetupForm";
import { defaultSupplierValues } from "@/modules/initial-setup/constants/defaultValues";
import { useInitialSetupDraft } from "@/modules/initial-setup/hooks/useInitialSetupDraft";
import { useInitialSetupStatus } from "@/modules/initial-setup/hooks/useInitialSetupStatus";
import { useMasterCounts } from "@/modules/initial-setup/hooks/useMasterCounts";
import { useSetupReadiness } from "@/modules/initial-setup/hooks/useSetupReadiness";
import { normalizeSetupApiError } from "@/modules/initial-setup/utils/errorMapper";

export function SupplierSetupPageContent() {
  const statusQuery = useInitialSetupStatus();
  const countsQuery = useMasterCounts();
  const readinessQuery = useSetupReadiness();
  const [values, setValues] = useInitialSetupDraft("initial-setup-suppliers", defaultSupplierValues);

  const refreshAll = async () => {
    await Promise.all([statusQuery.refetch(), countsQuery.refetch(), readinessQuery.refetch()]);
  };

  const statusError = statusQuery.error
    ? normalizeSetupApiError(statusQuery.error, "Unable to fetch setup status.").message
    : null;

  return (
    <div className="page-stack">
      <Card
        title="Supplier Setup"
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => void refreshAll()}>
            Refresh
          </Button>
        }
      />

      {statusError ? <Alert type="error" showIcon message="Sync failed" description={statusError} /> : null}

      <SupplierSetupForm
        initialValues={values}
        status={statusQuery.status?.sections?.suppliers}
        onValuesChange={setValues}
        onSuccess={refreshAll}
      />
    </div>
  );
}