"use client";

import { PrinterOutlined } from "@ant-design/icons";
import { Button, Space, Tag, Typography } from "antd";

import { SaveDraftButton } from "@/modules/buying/components/common/SaveDraftButton";

const { Text, Title } = Typography;

export function PosHeader({
  isSaving,
  isSubmitting,
  currentBillName,
  currentBillStatus,
  onSaveDraft,
  onSavePrint
}: {
  isSaving: boolean;
  isSubmitting: boolean;
  currentBillName?: string | null;
  currentBillStatus?: string;
  onSaveDraft: () => void;
  onSavePrint: () => void;
}) {
  return (
    <div className="pos-header">
      <div>
        <Title level={4} style={{ marginBottom: 4 }}>
          Point of Sale
        </Title>
        <Text type="secondary">Create ERPNext POS bills for walk-in or registered customers.</Text>
        {currentBillName ? (
          <div style={{ marginTop: 8 }}>
            <Tag color={currentBillStatus === "Submitted" ? "green" : "gold"}>
              {currentBillStatus}: {currentBillName}
            </Tag>
          </div>
        ) : null}
      </div>
      <Space>
        <SaveDraftButton loading={isSaving} disabled={isSubmitting} onClick={onSaveDraft} />
        <Button
          type="primary"
          icon={<PrinterOutlined />}
          loading={isSubmitting}
          disabled={isSaving}
          onClick={onSavePrint}
        >
          Save & Print
        </Button>
      </Space>
    </div>
  );
}
