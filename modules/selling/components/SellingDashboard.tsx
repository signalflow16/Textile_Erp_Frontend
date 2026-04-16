"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReloadOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Col, Row, Space, Statistic, Table, Typography } from "antd";

import { DocumentStatusBadge } from "@/modules/buying/components/DocumentStatusBadge";
import { useSellingDashboard } from "@/modules/selling/hooks/useSellingDashboard";
import { SellingSummaryCards } from "@/modules/selling/components/SellingSummaryCards";
import { toSellingErrorMessage } from "@/modules/selling/utils/errorMapper";

const { Text } = Typography;

const shortcuts = [
  { label: "New Quotation", href: "/selling/quotations/new" },
  { label: "New Sales Order", href: "/selling/sales-orders/new" },
  { label: "New Delivery Note", href: "/selling/delivery-notes/new" },
  { label: "Open POS", href: "/pos" }
];

const routeForDocType = (doctype: string, name: string) => {
  if (doctype === "Quotation") {
    return `/selling/quotations/${encodeURIComponent(name)}`;
  }

  if (doctype === "Sales Order") {
    return `/selling/sales-orders/${encodeURIComponent(name)}`;
  }

  return `/selling/delivery-notes/${encodeURIComponent(name)}`;
};

export function SellingDashboard() {
  const router = useRouter();
  const query = useSellingDashboard();
  const data = query.data ?? null;

  return (
    <div className="page-stack">
      <Card
        title="Selling Dashboard"
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => query.refetch()} loading={query.isFetching}>
            Refresh
          </Button>
        }
      >
        <Text type="secondary">
          Track customer proposals, confirmed orders, and delivery execution with ERPNext selling stages.
        </Text>
      </Card>

      {query.error ? (
        <Alert type="error" showIcon message="Unable to load selling dashboard" description={toSellingErrorMessage(query.error, "Request failed.")} />
      ) : null}

      <SellingSummaryCards summary={data} />

      <Row gutter={[12, 12]}>
        <Col xs={24} md={8}>
          <Card title="Quotations">
            <Statistic title="Ready for follow-up" value={data?.submitted_quotations ?? 0} />
            <Text type="secondary">Drafts can be revised; submitted quotations represent active customer proposals.</Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="Sales Orders">
            <Statistic title="Confirmed orders" value={data?.submitted_sales_orders ?? 0} />
            <Text type="secondary">Sales Orders indicate accepted customer demand waiting for delivery execution.</Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="Delivery Activity">
            <Statistic title="Delivery documents" value={(data?.draft_delivery_notes ?? 0) + (data?.submitted_delivery_notes ?? 0)} />
            <Text type="secondary">Delivery Notes capture stock-out and dispatch activity for confirmed orders.</Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[12, 12]}>
        <Col xs={24} lg={16}>
          <Card title="Recent Documents">
            <Table
              rowKey={(record) => `${record.doctype}-${record.name}`}
              loading={query.isFetching}
              pagination={{ pageSize: 6 }}
              dataSource={data?.recent_documents ?? []}
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
                  title: "Customer",
                  dataIndex: "customer",
                  key: "customer"
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
