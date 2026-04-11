"use client";

import { Card, Col, Row, Statistic } from "antd";

import type { MasterCountsData } from "@/modules/initial-setup/types/initialSetup";

const toNumber = (value: unknown) => (typeof value === "number" ? value : 0);

export function MasterCountsCard({ counts }: { counts: MasterCountsData | null }) {
  const data = counts ?? {};

  return (
    <Card title="Master Counts">
      <Row gutter={[12, 12]}>
        <Col xs={12} sm={8} md={8} lg={4}>
          <Statistic title="Companies" value={toNumber(data.company_count)} />
        </Col>
        <Col xs={12} sm={8} md={8} lg={4}>
          <Statistic title="Warehouses" value={toNumber(data.warehouse_count)} />
        </Col>
        <Col xs={12} sm={8} md={8} lg={4}>
          <Statistic title="UOMs" value={toNumber(data.uom_count)} />
        </Col>
        <Col xs={12} sm={8} md={8} lg={4}>
          <Statistic title="Item Groups" value={toNumber(data.item_group_count)} />
        </Col>
        <Col xs={12} sm={8} md={8} lg={4}>
          <Statistic title="Suppliers" value={toNumber(data.supplier_count)} />
        </Col>
        <Col xs={12} sm={8} md={8} lg={4}>
          <Statistic title="Customers" value={toNumber(data.customer_count)} />
        </Col>
      </Row>
    </Card>
  );
}