"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Alert, Button, Col, List, Row, Space, Tag, Typography } from "antd";
import {
  ApartmentOutlined,
  FileDoneOutlined,
  FileSyncOutlined,
  ReloadOutlined,
  ShoppingCartOutlined
} from "@ant-design/icons";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis
} from "recharts";

import {
  useBuyingDashboard,
  useListPurchaseInvoicesQuery,
  useListPurchaseOrdersQuery,
  useListPurchaseReceiptsQuery
} from "@/modules/buying/hooks/useBuyingDashboard";
import { DocumentStatusBadge } from "@/modules/buying/components/DocumentStatusBadge";
import { toBuyingErrorMessage } from "@/modules/buying/utils/errorMapper";
import { ChartCard } from "@/modules/stock/components/chart-card";
import { DashboardCard } from "@/modules/stock/components/dashboard-card";

const { Text } = Typography;

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
  const orderQuery = useListPurchaseOrdersQuery({ page: 1, pageSize: 200, status: "all", sortBy: "modified_desc" });
  const receiptQuery = useListPurchaseReceiptsQuery({ page: 1, pageSize: 200, status: "all", sortBy: "modified_desc" });
  const invoiceQuery = useListPurchaseInvoicesQuery({ page: 1, pageSize: 200, status: "all", sortBy: "modified_desc" });

  const dashboard = query.data ?? null;
  const pendingUpstream =
    (dashboard?.pending_material_requests ?? 0) +
    (dashboard?.pending_rfqs ?? 0) +
    (dashboard?.pending_supplier_quotations ?? 0);
  const pendingExecution = (dashboard?.pending_purchase_orders ?? 0) + (dashboard?.pending_purchase_receipts ?? 0);
  const pendingFinance = dashboard?.pending_purchase_invoices ?? 0;

  const totalOpenPoValue = useMemo(
    () =>
      (orderQuery.data?.data ?? [])
        .filter((row) => row.docstatus === 0)
        .reduce((sum, row) => sum + Number(row.grand_total ?? 0), 0),
    [orderQuery.data]
  );

  const totalOutstandingPayables = useMemo(
    () =>
      (invoiceQuery.data?.data ?? [])
        .filter((row) => row.docstatus === 1)
        .reduce((sum, row) => sum + Number(row.outstanding_amount ?? 0), 0),
    [invoiceQuery.data]
  );

  const pendingReceiptValue = useMemo(
    () =>
      (orderQuery.data?.data ?? [])
        .filter((row) => row.docstatus === 1)
        .filter((row) => !["Completed", "Closed"].includes(String(row.status ?? "")))
        .reduce((sum, row) => sum + Number(row.grand_total ?? 0), 0),
    [orderQuery.data]
  );

  const documentStageData = useMemo(
    () => [
      { stage: "MR", count: dashboard?.pending_material_requests ?? 0 },
      { stage: "RFQ", count: dashboard?.pending_rfqs ?? 0 },
      { stage: "Quotation", count: dashboard?.pending_supplier_quotations ?? 0 },
      { stage: "PO", count: dashboard?.pending_purchase_orders ?? 0 },
      { stage: "Receipt", count: dashboard?.pending_purchase_receipts ?? 0 },
      { stage: "Invoice", count: dashboard?.pending_purchase_invoices ?? 0 }
    ],
    [dashboard]
  );

  const supplierExposure = useMemo(() => {
    const grouped = new Map<string, { supplier: string; poCount: number; value: number }>();
    for (const row of orderQuery.data?.data ?? []) {
      if (!row.supplier) {
        continue;
      }
      const current = grouped.get(row.supplier) ?? { supplier: row.supplier, poCount: 0, value: 0 };
      current.poCount += 1;
      current.value += Number(row.grand_total ?? 0);
      grouped.set(row.supplier, current);
    }
    return Array.from(grouped.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [orderQuery.data]);

  const monthlySpendData = useMemo(() => {
    const monthBuckets = new Map<string, { month: string; value: number }>();
    for (const row of receiptQuery.data?.data ?? []) {
      const postingDate = typeof row.posting_date === "string" ? row.posting_date : null;
      if (!postingDate) {
        continue;
      }
      const month = postingDate.slice(0, 7);
      const current = monthBuckets.get(month) ?? { month, value: 0 };
      current.value += Number(row.grand_total ?? 0);
      monthBuckets.set(month, current);
    }
    return Array.from(monthBuckets.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6)
      .map((entry) => ({
        month: entry.month,
        value: entry.value
      }));
  }, [receiptQuery.data]);

  const overdueDeliveries = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return (orderQuery.data?.data ?? [])
      .filter((row) => row.docstatus === 1)
      .filter((row) => !["Completed", "Closed", "Cancelled"].includes(String(row.status ?? "")))
      .filter((row) => typeof row.schedule_date === "string" && row.schedule_date < today)
      .sort((a, b) => String(a.schedule_date ?? "").localeCompare(String(b.schedule_date ?? "")))
      .slice(0, 8);
  }, [orderQuery.data]);

  const recentDocs = dashboard?.recent_documents ?? [];
  const dashboardLoading = query.isFetching || orderQuery.isFetching || receiptQuery.isFetching || invoiceQuery.isFetching;
  const hasError = query.error || orderQuery.error || receiptQuery.error || invoiceQuery.error;

  const currencyCompact = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    notation: "compact"
  });

  return (
    <div className="page-stack stock-dashboard-page">
      <div className="stock-dashboard-toolbar">
        <div className="stock-dashboard-toolbar-copy">
          <Text className="item-toolbar-title">Buying Overview</Text>
          <Text className="item-toolbar-subtitle">
            Track procurement bottlenecks, open commitments, supplier concentration, and pending payables from live buying documents.
          </Text>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={() => query.refetch()} loading={query.isFetching}>
            Refresh
          </Button>
          <Button type="primary">
            <Link href="/buying/purchase-orders/new">New Purchase Order</Link>
          </Button>
        </Space>
      </div>

      {hasError ? (
        <Alert
          type="error"
          showIcon
          message="Unable to load buying dashboard"
          description={toBuyingErrorMessage(query.error ?? orderQuery.error ?? receiptQuery.error ?? invoiceQuery.error, "Request failed.")}
        />
      ) : null}

      <Row gutter={[16, 16]} className="stock-dashboard-stats-row">
        <Col xs={24} sm={12} xl={6}>
          <DashboardCard
            title="Upstream Backlog"
            value={pendingUpstream}
            helper="MR + RFQ + Supplier Quotation"
            icon={<ApartmentOutlined />}
            accentClassName="stock-dashboard-card-blue"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <DashboardCard
            title="Execution Queue"
            value={pendingExecution}
            helper="Pending PO + Purchase Receipts"
            icon={<ShoppingCartOutlined />}
            accentClassName="stock-dashboard-card-cyan"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <DashboardCard
            title="Pending Receipt Value"
            value={currencyCompact.format(pendingReceiptValue)}
            helper={`Open PO value: ${currencyCompact.format(totalOpenPoValue)}`}
            icon={<FileSyncOutlined />}
            accentClassName="stock-dashboard-card-green"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <DashboardCard
            title="Outstanding Payables"
            value={currencyCompact.format(totalOutstandingPayables)}
            helper={`Pending invoices: ${pendingFinance}`}
            icon={<FileDoneOutlined />}
            accentClassName="stock-dashboard-card-gold"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <ChartCard
            title="Buying Pipeline Queue"
            subtitle="Pending document count by procurement stage"
            loading={dashboardLoading}
            empty={!documentStageData.some((row) => row.count > 0)}
          >
            <div className="stock-trend-chart-shell">
              <div className="stock-trend-chart-canvas">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={documentStageData} margin={{ top: 10, right: 10, left: -18, bottom: 8 }}>
                    <CartesianGrid stroke="#e8edf5" strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="stage" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} width={56} />
                    <RechartsTooltip contentStyle={{ borderRadius: 10, border: "1px solid #e5ebf3" }} />
                    <Bar dataKey="count" fill="#1677ff" radius={[6, 6, 0, 0]} maxBarSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ChartCard>
        </Col>
        <Col xs={24} lg={12}>
          <ChartCard
            title="Monthly Procurement Spend"
            subtitle="Last 6 months purchase receipt value"
            loading={dashboardLoading}
            empty={!monthlySpendData.length}
          >
            <div className="stock-trend-chart-shell">
              <div className="stock-trend-chart-canvas">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlySpendData} margin={{ top: 10, right: 10, left: -18, bottom: 8 }}>
                    <CartesianGrid stroke="#e8edf5" strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      width={74}
                      tickFormatter={(value) => currencyCompact.format(Number(value))}
                    />
                    <RechartsTooltip
                      formatter={(value: unknown) => currencyCompact.format(Number(value ?? 0))}
                      contentStyle={{ borderRadius: 10, border: "1px solid #e5ebf3" }}
                    />
                    <Bar dataKey="value" fill="#52c41a" radius={[6, 6, 0, 0]} maxBarSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ChartCard>
        </Col>
        <Col xs={24} lg={12}>
          <ChartCard
            title="Overdue Deliveries"
            subtitle="Purchase Orders past schedule date"
            loading={dashboardLoading}
            empty={!overdueDeliveries.length}
          >
            <List
              className="stock-detail-list"
              dataSource={overdueDeliveries}
              renderItem={(row) => (
                <List.Item className="stock-detail-list-item">
                  <div className="stock-detail-list-copy">
                    <Text strong>{row.name}</Text>
                    <Text type="secondary">
                      {row.supplier ? `${row.supplier} | ` : ""}
                      Due {String(row.schedule_date ?? "-")}
                    </Text>
                  </div>
                  <Tag color="error" bordered={false}>
                    Overdue
                  </Tag>
                </List.Item>
              )}
            />
          </ChartCard>
        </Col>
        <Col xs={24}>
          <ChartCard
            title="Top Supplier Exposure"
            subtitle="Suppliers with highest recent PO value"
            loading={dashboardLoading}
            empty={!supplierExposure.length}
          >
            <List
              className="stock-detail-list"
              dataSource={supplierExposure}
              renderItem={(row) => (
                <List.Item className="stock-detail-list-item">
                  <div className="stock-detail-list-copy">
                    <Text strong>{row.supplier}</Text>
                    <Text type="secondary">{row.poCount} purchase orders</Text>
                  </div>
                  <Tag color="blue" bordered={false}>
                    {currencyCompact.format(row.value)}
                  </Tag>
                </List.Item>
              )}
            />
          </ChartCard>
        </Col>
        <Col xs={24}>
          <ChartCard
            title="Latest Actionable Documents"
            subtitle="Most recent procurement records requiring follow-up"
            loading={query.isFetching}
            empty={!recentDocs.length}
          >
            <List
              className="stock-detail-list"
              dataSource={recentDocs}
              renderItem={(record) => (
                <List.Item
                  className="stock-detail-list-item"
                  actions={[
                    <Button key="open" type="link" onClick={() => router.push(routeForDocType(record.doctype, record.name))}>
                      Open
                    </Button>
                  ]}
                >
                  <div className="stock-detail-list-copy">
                    <Text strong>{record.name}</Text>
                    <Text type="secondary">
                      {record.doctype} {record.supplier ? `| ${record.supplier}` : ""} {record.company ? `| ${record.company}` : ""}
                    </Text>
                  </div>
                  <DocumentStatusBadge status={record.status} docstatus={record.docstatus} />
                </List.Item>
              )}
            />
          </ChartCard>
        </Col>
      </Row>
    </div>
  );
}
