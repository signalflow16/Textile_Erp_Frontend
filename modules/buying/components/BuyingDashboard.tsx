"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, Button, Card, Col, Row, Space, Table, Typography } from "antd";
import { ReloadOutlined } from "@ant-design/icons";

import { useBuyingDashboard } from "@/modules/buying/hooks/useBuyingDashboard";
import { BuyingFlowGuide } from "@/modules/buying/components/BuyingFlowGuide";
import { BuyingSummaryCards } from "@/modules/buying/components/BuyingSummaryCards";
import { DocumentStatusBadge } from "@/modules/buying/components/DocumentStatusBadge";
import { toBuyingErrorMessage } from "@/modules/buying/utils/errorMapper";

const { Text } = Typography;

const shortcuts = [
  { label: "New Material Request", href: "/buying/material-requests/new" },
  { label: "New RFQ", href: "/buying/rfqs/new" },
  { label: "New Supplier Quotation", href: "/buying/supplier-quotations/new" },
  { label: "New Purchase Order", href: "/buying/purchase-orders/new" },
  { label: "New Purchase Receipt", href: "/buying/purchase-receipts/new" },
  { label: "New Purchase Invoice", href: "/buying/purchase-invoices/new" }
];

const routeForDocType = (doctype: string, name: string) => {
  if (doctype === "Material Request") {
    return `/buying/material-requests/${encodeURIComponent(name)}`;
  }

  if (doctype === "Request for Quotation") {
    return `/buying/rfqs/${encodeURIComponent(name)}`;
  }

  if (doctype === "Supplier Quotation") {
    return `/buying/supplier-quotations/${encodeURIComponent(name)}`;
  }

  if (doctype === "Purchase Order") {
    return `/buying/purchase-orders/${encodeURIComponent(name)}`;
  }

  if (doctype === "Purchase Receipt") {
    return `/buying/purchase-receipts/${encodeURIComponent(name)}`;
  }

  return `/buying/purchase-invoices/${encodeURIComponent(name)}`;
};

export function BuyingDashboard() {
  const router = useRouter();
  const query = useBuyingDashboard();

  return (
    <div className="page-stack">
      <Card
        title="Buying Dashboard"
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => query.refetch()} loading={query.isFetching}>
            Refresh
          </Button>
        }
      >
        <Text type="secondary">
          Manage textile procurement from demand planning to stock receipt and supplier billing.
        </Text>
      </Card>

      {query.error ? (
        <Alert type="error" showIcon message="Unable to load buying dashboard" description={toBuyingErrorMessage(query.error, "Request failed.")} />
      ) : null}

      <BuyingSummaryCards summary={query.data ?? null} />
      <BuyingFlowGuide />

      <Row gutter={[12, 12]}>
        <Col xs={24} lg={16}>
          <Card title="Recent Documents">
            <Table
              rowKey={(record) => `${record.doctype}-${record.name}`}
              loading={query.isFetching}
              pagination={{ pageSize: 6 }}
              dataSource={query.data?.recent_documents ?? []}
              columns={[
                {
                  title: "Document",
                  key: "document",
                  render: (_, record) => <Link href={routeForDocType(record.doctype, record.name)}>{record.name}</Link>
                },
                {
                  title: "Type",
                  dataIndex: "doctype",
                  key: "doctype"
                },
                {
                  title: "Company",
                  dataIndex: "company",
                  key: "company"
                },
                {
                  title: "Status",
                  key: "status",
                  render: (_, record) => <DocumentStatusBadge status={record.status} docstatus={record.docstatus} />
                },
                {
                  title: "Updated",
                  dataIndex: "modified",
                  key: "modified"
                }
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Quick Actions">
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              {shortcuts.map((shortcut) => (
                <Button key={shortcut.href} block onClick={() => router.push(shortcut.href)}>
                  {shortcut.label}
                </Button>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
