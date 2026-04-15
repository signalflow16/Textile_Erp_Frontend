"use client";

import { Button } from "antd";

export function SaveDraftButton({
  loading,
  disabled,
  onClick
}: {
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button onClick={onClick} loading={loading} disabled={disabled}>
      Save Draft
    </Button>
  );
}
