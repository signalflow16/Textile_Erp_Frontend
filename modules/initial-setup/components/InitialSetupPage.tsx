"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Alert, Button, Card, Col, Row, Space, Typography } from "antd";
import { ReloadOutlined } from "@ant-design/icons";

import {
  defaultCompanyValues,
  defaultCustomerValues,
  defaultItemGroupValues,
  defaultSupplierValues,
  defaultUomValues,
  defaultWarehouseValues
} from "@/modules/initial-setup/constants/defaultValues";
import { InitializeSetupAction, InitializeSetupResult } from "@/modules/initial-setup/components/InitializeSetupAction";
import { MasterCountsCard } from "@/modules/initial-setup/components/MasterCountsCard";
import { ReadinessBanner } from "@/modules/initial-setup/components/ReadinessBanner";
import { SetupStatusSummary } from "@/modules/initial-setup/components/SetupStatusSummary";
import { useInitialSetupDraft } from "@/modules/initial-setup/hooks/useInitialSetupDraft";
import { useInitialSetupStatus } from "@/modules/initial-setup/hooks/useInitialSetupStatus";
import { useMasterCounts } from "@/modules/initial-setup/hooks/useMasterCounts";
import { useSetupReadiness } from "@/modules/initial-setup/hooks/useSetupReadiness";
import type { SetupActionResponseData } from "@/modules/initial-setup/types/initialSetup";
import { normalizeSetupApiError } from "@/modules/initial-setup/utils/errorMapper";
import { mapInitializePayload } from "@/modules/initial-setup/utils/payloadMappers";

const { Text } = Typography;

const setupLinks = [
  { href: "/initial-setup/company", title: "Company", description: "Setup company profile and defaults." },
  { href: "/initial-setup/warehouses", title: "Warehouses", description: "Configure warehouse hierarchy." },
  { href: "/initial-setup/uoms", title: "UOMs", description: "Add and manage UOM master rows." },
  { href: "/initial-setup/item-groups", title: "Item Groups", description: "Define textile item group tree." },
  { href: "/initial-setup/suppliers", title: "Suppliers", description: "Create supplier master data." },
  { href: "/initial-setup/customers", title: "Customers", description: "Create customer master data." }
];

export function InitialSetupPage() {
  const statusQuery = useInitialSetupStatus();
  const countsQuery = useMasterCounts();
  const readinessQuery = useSetupReadiness();

  const [companyValues] = useInitialSetupDraft("initial-setup-company", defaultCompanyValues);
  const [warehouseValues] = useInitialSetupDraft("initial-setup-warehouses", defaultWarehouseValues);
  const [uomValues] = useInitialSetupDraft("initial-setup-uoms", defaultUomValues);
  const [itemGroupValues] = useInitialSetupDraft("initial-setup-item-groups", defaultItemGroupValues);
  const [supplierValues] = useInitialSetupDraft("initial-setup-suppliers", defaultSupplierValues);
  const [customerValues] = useInitialSetupDraft("initial-setup-customers", defaultCustomerValues);
  const [lastInitializeResult, setLastInitializeResult] = useState<SetupActionResponseData | null>(null);

  const refreshAll = async () => {
    await Promise.all([statusQuery.refetch(), countsQuery.refetch(), readinessQuery.refetch()]);
  };

  const topErrors = useMemo(() => {
    const items: Array<{ type: "error" | "warning"; title: string; message: string }> = [];

    if (statusQuery.error) {
      const error = normalizeSetupApiError(statusQuery.error, "Unable to fetch setup status.");
      items.push({
        type: error.isUnauthorized || error.isForbidden ? "warning" : "error",
        title: error.title,
        message: `${error.code ? `[${error.code}] ` : ""}${error.message}`
      });
    }

    if (countsQuery.error) {
      const error = normalizeSetupApiError(countsQuery.error, "Unable to fetch master counts.");
      items.push({
        type: error.isUnauthorized || error.isForbidden ? "warning" : "error",
        title: error.title,
        message: `${error.code ? `[${error.code}] ` : ""}${error.message}`
      });
    }

    if (readinessQuery.error) {
      const error = normalizeSetupApiError(readinessQuery.error, "Unable to validate readiness.");
      items.push({
        type: error.isUnauthorized || error.isForbidden ? "warning" : "error",
        title: error.title,
        message: `${error.code ? `[${error.code}] ` : ""}${error.message}`
      });
    }

    return items;
  }, [countsQuery.error, readinessQuery.error, statusQuery.error]);

  const refreshBusy = statusQuery.isFetching || countsQuery.isFetching || readinessQuery.isFetching;

  const payload = mapInitializePayload({
    company: companyValues,
    warehouses: warehouseValues,
    uoms: uomValues,
    itemGroups: itemGroupValues,
    suppliers: supplierValues,
    customers: customerValues
  });

  return (
    <div className="page-stack">
      <Card
        title="Initial Setup Dashboard"
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => void refreshAll()} loading={refreshBusy}>
            Refresh Status
          </Button>
        }
      >
        <Space direction="vertical" size={8}>
          <Text type="secondary">Open each setup form from sidebar or dashboard cards and save section-wise.</Text>
          <Text type="secondary">Draft values are preserved per section and used by the full initialization action.</Text>
        </Space>
      </Card>

      {topErrors.map((item, index) => (
        <Alert key={`setup-top-error-${index}`} type={item.type} showIcon message={item.title} description={item.message} />
      ))}

      <Row gutter={[12, 12]}>
        {setupLinks.map((entry) => (
          <Col key={entry.href} xs={24} md={12} lg={8}>
            <Card size="small" title={entry.title} extra={<Link href={entry.href}>Open</Link>}>
              <Text type="secondary">{entry.description}</Text>
            </Card>
          </Col>
        ))}
      </Row>

      <SetupStatusSummary data={statusQuery.status} />
      <MasterCountsCard counts={countsQuery.counts} />
      <ReadinessBanner readiness={readinessQuery.readiness} isReady={readinessQuery.isReady} />

      <InitializeSetupAction payload={payload} onCompleted={setLastInitializeResult} onSuccess={refreshAll} />
      <InitializeSetupResult data={lastInitializeResult} />
    </div>
  );
}