"use client";

import { Button, Divider, Space, Typography } from "antd";

const { Text } = Typography;

export function CreateNextActions({
  actions
}: {
  actions?: Array<{ label: string; href: string }>;
}) {
  if (!actions?.length) {
    return null;
  }

  return (
    <>
      <Divider style={{ margin: "14px 0" }} />
      <Space direction="vertical" size={8} style={{ width: "100%" }}>
        <Text type="secondary">Next step</Text>
        <Space wrap>
          {actions.map((action) => (
            <Button key={action.href} href={action.href}>
              {action.label}
            </Button>
          ))}
        </Space>
      </Space>
    </>
  );
}

