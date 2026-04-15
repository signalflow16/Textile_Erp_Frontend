"use client";

import { Typography } from "antd";

import { DocumentActionBar } from "@/modules/buying/components/common/DocumentActionBar";

const { Text, Title } = Typography;

export function PosHeader({
  isSaving,
  isSubmitting,
  onSaveDraft,
  onSaveSubmit
}: {
  isSaving: boolean;
  isSubmitting: boolean;
  onSaveDraft: () => void;
  onSaveSubmit: () => void;
}) {
  return (
    <div className="pos-header">
      <div>
        <Title level={4} style={{ marginBottom: 4 }}>
          POS Billing
        </Title>
        <Text type="secondary">Create bill quickly for walk-in or registered customers.</Text>
      </div>
      <DocumentActionBar
        canEdit
        isSaving={isSaving}
        isSubmitting={isSubmitting}
        onSaveDraft={onSaveDraft}
        onSaveSubmit={onSaveSubmit}
      />
    </div>
  );
}
