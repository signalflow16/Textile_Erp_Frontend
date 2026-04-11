"use client";

import { Alert, Space, Tag, Typography } from "antd";

import type { ReadinessData } from "@/modules/initial-setup/types/initialSetup";

const { Text } = Typography;

export function ReadinessBanner({ readiness, isReady }: { readiness: ReadinessData | null; isReady: boolean }) {
  const missingSections = Array.isArray(readiness?.missing_sections) ? readiness.missing_sections : [];

  return (
    <Alert
      type={isReady ? "success" : "warning"}
      showIcon
      message={isReady ? "Ready for Item Creation" : "Initial setup is not complete yet"}
      description={
        <Space direction="vertical" size={8}>
          <Text>{readiness?.message || (isReady ? "You can proceed to Item Master." : "Complete pending sections first.")}</Text>
          {missingSections.length ? (
            <Space size={[6, 6]} wrap>
              {missingSections.map((section) => (
                <Tag key={section}>{section}</Tag>
              ))}
            </Space>
          ) : null}
        </Space>
      }
    />
  );
}