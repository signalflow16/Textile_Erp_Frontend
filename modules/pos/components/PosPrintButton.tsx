"use client";

import { PrinterOutlined } from "@ant-design/icons";
import { Button } from "antd";

export function PosPrintButton({
  disabled,
  onClick
}: {
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button icon={<PrinterOutlined />} disabled={disabled} onClick={onClick}>
      Print Preview
    </Button>
  );
}
