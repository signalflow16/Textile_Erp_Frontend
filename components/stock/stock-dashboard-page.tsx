"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { Alert, Button, Col, List, Row, Skeleton, Space, Tag, Typography } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";

import { ChartCard } from "@/components/stock/chart-card";
import { DashboardCard } from "@/components/stock/dashboard-card";
import { fetchDashboardData, selectStockDashboard, selectStockState } from "@/store/slices/stockSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { ItemShortageRow, MonthlyTrendPoint, WarehouseStockPoint } from "@/types/stock";

const { Text } = Typography;

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

function SimpleBarChart({
  data,
  getLabel,
  getValue,
  formatValue,
  emptyLabel
}: {
  data: WarehouseStockPoint[] | MonthlyTrendPoint[];
  getLabel: (entry: WarehouseStockPoint | MonthlyTrendPoint) => string;
  getValue: (entry: WarehouseStockPoint | MonthlyTrendPoint) => number;
  formatValue: (value: number) => string;
  emptyLabel: string;
}) {
  const maxValue = Math.max(...data.map((entry) => getValue(entry)), 0);

  if (data.length === 0) {
    return <div className="stock-chart-empty-copy">{emptyLabel}</div>;
  }

  return (
    <div className="stock-bar-chart">
      {data.map((entry) => {
        const value = getValue(entry);
        const label = getLabel(entry);
        const width = maxValue > 0 ? `${Math.max((value / maxValue) * 100, 8)}%` : "8%";

        return (
          <div key={`${label}-${value}`} className="stock-bar-row">
            <div className="stock-bar-row-head">
              <Text className="stock-bar-label" ellipsis>
                {label}
              </Text>
              <Text type="secondary">{formatValue(value)}</Text>
            </div>
            <div className="stock-bar-track">
              <div className="stock-bar-fill" style={{ width }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ShortageList({ rows }: { rows: ItemShortageRow[] }) {
  if (rows.length === 0) {
    return <div className="stock-chart-empty-copy">No shortages detected in current bin records.</div>;
  }

  return (
    <List
      dataSource={rows}
      renderItem={(row) => (
        <List.Item className="stock-detail-list-item">
          <div>
            <Text strong>{row.itemCode}</Text>
            <div>
              <Text type="secondary">{row.warehouse}</Text>
            </div>
          </div>
          <Tag color={row.actualQty < 0 ? "error" : "warning"} bordered={false}>
            {row.actualQty}
          </Tag>
        </List.Item>
      )}
    />
  );
}

export function StockDashboardPage() {
  const dispatch = useAppDispatch();
  const dashboard = useAppSelector(selectStockDashboard);
  const stockState = useAppSelector(selectStockState);

  useEffect(() => {
    if (stockState.dashboardStatus === "idle") {
      void dispatch(fetchDashboardData());
    }
  }, [dispatch, stockState.dashboardStatus]);

  const summary = dashboard?.summary;

  const headerActions = useMemo(
    () => (
      <Space wrap>
        <Button type="default">
          <Link href="/stock/stock-entry/list">View Stock Entries</Link>
        </Button>
        <Button type="primary" icon={<ArrowRightOutlined />}>
          <Link href="/stock/stock-entry/create">Create Stock Entry</Link>
        </Button>
      </Space>
    ),
    []
  );

  if (stockState.dashboardStatus === "loading" && !dashboard) {
    return <Skeleton active paragraph={{ rows: 12 }} />;
  }

  return (
    <div className="page-stack">
      <div className="stock-dashboard-toolbar">
        <div>
          <Text className="item-toolbar-title">Stock Overview</Text>
          <Text className="item-toolbar-subtitle">
            Monitor warehouse value, inbound and outbound trends, and shortage risk from live ERP records.
          </Text>
        </div>
        {headerActions}
      </div>

      {stockState.dashboardError ? <Alert type="error" showIcon message={stockState.dashboardError} /> : null}

      <Row gutter={[18, 18]}>
        <Col xs={24} md={8}>
          <DashboardCard title="Total Active Items" value={summary?.activeItems ?? 0} helper="Active stock item masters" />
        </Col>
        <Col xs={24} md={8}>
          <DashboardCard title="Total Warehouses" value={summary?.warehouses ?? 0} helper="Warehouse records in Stock" />
        </Col>
        <Col xs={24} md={8}>
          <DashboardCard
            title="Total Stock Value"
            value={currencyFormatter.format(summary?.totalStockValue ?? 0)}
            helper="Aggregated from live bin values"
          />
        </Col>
      </Row>

      <Row gutter={[18, 18]}>
        <Col xs={24} xl={14}>
          <ChartCard title="Warehouse Wise Stock Value" subtitle="Top warehouses by stock value">
            <SimpleBarChart
              data={dashboard?.warehouseWiseStockValue ?? []}
              getLabel={(entry) => ("warehouse" in entry ? entry.warehouse : "")}
              getValue={(entry) => ("stockValue" in entry ? entry.stockValue : 0)}
              formatValue={(value) => currencyFormatter.format(value)}
              emptyLabel="No warehouse stock value data available."
            />
          </ChartCard>
        </Col>
        <Col xs={24} xl={10}>
          <ChartCard title="Item Shortage Summary" subtitle="Zero or negative actual quantity bins">
            <ShortageList rows={dashboard?.shortageItems ?? []} />
          </ChartCard>
        </Col>
        <Col xs={24} lg={12}>
          <ChartCard
            title="Purchase Receipt Trends"
            subtitle="Monthly inbound value"
            status={dashboard?.moduleStatus.purchaseReceipts === "partial" ? "warning" : "processing"}
            statusText={dashboard?.moduleStatus.purchaseReceipts === "partial" ? "Unavailable on site" : "Live"}
          >
            <SimpleBarChart
              data={dashboard?.purchaseReceiptTrends ?? []}
              getLabel={(entry) => ("month" in entry ? entry.month : "")}
              getValue={(entry) => ("value" in entry ? entry.value : 0)}
              formatValue={(value) => value.toFixed(0)}
              emptyLabel="Purchase receipt data is not available yet."
            />
          </ChartCard>
        </Col>
        <Col xs={24} lg={12}>
          <ChartCard
            title="Delivery Trends"
            subtitle="Monthly outbound value"
            status={dashboard?.moduleStatus.deliveryNotes === "partial" ? "warning" : "processing"}
            statusText={dashboard?.moduleStatus.deliveryNotes === "partial" ? "Unavailable on site" : "Live"}
          >
            <SimpleBarChart
              data={dashboard?.deliveryTrends ?? []}
              getLabel={(entry) => ("month" in entry ? entry.month : "")}
              getValue={(entry) => ("value" in entry ? entry.value : 0)}
              formatValue={(value) => value.toFixed(0)}
              emptyLabel="Delivery note data is not available yet."
            />
          </ChartCard>
        </Col>
        <Col xs={24}>
          <ChartCard title="Oldest Items" subtitle="Oldest stock ledger activity">
            <List
              dataSource={dashboard?.oldestItems ?? []}
              locale={{ emptyText: "No stock ledger history available." }}
              renderItem={(entry) => (
                <List.Item className="stock-detail-list-item">
                  <div>
                    <Text strong>{entry.itemCode}</Text>
                    <div>
                      <Text type="secondary">
                        {entry.warehouse || "Unknown Warehouse"} · {entry.postingDate || "Unknown date"}
                      </Text>
                    </div>
                  </div>
                  <Tag bordered={false}>{entry.actualQty ?? 0}</Tag>
                </List.Item>
              )}
            />
          </ChartCard>
        </Col>
      </Row>
    </div>
  );
}
