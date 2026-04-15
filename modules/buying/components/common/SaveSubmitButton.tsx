"use client";

import { Button } from "antd";

export function SaveSubmitButton({
  loading,
  disabled,
  onClick
}: {
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button type="primary" onClick={onClick} loading={loading} disabled={disabled}>
      Save and Submit
    </Button>
  );
}
