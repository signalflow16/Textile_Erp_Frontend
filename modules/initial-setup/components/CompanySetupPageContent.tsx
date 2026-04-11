"use client";

import { useMemo } from "react";
import { Alert, Button, Card, Space } from "antd";
import { ReloadOutlined } from "@ant-design/icons";

import { CompanySetupForm } from "@/modules/initial-setup/components/CompanySetupForm";
import { defaultCompanyValues } from "@/modules/initial-setup/constants/defaultValues";
import { useInitialSetupDraft } from "@/modules/initial-setup/hooks/useInitialSetupDraft";
import { useInitialSetupStatus } from "@/modules/initial-setup/hooks/useInitialSetupStatus";
import { useMasterCounts } from "@/modules/initial-setup/hooks/useMasterCounts";
import { useSetupReadiness } from "@/modules/initial-setup/hooks/useSetupReadiness";
import { normalizeSetupApiError } from "@/modules/initial-setup/utils/errorMapper";

export function CompanySetupPageContent() {
  const statusQuery = useInitialSetupStatus();
  const countsQuery = useMasterCounts();
  const readinessQuery = useSetupReadiness();

  const [values, setValues] = useInitialSetupDraft("initial-setup-company", defaultCompanyValues);

  const refreshAll = async () => {
    await Promise.all([statusQuery.refetch(), countsQuery.refetch(), readinessQuery.refetch()]);
  };

  const errors = useMemo(() => {
    const list: string[] = [];

    if (statusQuery.error) {
      list.push(normalizeSetupApiError(statusQuery.error, "Unable to fetch setup status.").message);
    }

    return list;
  }, [statusQuery.error]);

  return (
    <div className="page-stack">
      <Card
        title="Company Setup"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => void refreshAll()}>
              Refresh
            </Button>
          </Space>
        }
      />

      {errors.map((entry, index) => (
        <Alert key={`company-page-error-${index}`} type="error" showIcon message="Sync failed" description={entry} />
      ))}

      <CompanySetupForm
        initialValues={values}
        status={statusQuery.status?.sections?.company}
        onValuesChange={setValues}
        onSuccess={refreshAll}
      />
    </div>
  );
}