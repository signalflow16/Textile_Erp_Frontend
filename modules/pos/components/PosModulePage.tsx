"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, Card, Space, Spin, Typography } from "antd";
import { useRouter } from "next/navigation";

import { PosBillingPage } from "@/modules/pos/components/PosBillingPage";
import { useActivePosSession } from "@/modules/pos/hooks/useActivePosSession";
import { getActivePosSession } from "@/modules/pos/utils/posSessionService";

const { Text } = Typography;

export function PosModulePage() {
  const router = useRouter();
  const active = useActivePosSession();

  useEffect(() => {
    if (active.isLoading) {
      return;
    }

    if (!active.session) {
      router.replace("/pos/opening");
    }
  }, [active.isLoading, active.session, router]);

  if (active.isLoading) {
    return (
      <Card>
        <Space align="center">
          <Spin size="small" />
          <Text>Checking POS session...</Text>
        </Space>
      </Card>
    );
  }

  if (!active.session) {
    return (
      <Card>
        <Space direction="vertical" size={8}>
          <Text strong>Start POS session before billing</Text>
          <Text type="secondary">Redirecting to opening entry...</Text>
          <Link href="/pos/opening">
            <Button type="primary">Start Session</Button>
          </Link>
        </Space>
      </Card>
    );
  }

  return (
    <PosBillingPage
      session={active.session}
      onRefreshSession={() => {
        void getActivePosSession(async () => {
          const result = await active.refetch();
          return result.data ?? null;
        });
      }}
    />
  );
}
