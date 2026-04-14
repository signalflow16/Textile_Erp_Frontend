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

import { ChartCard } from "@/components/stock/chart-card";
import { DashboardCard } from "@/components/stock/dashboard-card";
import { WarehouseStockTrendChart } from "@/components/stock/warehouse-stock-trend-chart";
import { fetchDashboardData, selectStockDashboard, selectStockState } from "@/store/slices/stockSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { ItemShortageRow, MonthlyTrendPoint } from "@/types/stock";

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

const buildLinePath = (points: number[], width: number, height: number) => {
  if (points.length === 0) {
    return "";
  }

  const maxValue = Math.max(...points, 0);
  const safeMax = maxValue > 0 ? maxValue : 1;
  const stepX = points.length > 1 ? width / (points.length - 1) : width;

  return points
    .map((point, index) => {
      const x = index * stepX;
      const y = height - (point / safeMax) * (height - 24) - 12;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
};

const buildAreaPath = (points: number[], width: number, height: number) => {
  if (points.length === 0) {
    return "";
  }

  const line = buildLinePath(points, width, height);
  return `${line} L ${width} ${height} L 0 ${height} Z`;
};

function TrendChart({
  data,
  tone,
  formatter
}: {
  data: MonthlyTrendPoint[];
  tone: "blue" | "green";
  formatter: (value: number) => string;
}) {
  const width = 620;
  const height = 210;
  const values = data.map((entry) => entry.value);
  const linePath = buildLinePath(values, width, height);
  const areaPath = buildAreaPath(values, width, height);
  const stroke = tone === "blue" ? "#1677ff" : "#52c41a";
  const fill = tone === "blue" ? "url(#stockAreaBlue)" : "url(#stockAreaGreen)";

  return (
    <div className="stock-trend-chart-shell">
      <div className="stock-trend-chart-canvas">
        <svg viewBox={`0 0 ${width} ${height}`} className="stock-trend-chart-svg" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="stockAreaBlue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#69b1ff" stopOpacity="0.42" />
              <stop offset="100%" stopColor="#e6f4ff" stopOpacity="0.04" />
            </linearGradient>
            <linearGradient id="stockAreaGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#95de64" stopOpacity="0.38" />
              <stop offset="100%" stopColor="#f6ffed" stopOpacity="0.04" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={fill} />
          <path d={linePath} fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="stock-trend-chart-footer">
        {data.slice(-6).map((entry) => (
          <div key={entry.month} className="stock-trend-chart-point">
            <Text className="stock-trend-chart-month">{entry.month}</Text>
            <Text strong>{formatter(entry.value)}</Text>
          </div>
        ))}
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
            <TrendChart
              data={dashboard?.purchaseReceiptTrends ?? []}
              tone="green"
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
