"use client";

import { Space } from "antd";

import { SaveDraftButton } from "@/modules/buying/components/common/SaveDraftButton";
import { SaveSubmitButton } from "@/modules/buying/components/common/SaveSubmitButton";

export function DocumentActionBar({
  canEdit,
  isSaving,
  isSubmitting,
  onSaveDraft,
  onSaveSubmit
}: {
  canEdit: boolean;
  isSaving: boolean;
  isSubmitting: boolean;
  onSaveDraft: () => void;
  onSaveSubmit: () => void;
}) {
  if (!canEdit) {
    return null;
  }

  return (
    <Space>
      <SaveDraftButton loading={isSaving} disabled={isSubmitting} onClick={onSaveDraft} />
      <SaveSubmitButton loading={isSubmitting} disabled={isSaving} onClick={onSaveSubmit} />
    </Space>
  );
}
