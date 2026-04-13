"use client";

import { Card, Col, Row, Statistic } from "antd";

import type { BuyingDashboardSummary } from "@/modules/buying/types/buying";

export function BuyingSummaryCards({ summary }: { summary: BuyingDashboardSummary | null }) {
  const data = summary ?? {
    pending_material_requests: 0,
    pending_rfqs: 0,
    pending_supplier_quotations: 0,
    pending_purchase_orders: 0,
    pending_purchase_receipts: 0,
    pending_purchase_invoices: 0,
    recent_documents: []
  };

  return (
    <Card title="Pending Documents">
      <Row gutter={[12, 12]}>
        <Col xs={12} md={8} lg={4}><Statistic title="Material Requests" value={data.pending_material_requests} /></Col>
        <Col xs={12} md={8} lg={4}><Statistic title="RFQs" value={data.pending_rfqs} /></Col>
        <Col xs={12} md={8} lg={4}><Statistic title="Supplier Quotations" value={data.pending_supplier_quotations} /></Col>
        <Col xs={12} md={8} lg={4}><Statistic title="Purchase Orders" value={data.pending_purchase_orders} /></Col>
        <Col xs={12} md={8} lg={4}><Statistic title="Purchase Receipts" value={data.pending_purchase_receipts} /></Col>
        <Col xs={12} md={8} lg={4}><Statistic title="Purchase Invoices" value={data.pending_purchase_invoices} /></Col>
      </Row>
    </Card>
  );
}
