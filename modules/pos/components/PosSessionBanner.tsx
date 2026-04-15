"use client";

import { Alert, Button, Space, Tag, Typography } from "antd";
import Link from "next/link";

import type { PosSession } from "@/modules/pos/types/pos";

const { Text } = Typography;

export function PosSessionBanner({
  session,
  onRefresh
}: {
  session: PosSession;
  onRefresh?: () => void;
}) {
  const openingCash = session.opening_amounts
    .filter((row) => row.mode_of_payment.toLowerCase().includes("cash"))
    .reduce((sum, row) => sum + row.opening_amount, 0);

  return (
    <Alert
      type="info"
      showIcon
      message="Add items, collect payment, and create bill"
      description={
        <Space direction="vertical" size={4}>
          <Text>
            Session: <strong>{session.name}</strong> | Profile: <strong>{session.pos_profile}</strong>
          </Text>
          <Text>
            Opening Cash: <strong>{openingCash.toFixed(2)}</strong>{" "}
            {session.company ? <Tag color="blue">{session.company}</Tag> : null}
          </Text>
          <Space>
            <Link href="/pos/closing">
              <Button size="small">Close Session</Button>
            </Link>
            {onRefresh ? (
              <Button size="small" type="link" onClick={onRefresh}>
                Refresh Session
              </Button>
            ) : null}
          </Space>
        </Space>
      }
    />
  );
}
