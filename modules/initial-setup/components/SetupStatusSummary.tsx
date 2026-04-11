"use client";

import { Alert, Card, Descriptions, Space, Tag, Typography } from "antd";

import type { SetupSectionKey, SetupStatusData } from "@/modules/initial-setup/types/initialSetup";
import { setupSections, statusColor, toUiStatus } from "@/modules/initial-setup/utils/statusMapper";

const { Text } = Typography;

export function SetupStatusSummary({ data }: { data: SetupStatusData | null }) {
  if (!data) {
    return (
      <Card title="Setup Status Summary">
        <Text type="secondary">Status will appear after backend sync.</Text>
      </Card>
    );
  }

  const sections = data.sections ?? {};

  return (
    <Card title="Setup Status Summary">
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 3 }} size="small" bordered>
          {setupSections.map((section) => {
            const statusData = sections[section.key as SetupSectionKey];
            const status = toUiStatus(statusData?.status ?? statusData?.code ?? "not_started");

            return (
              <Descriptions.Item key={section.key} label={section.label}>
                <Space direction="vertical" size={2}>
                  <Tag color={statusColor(status)} style={{ marginInlineEnd: 0 }}>
                    {status.replace("_", " ").toUpperCase()}
                  </Tag>
                  {statusData?.message ? <Text type="secondary">{statusData.message}</Text> : null}
                </Space>
              </Descriptions.Item>
            );
          })}
        </Descriptions>

        {data.message ? <Alert type="info" showIcon message={data.message} /> : null}
      </Space>
    </Card>
  );
}