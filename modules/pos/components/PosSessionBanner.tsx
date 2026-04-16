"use client";

import { Alert, Button, Space, Tag, Typography } from "antd";

import type { PosSession } from "@/modules/pos/types/pos";

const { Text } = Typography;

export function PosSessionBanner({
  session,
  onRefresh,
  onCloseSession
}: {
  session: PosSession;
  onRefresh?: () => void;
  onCloseSession?: () => void;
}) {
  const openingCash = session.opening_amounts
    .filter((row) => row.mode_of_payment.toLowerCase().includes("cash"))
    .reduce((sum, row) => sum + row.opening_amount, 0);

  return (
    <Alert
      type="info"
      showIcon
      message="POS session is active and ready for billing"
      description={
        <Space direction="vertical" size={4}>
          <Text>
            Session: <strong>{session.name}</strong> | Profile: <strong>{session.pos_profile}</strong>{" "}
            <Tag color="green">{session.status ?? "Open"}</Tag>
          </Text>
          <Text>
            Opening Cash: <strong>{openingCash.toFixed(2)}</strong>{" "}
            {session.company ? <Tag color="blue">{session.company}</Tag> : null}
          </Text>
          {session.opening_time ? (
            <Text type="secondary">Opened at {session.opening_time}</Text>
          ) : null}
          <Space>
            <Button size="small" onClick={onCloseSession}>
              Close Session
            </Button>
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
