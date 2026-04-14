"use client";

import { Card, Steps, Typography } from "antd";

const { Text } = Typography;

export function BuyingFlowGuide() {
  return (
    <Card title="Buying Flow">
      <Steps
        size="small"
        current={-1}
        items={[
          { title: "Material Request", description: "Demand planning" },
          { title: "RFQ", description: "Quotation request" },
          { title: "Supplier Quotation", description: "Vendor offer" },
          { title: "Purchase Order", description: "Confirmed procurement" },
          { title: "Purchase Receipt", description: "Stock-in" },
          { title: "Purchase Invoice", description: "Supplier liability" }
        ]}
      />
      <Text type="secondary" style={{ marginTop: 10, display: "block" }}>
        Planning documents (MR/RFQ/Supplier Quotation) do not change stock. Purchase Receipt updates stock, and Purchase Invoice records payable.
      </Text>
    </Card>
  );
}
