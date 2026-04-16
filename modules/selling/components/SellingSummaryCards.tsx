"use client";

import { Card, Col, Row, Statistic } from "antd";

import type { SellingDashboardSummary } from "@/modules/selling/types/selling";

export function SellingSummaryCards({ summary }: { summary: SellingDashboardSummary | null }) {
  const data = summary ?? {
    draft_quotations: 0,
    submitted_quotations: 0,
    draft_sales_orders: 0,
    submitted_sales_orders: 0,
    draft_delivery_notes: 0,
    submitted_delivery_notes: 0,
    recent_documents: []
  };

  return (
    <Card title="Sales Pipeline">
      <Row gutter={[12, 12]}>
        <Col xs={12} md={8} lg={4}><Statistic title="Draft Quotations" value={data.draft_quotations} /></Col>
        <Col xs={12} md={8} lg={4}><Statistic title="Submitted Quotations" value={data.submitted_quotations} /></Col>
        <Col xs={12} md={8} lg={4}><Statistic title="Draft Sales Orders" value={data.draft_sales_orders} /></Col>
        <Col xs={12} md={8} lg={4}><Statistic title="Submitted Sales Orders" value={data.submitted_sales_orders} /></Col>
        <Col xs={12} md={8} lg={4}><Statistic title="Draft Delivery Notes" value={data.draft_delivery_notes} /></Col>
        <Col xs={12} md={8} lg={4}><Statistic title="Submitted Delivery Notes" value={data.submitted_delivery_notes} /></Col>
      </Row>
    </Card>
  );
}
