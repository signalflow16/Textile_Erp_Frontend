"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Alert,
  Button,
  Col,
  List,
  Row,
  Space,
  Tag,
  Typography
} from "antd";
import {
  AlertOutlined,
  ArrowRightOutlined,
  DatabaseOutlined,
  ShopOutlined,
  WalletOutlined
} from "@ant-design/icons";

import { fetchDashboardData, selectStockDashboard, selectStockState } from "@/modules/stock/store/stockSlice";
import { useAppDispatch, useAppSelector } from "@/core/store/hooks";
import type { ItemShortageRow, MonthlyTrendPoint } from "@/modules/stock/types";
import { ChartCard } from "./chart-card";
import { DashboardCard } from "./dashboard-card";
import { WarehouseStockTrendChart } from "./warehouse-stock-trend-chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis
} from "recharts";

const { Text } = Typography;

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

const compactNumberFormatter = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 1
});

const chartEmptyText = "No data available yet. Data will appear once transactions are recorded.";

const formatCompactNumber = (value: number) => compactNumberFormatter.format(value || 0);

function TrendChart({
  data,
  tone,
  formatter
}: {
  data: MonthlyTrendPoint[];
  tone: "blue" | "green";
  formatter: (value: number) => string;
}) {
  const stroke = tone === "blue" ? "#1677ff" : "#52c41a";

  return (
    <div className="stock-trend-chart-shell">
      <div className="stock-trend-chart-canvas">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 10, left: -18, bottom: 8 }}>
            <CartesianGrid stroke="#e8edf5" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "#64748b" }}
              tickFormatter={formatter}
              width={74}
            />
            <RechartsTooltip
              formatter={(value: unknown) => formatter(Number(value ?? 0))}
              contentStyle={{ borderRadius: 10, border: "1px solid #e5ebf3" }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={stroke}
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
              strokeLinecap="round"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function PurchaseTrendBarChart({
  data,
  formatter
}: {
  data: MonthlyTrendPoint[];
  formatter: (value: number) => string;
}) {
  return (
    <div className="stock-trend-chart-shell">
      <div className="stock-trend-chart-canvas">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -18, bottom: 8 }}>
            <CartesianGrid stroke="#e8edf5" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "#64748b" }}
              tickFormatter={formatter}
              width={74}
            />
            <RechartsTooltip
              formatter={(value: unknown) => formatter(Number(value ?? 0))}
              contentStyle={{ borderRadius: 10, border: "1px solid #e5ebf3" }}
            />
            <Bar dataKey="value" fill="#52c41a" radius={[6, 6, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ShortageList({ rows }: { rows: ItemShortageRow[] }) {
  return (
    <List
      className="stock-detail-list"
      dataSource={rows}
      renderItem={(row) => (
        <List.Item className="stock-detail-list-item">
          <div className="stock-detail-list-copy">
            <Text strong>{row.itemCode}</Text>
            <Text type="secondary">{row.warehouse}</Text>
          </div>
          <Tag color={row.actualQty <= 0 ? "error" : "warning"} bordered={false}>
            {row.actualQty <= 0 ? "Critical" : `Qty ${row.actualQty}`}
          </Tag>
        </List.Item>
      )}
    />
  );
}

function ActivityList({
  rows
}: {
  rows: Array<{ name: string; itemCode: string; warehouse?: string | null; postingDate?: string | null; actualQty?: number }>;
}) {
  return (
    <List
      className="stock-detail-list"
      dataSource={rows}
      renderItem={(entry) => (
        <List.Item className="stock-detail-list-item">
          <div className="stock-detail-list-copy">
            <Text strong>{entry.itemCode}</Text>
            <Text type="secondary">
              {entry.warehouse || "Unknown Warehouse"} | {entry.postingDate || "Unknown date"}
            </Text>
          </div>
          <Tag bordered={false} color="blue">
            {entry.actualQty ?? 0}
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
  const lastVersionRef = useRef(stockState.stockDataVersion);

  useEffect(() => {
    if (stockState.dashboardStatus === "idle") {
      void dispatch(fetchDashboardData());
    }
  }, [dispatch, stockState.dashboardStatus]);

  useEffect(() => {
    if (stockState.stockDataVersion === lastVersionRef.current) {
      return;
    }

    lastVersionRef.current = stockState.stockDataVersion;
    void dispatch(fetchDashboardData());
  }, [dispatch, stockState.stockDataVersion]);

  const summary = dashboard?.summary;
  const shortageCount = dashboard?.shortageItems.length ?? 0;
  const isInitialLoading = stockState.dashboardStatus === "loading" && !dashboard;
  const isRefreshing = stockState.dashboardStatus === "loading" && Boolean(dashboard);

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

  return (
    <div className="page-stack stock-dashboard-page">
      <div className="stock-dashboard-toolbar">
        <div className="stock-dashboard-toolbar-copy">
          <Text className="item-toolbar-title">Stock Overview</Text>
          <Text className="item-toolbar-subtitle">
            Monitor inventory position, warehouse exposure, inbound and outbound trends, and shortage pressure from live ERP records.
          </Text>
        </div>
        {headerActions}
      </div>

      {stockState.dashboardError ? <Alert type="error" showIcon message={stockState.dashboardError} /> : null}

      <Row gutter={[16, 16]} className="stock-dashboard-stats-row">
        <Col xs={24} sm={12} xl={6}>
          <DashboardCard
            title="Total Active Items"
            value={summary?.activeItems ?? 0}
            helper="Active stock masters"
            icon={<DatabaseOutlined />}
            accentClassName="stock-dashboard-card-blue"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <DashboardCard
            title="Total Warehouses"
            value={summary?.warehouses ?? 0}
            helper="Warehouses in stock scope"
            icon={<ShopOutlined />}
            accentClassName="stock-dashboard-card-cyan"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <DashboardCard
            title="Total Stock Value"
            value={currencyFormatter.format(summary?.totalStockValue ?? 0)}
            helper="Live bin valuation snapshot"
            icon={<WalletOutlined />}
            accentClassName="stock-dashboard-card-green"
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <DashboardCard
            title="Low Stock Alerts"
            value={shortageCount}
            helper="Items below threshold"
            icon={<AlertOutlined />}
            accentClassName="stock-dashboard-card-gold"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <ChartCard
            title="Warehouse Stock Value Trend"
            subtitle="Daily stock valuation trend from stock ledger activity"
            loading={isInitialLoading || isRefreshing}
            empty={!dashboard?.warehouseStockTrend.length}
            emptyText={chartEmptyText}
          >
            <WarehouseStockTrendChart rows={dashboard?.warehouseStockTrend ?? []} />
          </ChartCard>
        </Col>
        <Col xs={24} xl={10}>
          <ChartCard
            title="Item Shortage Summary"
            subtitle="Items currently below the shortage threshold"
            loading={isInitialLoading || isRefreshing}
            empty={!dashboard?.shortageItems.length}
            emptyText={chartEmptyText}
          >
            <ShortageList rows={dashboard?.shortageItems ?? []} />
          </ChartCard>
        </Col>
        <Col xs={24} lg={12}>
          <ChartCard
            title="Purchase Trends"
            status={dashboard?.moduleStatus.purchaseReceipts === "partial" ? "warning" : "processing"}
            statusText={dashboard?.moduleStatus.purchaseReceipts === "partial" ? "Unavailable" : "Live"}
            loading={isInitialLoading || isRefreshing}
            empty={!dashboard?.purchaseReceiptTrends.length}
            emptyText={chartEmptyText}
            extra={<Text type="secondary">Monthly inbound value</Text>}
          >
            <PurchaseTrendBarChart
              data={dashboard?.purchaseReceiptTrends ?? []}
              formatter={(value) => formatCompactNumber(value)}
            />
          </ChartCard>
        </Col>
        <Col xs={24} lg={12}>
          <ChartCard
            title="Delivery Trends"
            status={dashboard?.moduleStatus.deliveryNotes === "partial" ? "warning" : "processing"}
            statusText={dashboard?.moduleStatus.deliveryNotes === "partial" ? "Unavailable" : "Live"}
            loading={isInitialLoading || isRefreshing}
            empty={!dashboard?.deliveryTrends.length}
            emptyText={chartEmptyText}
            extra={<Text type="secondary">Monthly outbound value</Text>}
          >
            <TrendChart
              data={dashboard?.deliveryTrends ?? []}
              tone="blue"
              formatter={(value) => formatCompactNumber(value)}
            />
          </ChartCard>
        </Col>
        <Col xs={24}>
          <ChartCard
            title="Oldest Stock Activity"
            subtitle="Earliest available stock ledger movements"
            loading={isInitialLoading || isRefreshing}
            empty={!dashboard?.oldestItems.length}
            emptyText={chartEmptyText}
          >
            <ActivityList rows={dashboard?.oldestItems ?? []} />
          </ChartCard>
        </Col>
      </Row>
    </div>
  );
}

